import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { newsletterSubscribeSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = newsletterSubscribeSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join("; ") || "Invalid email";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const email = parsed.data.email;

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("id, confirmed_at")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    if (existing.confirmed_at) {
      return NextResponse.json({ error: "This email is already subscribed." }, { status: 409 });
    }
    return NextResponse.json({ message: "You're already on the list. Check your inbox to confirm." });
  }

  const { error } = await supabase.from("newsletter_subscribers").insert({
    email,
    confirmed_at: new Date().toISOString(),
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "This email is already subscribed." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: "Thanks for subscribing!" });
}
