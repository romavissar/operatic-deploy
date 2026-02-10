import { getSupabaseAdmin } from "@/lib/supabase";
import { PostForm } from "@/components/PostForm";
import type { Tag } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminNewPage() {
  const supabase = getSupabaseAdmin();
  const { data: tags } = await supabase.from("tags").select("id, name").order("name");
  const tagList = (tags ?? []) as Pick<Tag, "id" | "name">[];
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-light tracking-tight text-foreground">
        New post
      </h1>
      <PostForm tags={tagList} defaultTagIds={[]} />
    </div>
  );
}
