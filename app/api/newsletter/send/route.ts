import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUserEmail } from "@/lib/clerk";
import { isAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { processNewsletterSend, renderMathInHtml, sendTestNewsletter } from "@/lib/newsletter";
import { marked } from "marked";

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
  const isTest = Boolean(body.test);
  const type = body.type === "custom" ? "custom" : "post";
  const postId = type === "post" ? body.post_id : undefined;
  const subject = type === "custom" ? body.subject : undefined;
  const bodyContent = type === "custom" ? body.body : undefined;
  const bodyIsMarkdown = type === "custom" ? Boolean(body.body_is_markdown) : undefined;
  const scheduledAt = typeof body.scheduled_at === "string" && body.scheduled_at.trim() ? body.scheduled_at : undefined;

  if (type === "post" && !postId) {
    return NextResponse.json({ error: "post_id required when type is post" }, { status: 400 });
  }
  if (type === "custom") {
    if (!subject?.trim()) return NextResponse.json({ error: "subject required for custom send" }, { status: 400 });
    if (!bodyContent?.trim()) return NextResponse.json({ error: "body required for custom send" }, { status: 400 });
  }

  if (isTest) {
    const payload =
      type === "post"
        ? { type: "post" as const, post_id: postId! }
        : {
            type: "custom" as const,
            subject: subject!,
            body: bodyContent!,
            body_is_markdown: Boolean(bodyIsMarkdown),
          };
    const result = await sendTestNewsletter(payload);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Test send failed" }, { status: 500 });
    }
    return NextResponse.json({
      test: true,
      message: `Test newsletter sent to ${"romavissar@gmail.com"}.`,
    });
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

  if (type === "post") {
    const { data: post } = await supabase.from("posts").select("id, title").eq("id", postId).single();
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (isScheduled) {
      const { data: send, error: insertErr } = await supabase
        .from("newsletter_sends")
        .insert({
          subject: post.title,
          body_html: null,
          body_text: null,
          post_id: postId,
          scheduled_at: scheduledAt,
          sent_at: null,
        })
        .select()
        .single();
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
      return NextResponse.json({ scheduled: true, send });
    }
    const { data: send, error: insertErr } = await supabase
      .from("newsletter_sends")
      .insert({
        subject: post.title,
        body_html: null,
        body_text: null,
        post_id: postId,
        scheduled_at: null,
        sent_at: null,
      })
      .select()
      .single();
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
    const result = await processNewsletterSend(send.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 500 });
    }
    const { data: updated } = await supabase.from("newsletter_sends").select("sent_at").eq("id", send.id).single();
    const message = result.testMode
      ? `Sent to your test address (RESEND_TEST_TO). Check your inbox and spam folder. If you used delivered@resend.dev, it does not deliver to a real inbox—use your own email in RESEND_TEST_TO to receive it.`
      : result.recipientCount != null
        ? `Sent to ${result.recipientCount} recipient${result.recipientCount === 1 ? "" : "s"}.`
        : undefined;
    return NextResponse.json({ sent: true, send: { ...send, sent_at: updated?.sent_at ?? now }, message });
  }

  const bodyForHtml = bodyIsMarkdown ? renderMathInHtml(bodyContent) : bodyContent;
  const html = bodyIsMarkdown
    ? (await marked.parse(bodyForHtml)) as string
    : bodyContent;
  const text = bodyContent;

  if (isScheduled) {
    const { data: send, error: insertErr } = await supabase
      .from("newsletter_sends")
      .insert({
        subject: subject!,
        body_html: html,
        body_text: text,
        post_id: null,
        scheduled_at: scheduledAt,
        sent_at: null,
      })
      .select()
      .single();
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
    return NextResponse.json({ scheduled: true, send });
  }

  const { data: send, error: insertErr } = await supabase
    .from("newsletter_sends")
    .insert({
      subject: subject!,
      body_html: html,
      body_text: text,
      post_id: null,
      scheduled_at: null,
      sent_at: null,
    })
    .select()
    .single();
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  const result = await processNewsletterSend(send.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 500 });
  }
  const { data: updated } = await supabase.from("newsletter_sends").select("sent_at").eq("id", send.id).single();
  const message = result.testMode
    ? `Sent to your test address (RESEND_TEST_TO). Check your inbox and spam folder. If you used delivered@resend.dev, it does not deliver to a real inbox—use your own email in RESEND_TEST_TO to receive it.`
    : result.recipientCount != null
      ? `Sent to ${result.recipientCount} recipient${result.recipientCount === 1 ? "" : "s"}.`
      : undefined;
  return NextResponse.json({ sent: true, send: { ...send, sent_at: updated?.sent_at ?? now }, message });
}
