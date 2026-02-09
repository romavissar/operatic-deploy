import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCurrentUserEmail } from "@/lib/clerk";
import { isAdmin } from "@/lib/auth";
import { MarkdownContent } from "@/components/MarkdownContent";
import { ShareButtons } from "@/components/ShareButtons";
import { LikeButton } from "@/components/LikeButton";
import { CommentSection, type Comment } from "@/components/CommentSection";
import { getReadingTimeMinutes } from "@/lib/reading-time";
import { formatInEET } from "@/lib/datetime";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const { userId } = await auth();
  const userEmail = await getCurrentUserEmail();
  const userIsAdmin = isAdmin(userEmail ?? undefined);
  const supabase = getSupabaseAdmin();
  const { data: post, error } = await supabase.from("posts").select("*").eq("slug", slug).single();
  if (error || !post) notFound();
  const isLive = post.published && new Date(post.published_at) <= new Date();
  if (!userIsAdmin && (!post.published || !isLive)) notFound();

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", post.id)
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

  const { count: likeCount } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", post.id);
  let userLiked = false;
  if (userId) {
    const { data: userLike } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", userId)
      .maybeSingle();
    userLiked = !!userLike;
  }

  const { data: postTags } = await supabase.from("post_tags").select("tag_id").eq("post_id", post.id);
  const tagIds = (postTags ?? []).map((pt) => pt.tag_id);
  let postTagsList: { id: string; name: string }[] = [];
  if (tagIds.length > 0) {
    const { data: tags } = await supabase.from("tags").select("id, name").in("id", tagIds);
    postTagsList = tags ?? [];
  }

  const readingMinutes = getReadingTimeMinutes(post.content);
  const publishedAt = post.published_at ? new Date(post.published_at) : null;

  return (
    <article className="space-y-8">
      <Link href="/posts" className="text-sm font-light text-foreground/60 hover:text-foreground">
        ← Posts
      </Link>
      <header>
        <h1 className="text-3xl font-light tracking-tight text-foreground">
          {post.title}
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
        {(post.author_name ?? post.author_email) && (
          <span className="text-sm text-foreground/60 font-light mt-1 block">
            {post.author_name ?? post.author_email}
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
        <MarkdownContent content={post.content} />
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <LikeButton
          postId={post.id}
          initialCount={likeCount ?? 0}
          initialLiked={userLiked}
          isSignedIn={!!userId}
        />
      </div>
      <ShareButtons title={post.title} slug={post.slug} />
      <CommentSection
        postId={post.id}
        initialComments={commentsWithVotes as Comment[]}
        isAdmin={userIsAdmin}
        isSignedIn={!!userId}
      />
    </article>
  );
}
