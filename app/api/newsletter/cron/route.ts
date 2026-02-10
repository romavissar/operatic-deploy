import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { processNewsletterSend } from "@/lib/newsletter";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = authHeader?.replace(/^Bearer\s+/i, "") || request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret");
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data: due, error: fetchError } = await supabase
    .from("newsletter_sends")
    .select("id")
    .is("sent_at", null)
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", now);
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  const ids = (due ?? []).map((r) => r.id);
  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const id of ids) {
    const result = await processNewsletterSend(id);
    results.push({ id, ok: result.ok, error: result.error });
    if (!result.ok) {
      await supabase.from("newsletter_sends").update({ sent_at: now }).eq("id", id);
    }
  }
  return NextResponse.json({ processed: ids.length, results });
}

export async function POST(request: Request) {
  return GET(request);
}
