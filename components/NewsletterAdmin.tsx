"use client";

import { useState } from "react";
import { formatInEET } from "@/lib/datetime";
import type { NewsletterSubscriber, NewsletterSend } from "@/types/database";

type PostOption = { id: string; title: string; slug: string };

interface NewsletterAdminProps {
  initialSubscribers: NewsletterSubscriber[];
  initialSends: NewsletterSend[];
  posts: PostOption[];
}

export function NewsletterAdmin({
  initialSubscribers,
  initialSends,
  posts,
}: NewsletterAdminProps) {
  const [subscribers] = useState(initialSubscribers);
  const [sends, setSends] = useState(initialSends);
  const [sendType, setSendType] = useState<"post" | "custom">("post");
  const [postId, setPostId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [bodyIsMarkdown, setBodyIsMarkdown] = useState(true);
  const [scheduleAt, setScheduleAt] = useState("");
  const [sendNow, setSendNow] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type: sendType,
        scheduled_at: sendNow ? undefined : scheduleAt || undefined,
      };
      if (sendType === "post") {
        if (!postId) {
          setError("Select a post");
          return;
        }
        payload.post_id = postId;
      } else {
        if (!subject.trim()) {
          setError("Subject is required");
          return;
        }
        if (!body.trim()) {
          setError("Body is required");
          return;
        }
        payload.subject = subject.trim();
        payload.body = body.trim();
        payload.body_is_markdown = bodyIsMarkdown;
      }
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to send");
        return;
      }
      if (data.scheduled) {
        setSuccess("Newsletter scheduled.");
        setSends((prev) => [data.send, ...prev]);
        if (sendType === "custom") {
          setSubject("");
          setBody("");
        } else setPostId("");
      } else {
        setSuccess(data.message ?? "Newsletter sent.");
        setSends((prev) => prev.map((s) => (s.id === data.send?.id ? { ...s, sent_at: data.send.sent_at } : s)));
        if (sendType === "custom") {
          setSubject("");
          setBody("");
        } else setPostId("");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Subscribers */}
      <section>
        <h2 className="text-lg font-light text-foreground mb-3">Subscribers</h2>
        <p className="text-sm text-foreground/70 font-light mb-4">
          {subscribers.filter((s) => s.confirmed_at).length} confirmed
        </p>
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm font-light">
            <thead>
              <tr className="border-b border-border bg-foreground/5">
                <th className="text-left py-2 px-3 text-foreground/80">Email</th>
                <th className="text-left py-2 px-3 text-foreground/80">Signed up</th>
                <th className="text-left py-2 px-3 text-foreground/80">Status</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 px-3 text-foreground/60">
                    No subscribers yet.
                  </td>
                </tr>
              ) : (
                subscribers.map((s) => (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="py-2 px-3 text-foreground">{s.email}</td>
                    <td className="py-2 px-3 text-foreground/80">
                      {formatInEET(s.created_at, { dateStyle: "medium" })}
                    </td>
                    <td className="py-2 px-3 text-foreground/80">
                      {s.confirmed_at ? "Confirmed" : "Pending"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Send newsletter */}
      <section>
        <h2 className="text-lg font-light text-foreground mb-3">Send newsletter</h2>
        <form onSubmit={submitSend} className="space-y-6 font-light max-w-xl">
          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}
          {success && (
            <p className="text-sm text-foreground/80" role="status">{success}</p>
          )}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sendType"
                checked={sendType === "post"}
                onChange={() => setSendType("post")}
                className="border border-border"
              />
              <span className="text-foreground/80">Send a post</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sendType"
                checked={sendType === "custom"}
                onChange={() => setSendType("custom")}
                className="border border-border"
              />
              <span className="text-foreground/80">Custom message</span>
            </label>
          </div>
          {sendType === "post" && (
            <div>
              <label htmlFor="post" className="block text-sm text-foreground/80 mb-1">Post</label>
              <select
                id="post"
                value={postId}
                onChange={(e) => setPostId(e.target.value)}
                className="w-full border border-border bg-background px-3 py-2 text-foreground font-light rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/30"
              >
                <option value="">Select a post</option>
                {posts.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}
          {sendType === "custom" && (
            <>
              <div>
                <label htmlFor="subject" className="block text-sm text-foreground/80 mb-1">Subject</label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-border bg-background px-3 py-2 text-foreground font-light rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/30"
                />
              </div>
              <div>
                <label htmlFor="body" className="block text-sm text-foreground/80 mb-1">Body</label>
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex items-center gap-2 text-sm text-foreground/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bodyIsMarkdown}
                      onChange={(e) => setBodyIsMarkdown(e.target.checked)}
                      className="border border-border rounded"
                    />
                    Markdown
                  </label>
                </div>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="w-full border border-border bg-background px-3 py-2 text-foreground font-light rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-y font-mono text-sm"
                />
              </div>
            </>
          )}
          <div>
            <div className="flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="when"
                  checked={sendNow}
                  onChange={() => setSendNow(true)}
                  className="border border-border"
                />
                <span className="text-foreground/80">Send now</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="when"
                  checked={!sendNow}
                  onChange={() => setSendNow(false)}
                  className="border border-border"
                />
                <span className="text-foreground/80">Schedule for</span>
              </label>
              {!sendNow && (
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className="border border-border bg-background px-3 py-2 text-foreground font-light rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/30"
                />
              )}
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 border border-foreground text-foreground font-light rounded-xl hover:bg-foreground hover:text-background disabled:opacity-50"
            >
              {submitting ? "Sending…" : sendNow ? "Send now" : "Schedule"}
            </button>
          </div>
        </form>
      </section>

      {/* Scheduled / sent */}
      <section>
        <h2 className="text-lg font-light text-foreground mb-3">Scheduled &amp; sent</h2>
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm font-light">
            <thead>
              <tr className="border-b border-border bg-foreground/5">
                <th className="text-left py-2 px-3 text-foreground/80">Subject</th>
                <th className="text-left py-2 px-3 text-foreground/80">Scheduled</th>
                <th className="text-left py-2 px-3 text-foreground/80">Status</th>
              </tr>
            </thead>
            <tbody>
              {sends.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 px-3 text-foreground/60">
                    No sends yet.
                  </td>
                </tr>
              ) : (
                sends.map((s) => (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="py-2 px-3 text-foreground">{s.subject}</td>
                    <td className="py-2 px-3 text-foreground/80">
                      {s.scheduled_at
                        ? formatInEET(s.scheduled_at, { dateStyle: "medium", timeStyle: "short" })
                        : "—"}
                    </td>
                    <td className="py-2 px-3 text-foreground/80">
                      {s.sent_at
                        ? `Sent ${formatInEET(s.sent_at, { dateStyle: "medium", timeStyle: "short" })}`
                        : s.scheduled_at
                          ? "Scheduled"
                          : "Draft"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
