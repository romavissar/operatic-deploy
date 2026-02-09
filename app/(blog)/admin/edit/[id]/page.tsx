import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { PostForm } from "@/components/PostForm";
import { DeletePostButton } from "@/components/DeletePostButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: post, error } = await supabase.from("posts").select("*").eq("id", id).single();
  if (error || !post) notFound();
  const { data: tags } = await supabase.from("tags").select("id, name").order("name");
  const { data: postTags } = await supabase.from("post_tags").select("tag_id").eq("post_id", id);
  const defaultTagIds = (postTags ?? []).map((pt) => pt.tag_id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-light tracking-tight text-foreground">
          Edit post
        </h1>
        <DeletePostButton
          postId={post.id}
          postTitle={post.title}
          className="text-sm font-light text-red-600 hover:text-red-700"
          redirectTo="/admin"
        />
      </div>
      <PostForm
        id={post.id}
        defaultTitle={post.title}
        defaultSlug={post.slug}
        defaultExcerpt={post.excerpt}
        defaultContent={post.content}
        defaultPublished={post.published}
        defaultPublishedAt={post.published_at}
        tags={tags ?? []}
        defaultTagIds={defaultTagIds}
      />
    </div>
  );
}
