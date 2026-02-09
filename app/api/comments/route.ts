import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentUserName } from "@/lib/clerk";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });
  }
  const body = await request.json();
  const postId = body?.postId;
  const commentBody = body?.body?.trim();
  const parentId = body?.parentId ?? null;
  if (!postId || typeof postId !== "string") {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }
  if (!commentBody || commentBody.length > 10000) {
    return NextResponse.json({ error: "Comment body required (max 10000 chars)" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  if (parentId != null && typeof parentId === "string") {
    const { data: parent } = await supabase.from("comments").select("id, post_id").eq("id", parentId).single();
    if (!parent || parent.post_id !== postId) {
      return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
    }
  }
  const authorName = await getCurrentUserName();
  const user = await currentUser();
  const imageUrl = user?.imageUrl ?? null;
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      parent_id: parentId && typeof parentId === "string" ? parentId : null,
      author_id: userId,
      author_name: authorName ?? "Anonymous",
      author_image_url: imageUrl,
      body: commentBody,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
