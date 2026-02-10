import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCurrentUserEmail, getUserDisplayInfo, getUserDisplayInfoByEmail } from "@/lib/clerk";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }
  const supabase = getSupabaseAdmin();
  const { data: comments, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const list = comments ?? [];
  const { userId } = await auth();

  let scoreByComment: Record<string, number> = {};
  let userVoteByComment: Record<string, number> = {};
  if (list.length > 0) {
    const commentIds = list.map((c) => c.id);
    const { data: votes } = await supabase
      .from("comment_votes")
      .select("comment_id, user_id, vote")
      .in("comment_id", commentIds);
    (votes ?? []).forEach((v) => {
      scoreByComment[v.comment_id] = (scoreByComment[v.comment_id] ?? 0) + v.vote;
      if (userId && v.user_id === userId) {
        userVoteByComment[v.comment_id] = v.vote;
      }
    });
  }

  const emailToOriginal = new Map<string, string>();
  list.forEach((c) => {
    const e = c.author_email;
    if (e && typeof e === "string") {
      const key = e.trim().toLowerCase();
      if (!emailToOriginal.has(key)) emailToOriginal.set(key, e.trim());
    }
  });
  const displayByEmail = new Map<string, { name: string | null; imageUrl: string | null }>();
  await Promise.all(
    [...emailToOriginal.entries()].map(async ([key, originalEmail]) => {
      const info = await getUserDisplayInfoByEmail(originalEmail);
      displayByEmail.set(key, info);
    })
  );

  const authorIds = [...new Set(list.map((c) => c.author_id))];
  const emailToDisplay = new Map<string, { name: string | null; imageUrl: string | null }>();
  const currentUserEmail = userId ? await getCurrentUserEmail() : null;
  const currentUserDisplay = userId ? await getUserDisplayInfo(userId) : null;
  if (currentUserEmail && currentUserDisplay) {
    emailToDisplay.set(currentUserEmail.toLowerCase(), { name: currentUserDisplay.name, imageUrl: currentUserDisplay.imageUrl });
  }
  const infos = await Promise.all(authorIds.map((id) => getUserDisplayInfo(id)));
  authorIds.forEach((id, i) => {
    const info = infos[i];
    const email = info.primaryEmail?.toLowerCase() ?? null;
    if (email && !emailToDisplay.has(email)) {
      emailToDisplay.set(email, { name: info.name, imageUrl: info.imageUrl });
    }
  });
  const authorDisplayById = new Map<string, { name: string | null; imageUrl: string | null }>();
  authorIds.forEach((id, i) => {
    const info = infos[i];
    const email = info.primaryEmail?.toLowerCase() ?? null;
    const unified = (email && emailToDisplay.get(email)) ?? { name: info.name, imageUrl: info.imageUrl };
    authorDisplayById.set(id, unified);
  });

  const resolved = list.map((c) => {
    const byId = authorDisplayById.get(c.author_id);
    const byEmail = c.author_email ? displayByEmail.get(c.author_email.toLowerCase().trim()) : null;
    const storedName = c.author_name?.trim() || null;
    const storedImage = c.author_image_url?.trim() || null;
    const name = storedName ?? byId?.name ?? byEmail?.name ?? c.author_email ?? "Anonymous";
    const imageUrl = storedImage ?? byId?.imageUrl ?? byEmail?.imageUrl ?? null;
    return {
      ...c,
      voteScore: scoreByComment[c.id] ?? 0,
      userVote: userId ? (userVoteByComment[c.id] ?? 0) : 0,
      author_name: name,
      author_image_url: imageUrl,
    };
  });

  return NextResponse.json(resolved);
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
  const authorEmail = await getCurrentUserEmail();
  const sessionUser = await currentUser();
  const first = sessionUser?.firstName?.trim();
  const last = sessionUser?.lastName?.trim();
  const nameFromSession = first || last ? [first, last].filter(Boolean).join(" ") : null;
  const imageFromSession = sessionUser?.imageUrl ?? null;
  const display = !nameFromSession || !imageFromSession ? await getUserDisplayInfo(userId) : null;
  const authorName = nameFromSession ?? display?.name ?? authorEmail ?? "Anonymous";
  const authorImageUrl = imageFromSession ?? display?.imageUrl ?? null;
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      parent_id: parentId && typeof parentId === "string" ? parentId : null,
      author_id: userId,
      author_name: authorName,
      author_email: authorEmail ?? null,
      author_image_url: authorImageUrl,
      body: commentBody,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    ...data,
    author_email: (data as { author_email?: string | null }).author_email ?? authorEmail ?? null,
    author_name: authorName,
    author_image_url: authorImageUrl,
  });
}
