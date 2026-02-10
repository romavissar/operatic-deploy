import { getSupabaseAdmin } from "@/lib/supabase";
import { TagsManager } from "@/components/TagsManager";
import type { Tag } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const supabase = getSupabaseAdmin();
  const { data: tags } = await supabase.from("tags").select("id, name, slug").order("name");
  const tagList = (tags ?? []) as Tag[];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-light tracking-tight text-foreground">
        Tags
      </h1>
      <p className="text-sm text-foreground/70 font-light">
        Create tags and assign them to posts when editing.
      </p>
      <TagsManager initialTags={tagList} />
    </div>
  );
}
