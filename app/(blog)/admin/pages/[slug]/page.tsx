import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { PageForm } from "@/components/PageForm";

const PAGE_LABELS: Record<string, string> = {
  home: "Home",
  about: "About",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminEditPagePage({ params }: Props) {
  const { slug } = await params;
  if (!PAGE_LABELS[slug]) notFound();

  const supabase = getSupabaseAdmin();
  const { data: page, error } = await supabase.from("pages").select("*").eq("slug", slug).single();
  if (error || !page) notFound();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-light tracking-tight text-foreground">
        Edit {PAGE_LABELS[slug]}
      </h1>
      <PageForm
        slug={page.slug}
        defaultTitle={page.title}
        defaultBody={page.body}
      />
    </div>
  );
}
