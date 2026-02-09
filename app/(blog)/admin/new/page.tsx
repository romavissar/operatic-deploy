import { getSupabaseAdmin } from "@/lib/supabase";
import { PostForm } from "@/components/PostForm";

export default async function AdminNewPage() {
  const supabase = getSupabaseAdmin();
  const { data: tags } = await supabase.from("tags").select("id, name").order("name");
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-light tracking-tight text-foreground">
        New post
      </h1>
      <PostForm tags={tags ?? []} defaultTagIds={[]} />
    </div>
  );
}
