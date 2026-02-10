import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";
import { formatInEET } from "@/lib/datetime";
import { DeletePostButton } from "@/components/DeletePostButton";
import type { Post } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("posts").select("id, title, slug, published, published_at").order("published_at", { ascending: false });
  const posts = (data ?? []) as Pick<Post, "id" | "title" | "slug" | "published" | "published_at">[];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-light tracking-tight text-foreground">
        Admin
      </h1>
      <Link
        href="/admin/new"
        className="inline-block text-sm font-light text-foreground underline underline-offset-2 hover:opacity-70"
      >
        New post
      </Link>
      <ul className="space-y-3">
        {posts?.length ? (
          posts.map((post) => {
            const at = post.published_at ? new Date(post.published_at) : null;
            const isScheduled = post.published && at && at > new Date();
            const status = !post.published ? "Draft" : isScheduled ? "Scheduled" : "Published";
            return (
            <li key={post.id} className="flex items-center justify-between gap-4 py-2 border-b border-border">
              <span className="font-light text-foreground">{post.title}</span>
              <span className="text-xs text-foreground/60">
                {status}
                {isScheduled && at && (
                  <span className="ml-1">({formatInEET(at.toISOString(), { dateStyle: "short", timeStyle: "short" })} EET)</span>
                )}
              </span>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/edit/${post.id}`}
                  className="text-sm font-light text-foreground/80 hover:text-foreground"
                >
                  Edit
                </Link>
                <DeletePostButton
                  postId={post.id}
                  postTitle={post.title}
                  className="text-sm font-light text-red-600 hover:text-red-700 disabled:opacity-50"
                />
              </div>
            </li>
          );
          })
        ) : (
          <li className="text-foreground/60 font-light">No posts.</li>
        )}
      </ul>
    </div>
  );
}
