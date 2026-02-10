import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdmin } from "@/lib/auth";
import { getCurrentUserEmail } from "@/lib/clerk";
import type { Post } from "@/types/database";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const userEmail = await getCurrentUserEmail();
  const userIsAdmin = isAdmin(userEmail ?? undefined);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("posts").select("*").eq("slug", slug).single();
  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const post = data as Post;
  if (!post.published && !userIsAdmin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(post);
}
