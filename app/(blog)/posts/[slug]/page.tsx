import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCurrentUserEmail, getUserDisplayInfo, getUserDisplayInfoByEmail } from "@/lib/clerk";
import { unstable_noStore } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { MarkdownContent } from "@/components/MarkdownContent";
import { ShareButtons } from "@/components/ShareButtons";
import { LikeButton } from "@/components/LikeButton";
import { CommentSection, type Comment } from "@/components/CommentSection";
import { getReadingTimeMinutes } from "@/lib/reading-time";
import { formatInEET } from "@/lib/datetime";
import type { Post } from "@/types/database";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: Props) {
  unstable_noStore();
  const { slug } = await params;
  const { userId } = await auth();
  const userEmail = await getCurrentUserEmail();
  const userIsAdmin = isAdmin(userEmail ?? undefined);
  const supabase = getSupabaseAdmin();
  const { data: post, error } = await supabase.from("posts").select("*").eq("slug", slug).single();
  if (error || !post) notFound();
  const typedPost = post as Post;
  const isLive = typedPost.published && new Date(typedPost.published_at) <= new Date();
  if (!userIsAdmin && (!typedPost.published || !isLive)) notFound();

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", typedPost.id)
    .order("created_at", { ascending: true });

  const commentIds = (comments ?? []).map((c) => c.id);
  const commentsWithVotes: (typeof comments extends (infer C)[] | null ? C : never)[] = [];
  if (commentIds.length > 0) {
    const { data: votes } = await supabase.from("comment_votes").select("comment_id, user_id, vote").in("comment_id", commentIds);
    const scoreByComment: Record<string, number> = {};
    const userVoteByComment: Record<string, number> = {};
    (votes ?? []).forEach((v) => {
      scoreByComment[v.comment_id] = (scoreByComment[v.comment_id] ?? 0) + v.vote;
      if (userId && v.user_id === userId) {
        userVoteByComment[v.comment_id] = v.vote;
      }
    });
    commentsWithVotes.push(
      ...(comments ?? []).map((c) => ({
        ...c,
        voteScore: scoreByComment[c.id] ?? 0,
        userVote: userId ? (userVoteByComment[c.id] ?? 0) : 0,
      }))
    );
  }

  // Resolve display from Clerk: prefer lookup by comment's author_email (current name/photo), then by author_id.
  const commentList = comments ?? [];
  const authorEmails = [...new Set(commentList.map((c) => (c as { author_email?: string | null }).author_email).filter(Boolean) as string[])];
  const displayByEmail = new Map<string, { name: string | null; imageUrl: string | null }>();
  await Promise.all(
    authorEmails.map(async (email) => {
      const key = email.toLowerCase();
      if (displayByEmail.has(key)) return;
      const info = await getUserDisplayInfoByEmail(email);
      displayByEmail.set(key, info);
    })
  );

  const authorIds = [...new Set(commentList.map((c) => c.author_id))];
  const authorDisplayById = new Map<string, { name: string | null; imageUrl: string | null }>();
  const emailToDisplay = new Map<string, { name: string | null; imageUrl: string | null }>();
  const currentUserEmail = userId ? await getCurrentUserEmail() : null;
  const currentUserDisplay = userId ? await getUserDisplayInfo(userId) : null;
  if (currentUserEmail && currentUserDisplay) {
    emailToDisplay.set(currentUserEmail.toLowerCase(), { name: currentUserDisplay.name, imageUrl: currentUserDisplay.imageUrl });
  }
  const infos = await Promise.all(authorIds.map((id) => getUserDisplayInfo(id)));
  authorIds.forEach((id, i) => {
    const info = infos[i];
    const email = info.primaryEmail?.toLowerCase() ?? null;
    if (email && !emailToDisplay.has(email)) {
      emailToDisplay.set(email, { name: info.name, imageUrl: info.imageUrl });
    }
  });
  authorIds.forEach((id, i) => {
    const info = infos[i];
    const email = info.primaryEmail?.toLowerCase() ?? null;
    const unified = (email && emailToDisplay.get(email)) ?? { name: info.name, imageUrl: info.imageUrl };
    authorDisplayById.set(id, unified);
  });
  const commentsWithFreshAuthors = (commentsWithVotes as Comment[]).map((c) => {
    const raw = c as Comment & { author_email?: string | null };
    const byId = authorDisplayById.get(c.author_id);
    const byEmail = raw.author_email ? displayByEmail.get(raw.author_email.toLowerCase().trim()) : null;
    const name = byId?.name ?? byEmail?.name ?? raw.author_email ?? "Anonymous";
    const imageUrl = byId?.imageUrl ?? byEmail?.imageUrl ?? null;
    return {
      ...c,
      author_name: name,
      author_image_url: imageUrl,
    };
  });

  const { count: likeCount } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", typedPost.id);
  let userLiked = false;
  if (userId) {
    const { data: userLike } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", typedPost.id)
      .eq("user_id", userId)
      .maybeSingle();
    userLiked = !!userLike;
  }

  const { data: postTags } = await supabase.from("post_tags").select("tag_id").eq("post_id", typedPost.id);
  const tagIds = ((postTags ?? []) as { tag_id: string }[]).map((pt) => pt.tag_id);
  let postTagsList: { id: string; name: string }[] = [];
  if (tagIds.length > 0) {
    const { data: tags } = await supabase.from("tags").select("id, name").in("id", tagIds);
    postTagsList = (tags ?? []) as { id: string; name: string }[];
  }

  const readingMinutes = getReadingTimeMinutes(typedPost.content);
  const publishedAt = typedPost.published_at ? new Date(typedPost.published_at) : null;

  return (
    <article className="space-y-8">
      <Link href="/posts" prefetch={false} className="text-sm font-light text-foreground/60 hover:text-foreground">
        ← Posts
      </Link>
      <header>
        <h1 className="text-3xl font-light tracking-tight text-foreground">
          {typedPost.title}
        </h1>
        <div className="text-sm text-foreground/60 font-light mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {publishedAt && (
            <time dateTime={publishedAt.toISOString()}>
              {formatInEET(publishedAt.toISOString(), {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {" at "}
              {formatInEET(publishedAt.toISOString(), {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </time>
          )}
          <span>{readingMinutes} min read</span>
        </div>
        {(typedPost.author_name ?? typedPost.author_email) && (
          <span className="text-sm text-foreground/60 font-light mt-1 block">
            {typedPost.author_name ?? typedPost.author_email}
          </span>
        )}
        {postTagsList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {postTagsList.map((tag) => (
              <span
                key={tag.id}
                className="inline-block px-2 py-0.5 text-xs font-light rounded border border-foreground/20 text-foreground/70"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </header>
      <div className="font-light leading-relaxed">
        <MarkdownContent content={typedPost.content} />
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <LikeButton
          postId={typedPost.id}
          initialCount={likeCount ?? 0}
          initialLiked={userLiked}
          isSignedIn={!!userId}
        />
      </div>
      <ShareButtons title={typedPost.title} slug={typedPost.slug} />
      <CommentSection
        postId={typedPost.id}
        initialComments={commentsWithFreshAuthors}
        isAdmin={userIsAdmin}
        isSignedIn={!!userId}
      />
    </article>
  );
}
