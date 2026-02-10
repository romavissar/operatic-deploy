import { Resend } from "resend";
import { marked } from "marked";
import katex from "katex";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Post } from "@/types/database";

const BATCH_SIZE = 100;

/** Check if content between $ looks like LaTeX (has ^, _, \, =, etc.) to avoid treating "$5" as math. */
function looksLikeMath(content: string): boolean {
  return /[\\^_{}=]/.test(content);
}

/** Replace \( \), \[ \], $...$, and $$...$$ in str with KaTeX-rendered HTML (for email). Exported for use when building custom send HTML. */
export function renderMathInHtml(str: string): string {
  // First pass: normalize $$...$$ and $...$ to \[...\] and \(...\) so one loop can handle all
  let normalized = "";
  let i = 0;
  const len = str.length;
  while (i < len) {
    const dd = str.indexOf("$$", i);
    const d = str.indexOf("$", i);
    if (d === -1) {
      normalized += str.slice(i);
      break;
    }
    if (dd === d) {
      const end = str.indexOf("$$", dd + 2);
      if (end === -1) {
        normalized += str.slice(i, dd + 2);
        i = dd + 2;
        continue;
      }
      normalized += str.slice(i, dd) + "\\[" + str.slice(dd + 2, end).trim() + "\\]";
      i = end + 2;
      continue;
    }
    const afterD = str[d + 1];
    if (/[0-9]/.test(afterD ?? "")) {
      normalized += str.slice(i, d + 1);
      i = d + 1;
      continue;
    }
    const end = str.indexOf("$", d + 1);
    if (end === -1) {
      normalized += str.slice(i);
      break;
    }
    const content = str.slice(d + 1, end);
    if (looksLikeMath(content)) {
      normalized += str.slice(i, d) + "\\(" + content.trim() + "\\)";
      i = end + 1;
    } else {
      normalized += str.slice(i, d + 1);
      i = d + 1;
    }
  }
  str = normalized;

  let out = "";
  i = 0;
  const nlen = str.length;
  while (i < nlen) {
    const inlineStart = str.indexOf("\\(", i);
    const displayStart = str.indexOf("\\[", i);
    let next: { start: number; endMarker: string; display: boolean } | null = null;
    if (inlineStart !== -1 && (displayStart === -1 || inlineStart < displayStart)) {
      next = { start: inlineStart, endMarker: "\\)", display: false };
    } else if (displayStart !== -1) {
      next = { start: displayStart, endMarker: "\\]", display: true };
    }
    if (next === null) {
      out += str.slice(i);
      break;
    }
    out += str.slice(i, next.start);
    const contentStart = next.start + (next.display ? 2 : 2);
    let depth = 0;
    let j = contentStart;
    while (j < str.length) {
      if (str.slice(j, j + 2) === (next.display ? "\\]" : "\\)")) {
        if (depth === 0) break;
        depth--;
        j += 2;
        continue;
      }
      if (str.slice(j, j + 2) === (next.display ? "\\[" : "\\(")) {
        depth++;
        j += 2;
        continue;
      }
      j++;
    }
    const mathContent = str.slice(contentStart, j);
    j += next.endMarker.length;
    try {
      const html = katex.renderToString(mathContent.trim(), {
        displayMode: next.display,
        throwOnError: false,
        output: "html",
      });
      out += html;
    } catch {
      out += next.display ? "\\[" + mathContent + "\\]" : "\\(" + mathContent + "\\)";
    }
    i = j;
  }
  return out;
}

export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  return url || "http://localhost:3000";
}

/** Returns only subscribers that are confirmed (or all if not using double opt-in). */
export async function getConfirmedSubscriberEmails(): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("email")
    .not("confirmed_at", "is", null);
  if (error) throw error;
  return (data ?? []).map((r) => r.email);
}

function buildPostEmailHtml(post: Post, postUrl: string): string {
  let excerptHtml = "";
  if (post.excerpt) {
    const withMath = renderMathInHtml(post.excerpt);
    const fromMarkdown = marked.parse(withMath, { async: false }) as string;
    excerptHtml = `<div style="margin: 1em 0; color: #374151; line-height: 1.6;">${fromMarkdown}</div>`;
  }
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body { font-family: system-ui, sans-serif; } .katex { font-size: 1.1em; } .katex-display { margin: 0.75em 0; overflow-x: auto; }</style></head>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 1.5em;">
  <h1 style="font-size: 1.5em; font-weight: 600;">${escapeHtml(post.title)}</h1>
  ${excerptHtml}
  <p style="margin: 2.5em 0 2em;"><a href="${escapeHtml(postUrl)}" style="color: #2563eb; text-decoration: underline; font-size: 1.125em;">Read more →</a></p>
  <p style="margin-top: 2em; font-size: 0.875em; color: #6b7280;">You received this because you subscribed to our newsletter.</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildEmailForPost(
  post: Post,
  postUrl: string
): { subject: string; html: string } {
  return {
    subject: post.title,
    html: buildPostEmailHtml(post, postUrl),
  };
}

export function buildEmailForCustom(
  subject: string,
  body: string,
  isMarkdown: boolean
): { subject: string; html: string } {
  const bodyHtml = isMarkdown
    ? marked.parse(body, { async: false }) as string
    : `<p>${escapeHtml(body).replace(/\n/g, "</p><p>")}</p>`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 1.5em;">
  <div style="line-height: 1.6;">${bodyHtml}</div>
  <p style="margin-top: 2em; font-size: 0.875em; color: #6b7280;">You received this because you subscribed to our newsletter.</p>
</body>
</html>`;
  return { subject, html };
}

/** Domains Resend often rejects when using test sender (e.g. onboarding@resend.dev). */
const DISALLOWED_RECIPIENT_DOMAINS = ["example.com", "example.org", "example.net", "test.com", "localhost"];

function isAllowedRecipient(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return !DISALLOWED_RECIPIENT_DOMAINS.includes(domain);
}

/** Process one newsletter_send: load send, get subscribers, build content, send in batches, set sent_at. */
export async function processNewsletterSend(sendId: string): Promise<{ ok: boolean; error?: string; recipientCount?: number; testMode?: boolean }> {
  const supabase = getSupabaseAdmin();
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Newsletter <onboarding@resend.dev>";
  const testTo = process.env.RESEND_TEST_TO?.trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not set" };
  }

  const { data: send, error: sendError } = await supabase
    .from("newsletter_sends")
    .select("*")
    .eq("id", sendId)
    .single();

  if (sendError || !send) {
    return { ok: false, error: sendError?.message ?? "Send not found" };
  }
  if (send.sent_at) {
    return { ok: true }; // already sent
  }

  const all = await getConfirmedSubscriberEmails();
  const allowed = all.filter(isAllowedRecipient);
  const emails: string[] =
    allowed.length > 0
      ? allowed
      : testTo
        ? [testTo]
        : [];
  if (all.length > 0 && allowed.length === 0 && !testTo) {
    return {
      ok: false,
      error: "All subscribers use domains Resend rejects in test mode (e.g. example.com). Add RESEND_TEST_TO=your@email.com in .env to send a test, or add real subscriber emails.",
    };
  }
  if (emails.length === 0) {
    await supabase.from("newsletter_sends").update({ sent_at: new Date().toISOString() }).eq("id", sendId);
    return { ok: true, recipientCount: 0 };
  }

  const isTestSender = from.includes("onboarding@resend.dev");
  const hasExternalRecipients = emails.some((e) => !e.toLowerCase().endsWith("@resend.dev"));
  if (isTestSender && hasExternalRecipients) {
    return {
      ok: false,
      error:
        "Resend's test sender (onboarding@resend.dev) only allows sending to @resend.dev addresses, not Gmail or other domains. To send to your subscribers: (1) Verify your domain in the Resend dashboard, (2) Set RESEND_FROM=Newsletter <newsletter@yourdomain.com> in .env. Until then, use RESEND_TEST_TO=delivered@resend.dev to send a test to Resend's test inbox.",
    };
  }

  let subject: string;
  let html: string;

  if (send.post_id) {
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", send.post_id)
      .single();
    if (postError || !post) {
      return { ok: false, error: postError?.message ?? "Post not found" };
    }
    const postUrl = `${getSiteUrl()}/posts/${(post as Post).slug}`;
    const built = buildEmailForPost(post as Post, postUrl);
    subject = built.subject;
    html = built.html;
  } else {
    subject = send.subject;
    html = send.body_html ?? send.body_text ?? "";
    if (!html) {
      return { ok: false, error: "No body for custom send" };
    }
  }

  const resend = new Resend(apiKey);
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);
    const batch = chunk.map((to) => ({
      from,
      to: [to],
      subject,
      html,
    }));
    const { error: batchError } = await resend.batch.send(batch);
    if (batchError) {
      return { ok: false, error: batchError.message };
    }
  }

  await supabase.from("newsletter_sends").update({ sent_at: new Date().toISOString() }).eq("id", sendId);
  const usedTestOverride = allowed.length === 0 && !!testTo;
  return { ok: true, recipientCount: emails.length, testMode: usedTestOverride };
}
