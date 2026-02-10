import { getSupabaseAdmin } from "@/lib/supabase";
import { NewsletterAdmin } from "@/components/NewsletterAdmin";
import type { NewsletterSubscriber, NewsletterSend, Post } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const [subsRes, sendsRes, postsRes] = await Promise.all([
    supabase.from("newsletter_subscribers").select("id, email, created_at, confirmed_at").order("created_at", { ascending: false }),
    supabase.from("newsletter_sends").select("id, subject, post_id, scheduled_at, sent_at, created_at").order("created_at", { ascending: false }),
    supabase.from("posts").select("id, title, slug").eq("published", true).lte("published_at", now).order("published_at", { ascending: false }),
  ]);
  const subscribers = (subsRes.data ?? []) as NewsletterSubscriber[];
  const sends = (sendsRes.data ?? []) as NewsletterSend[];
  const posts = (postsRes.data ?? []) as Pick<Post, "id" | "title" | "slug">[];

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-light tracking-tight text-foreground">
        Newsletter
      </h1>
      <NewsletterAdmin
        initialSubscribers={subscribers}
        initialSends={sends}
        posts={posts}
      />
    </div>
  );
}
