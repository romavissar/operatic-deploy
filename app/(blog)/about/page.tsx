import { getSupabaseAdmin } from "@/lib/supabase";
import { MarkdownContent } from "@/components/MarkdownContent";

const DEFAULT_ABOUT = {
  title: "About",
  body: `This is a minimal blog focused on operations research: optimization, linear and integer programming, and decision science.

Built with Next.js, Clerk, and Supabase. Black and white, thin type, no clutter.`,
};

export default async function AboutPage() {
  const supabase = getSupabaseAdmin();
  const { data: page } = await supabase.from("pages").select("title, body").eq("slug", "about").single() as { data: { title: string; body: string } | null };
  const title = page?.title ?? DEFAULT_ABOUT.title;
  const body = page?.body ?? DEFAULT_ABOUT.body;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-light tracking-tight text-foreground">
        {title}
      </h1>
      <div className="text-foreground/80 font-light leading-relaxed max-w-lg prose-markdown">
        <MarkdownContent content={body} />
      </div>
    </div>
  );
}
