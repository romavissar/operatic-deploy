import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";
import { MarkdownContent } from "@/components/MarkdownContent";

export const dynamic = "force-dynamic";

const DEFAULT_HOME = {
  title: "operatic",
  body: "A minimal blog on optimization, linear programming, and decision science.",
};

export default async function HomePage() {
  const supabase = getSupabaseAdmin();
  const { data: page } = await supabase.from("pages").select("title, body").eq("slug", "home").single() as { data: { title: string; body: string } | null };
  const title = page?.title ?? DEFAULT_HOME.title;
  const body = page?.body ?? DEFAULT_HOME.body;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-light tracking-tight text-foreground">
        {title}
      </h1>
      <div className="text-foreground/80 font-light leading-relaxed max-w-lg prose-markdown">
        <MarkdownContent content={body} />
      </div>
      <Link
        href="/posts"
        prefetch={false}
        className="inline-block text-foreground font-light underline underline-offset-2 hover:opacity-70"
      >
        Read posts →
      </Link>
    </div>
  );
}
