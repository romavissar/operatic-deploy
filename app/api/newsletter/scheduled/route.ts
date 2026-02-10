import { NextResponse } from "next/server";
import { getCurrentUserEmail } from "@/lib/clerk";
import { isAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const userEmail = await getCurrentUserEmail();
  if (!isAdmin(userEmail ?? undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("newsletter_sends")
    .select("id, subject, post_id, scheduled_at, sent_at, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
