import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdmin } from "@/lib/auth";
import { getCurrentUserEmail } from "@/lib/clerk";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("tags").select("id, name, slug").order("name");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userEmail = await getCurrentUserEmail();
  if (!isAdmin(userEmail ?? undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (!slug) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("tags").insert({ name, slug }).select().single();
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "A tag with that name already exists" }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
