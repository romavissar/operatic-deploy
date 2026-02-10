import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { PostForm } from "@/components/PostForm";
import { DeletePostButton } from "@/components/DeletePostButton";
import type { Post } from "@/types/database";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: post, error } = await supabase.from("posts").select("*").eq("id", id).single();
  if (error || !post) notFound();
  const typedPost = post as Post;
  const { data: tags } = await supabase.from("tags").select("id, name").order("name");
  const { data: postTags } = await supabase.from("post_tags").select("tag_id").eq("post_id", id);
  const defaultTagIds = ((postTags ?? []) as { tag_id: string }[]).map((pt) => pt.tag_id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-light tracking-tight text-foreground">
          Edit post
        </h1>
        <DeletePostButton
          postId={typedPost.id}
          postTitle={typedPost.title}
          className="text-sm font-light text-red-600 hover:text-red-700"
          redirectTo="/admin"
        />
      </div>
      <PostForm
        id={typedPost.id}
        defaultTitle={typedPost.title}
        defaultSlug={typedPost.slug}
        defaultExcerpt={typedPost.excerpt}
        defaultContent={typedPost.content}
        defaultPublished={typedPost.published}
        defaultPublishedAt={typedPost.published_at}
        tags={tags ?? []}
        defaultTagIds={defaultTagIds}
      />
    </div>
  );
}
