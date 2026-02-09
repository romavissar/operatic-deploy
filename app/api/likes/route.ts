import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }
  const { userId } = await auth();
  const supabase = getSupabaseAdmin();
  const { count, error: countError } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }
  let liked = false;
  if (userId) {
    const { data: existing } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();
    liked = !!existing;
  }
  return NextResponse.json({ count: count ?? 0, liked });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to like" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const postId = body?.postId;
  if (!postId || typeof postId !== "string") {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: userId });
  if (error) {
    if (error.code === "23505") {
      const { count: c } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", postId);
      return NextResponse.json({ count: c ?? 0, liked: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { count } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", postId);
  return NextResponse.json({ count: count ?? 1, liked: true });
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to unlike" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
  const { count } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", postId);
  return NextResponse.json({ count: count ?? 0, liked: false });
}
