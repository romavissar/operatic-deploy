import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdmin } from "@/lib/auth";
import { getCurrentUserEmail, getCurrentUserName } from "@/lib/clerk";
import { createPostSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const admin = searchParams.get("admin") === "true";
  const userEmail = await getCurrentUserEmail();
  const userIsAdmin = isAdmin(userEmail ?? undefined);

  const supabase = getSupabaseAdmin();
  let query = supabase.from("posts").select("*").order("published_at", { ascending: false });

  if (!admin || !userIsAdmin) {
    const now = new Date().toISOString();
    query = query.eq("published", true).lte("published_at", now);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
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
  const authorName = await getCurrentUserName();

  const body = await request.json();
  const parsed = createPostSchema.safeParse({
    ...body,
    published_at: body.published_at ?? new Date().toISOString(),
  });
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join("; ") || "Validation failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
      published_at: parsed.data.published_at ?? new Date().toISOString(),
      excerpt: parsed.data.excerpt,
      content: parsed.data.content,
      published: parsed.data.published,
      author_email: userEmail ?? null,
      author_name: authorName ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const tagIds = parsed.data.tag_ids ?? [];
  if (tagIds.length > 0 && data) {
    await supabase.from("post_tags").insert(tagIds.map((tag_id) => ({ post_id: data.id, tag_id })));
  }
  return NextResponse.json(data);
}
