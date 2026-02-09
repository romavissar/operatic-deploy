import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCurrentUserEmail } from "@/lib/clerk";
import { isAdmin } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to vote" }, { status: 401 });
  }
  const { id: commentId } = await params;
  const body = await request.json().catch(() => ({}));
  const vote = body?.vote;
  if (vote !== 1 && vote !== -1) {
    return NextResponse.json({ error: "vote must be 1 or -1" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("comment_votes")
    .upsert({ comment_id: commentId, user_id: userId, vote }, { onConflict: "comment_id,user_id" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { data: rows } = await supabase
    .from("comment_votes")
    .select("vote")
    .eq("comment_id", commentId);
  const score = (rows ?? []).reduce((s, r) => s + r.vote, 0);
  return NextResponse.json({ score, userVote: vote });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userEmail = await getCurrentUserEmail();
  if (!isAdmin(userEmail ?? undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
