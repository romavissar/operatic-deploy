import { getSupabaseAdmin } from "@/lib/supabase";
import { getReadingTimeMinutes } from "@/lib/reading-time";
import { PostsListWithSearch } from "@/components/PostsListWithSearch";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const query = supabase
    .from("posts")
    .select("id, title, slug, published_at, excerpt, published, author_name, author_email, content")
    .eq("published", true)
    .lte("published_at", now)
    .order("published_at", { ascending: false });
  const { data: rawPosts } = await query;
  const postIds = (rawPosts ?? []).map((p) => p.id);
  const likeCountByPost: Record<string, number> = {};
  const tagsByPostId: Record<string, { id: string; name: string }[]> = {};
  if (postIds.length > 0) {
    const { data: likes } = await supabase.from("likes").select("post_id").in("post_id", postIds);
    (likes ?? []).forEach(({ post_id }) => {
      likeCountByPost[post_id] = (likeCountByPost[post_id] ?? 0) + 1;
    });
    const { data: postTags } = await supabase.from("post_tags").select("post_id, tag_id").in("post_id", postIds);
    const tagIds = [...new Set((postTags ?? []).map((pt) => pt.tag_id))];
    const { data: tags } = await supabase.from("tags").select("id, name").in("id", tagIds);
    const tagMap = new Map((tags ?? []).map((t) => [t.id, t]));
    (postTags ?? []).forEach(({ post_id, tag_id }) => {
      const tag = tagMap.get(tag_id);
      if (tag) {
        if (!tagsByPostId[post_id]) tagsByPostId[post_id] = [];
        tagsByPostId[post_id].push(tag);
      }
    });
  }
  const posts = (rawPosts ?? []).map(({ content, ...post }) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    published_at: post.published_at,
    excerpt: post.excerpt,
    published: post.published,
    author_name: post.author_name,
    author_email: post.author_email,
    readingMinutes: getReadingTimeMinutes(content ?? ""),
    likeCount: likeCountByPost[post.id] ?? 0,
    tags: tagsByPostId[post.id] ?? [],
  }));

  return <PostsListWithSearch posts={posts} />;
}
