"use client";

import { useState, useEffect, useRef } from "react";
import { formatInEET } from "@/lib/datetime";

export type Comment = {
  id: string;
  post_id: string;
  parent_id?: string | null;
  author_id: string;
  author_name: string;
  author_email?: string | null;
  author_image_url: string | null;
  body: string;
  created_at: string;
  voteScore?: number;
  userVote?: number; // -1, 0, or 1
};

interface CommentSectionProps {
  postId: string;
  initialComments: Comment[];
  isAdmin: boolean;
  isSignedIn: boolean;
}

function formatDateTime(iso: string): string {
  return formatInEET(iso, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface CommentItemProps {
  comment: Comment;
  /** Display name stored on the comment when it was made */
  displayName: string;
  /** Profile image URL stored on the comment when it was made */
  displayImageUrl: string | null;
  getReplies: (parentId: string) => Comment[];
  isAdmin: boolean;
  isSignedIn: boolean;
  replyingToId: string | null;
  replyBody: string;
  submittingReply: boolean;
  deletingId: string | null;
  votingId: string | null;
  collapsedIds: Set<string>;
  onToggleCollapsed: (id: string) => void;
  onSetReplyingToId: (id: string | null) => void;
  onReplyBodyChange: (value: string) => void;
  onReplySubmit: (e: React.FormEvent, parentId: string) => void;
  onVote: (commentId: string, vote: 1 | -1) => void;
  onDelete: (id: string) => void;
  formatDateTime: (iso: string) => string;
  depth: number;
}

function CommentItem({
  comment: c,
  displayName,
  displayImageUrl,
  getReplies,
  isAdmin,
  isSignedIn,
  replyingToId,
  replyBody,
  submittingReply,
  deletingId,
  votingId,
  collapsedIds,
  onToggleCollapsed,
  onSetReplyingToId,
  onReplyBodyChange,
  onReplySubmit,
  onVote,
  onDelete,
  formatDateTime: fmt,
  depth,
}: CommentItemProps) {
  const replies = getReplies(c.id);
  const isCollapsed = replies.length > 0 && collapsedIds.has(c.id);
  const logged = useRef(false);
  useEffect(() => {
    if (!logged.current) {
      console.log("Comment:", displayName, "—", c.body);
      logged.current = true;
    }
  }, [c.id, displayName, c.body]);
  return (
    <li className={depth > 0 ? "mt-4" : ""}>
      <div className={`flex gap-4 ${depth > 0 ? "pl-6 border-l-2 border-foreground/10" : ""}`}>
        <div className="flex-shrink-0">
          {displayImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayImageUrl}
              alt=""
              width={40}
              height={40}
              className="rounded-full object-cover w-10 h-10"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full bg-foreground/20 flex items-center justify-center text-foreground/60 text-sm font-light"
              aria-hidden
            >
              {(displayName || "?")[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-light text-foreground text-sm">
              {displayName}
            </span>
            <time className="text-xs text-foreground/60 font-light" dateTime={c.created_at}>
              {fmt(c.created_at)}
            </time>
            {isAdmin && (
              <button
                type="button"
                onClick={() => onDelete(c.id)}
                disabled={deletingId === c.id}
                className="text-xs text-red-600 hover:text-red-700 font-light disabled:opacity-50"
              >
                {deletingId === c.id ? "Deleting…" : "Delete"}
              </button>
            )}
            {isSignedIn && (
              <button
                type="button"
                onClick={() => onSetReplyingToId(replyingToId === c.id ? null : c.id)}
                className="text-xs text-foreground/60 hover:text-foreground font-light"
              >
                {replyingToId === c.id ? "Cancel" : "Reply"}
              </button>
            )}
          </div>
          <p className="text-foreground/80 font-light text-sm mt-1 whitespace-pre-wrap break-words">
            {c.body}
          </p>
          <div className="flex items-center gap-1 mt-2">
            <button
              type="button"
              onClick={() => onVote(c.id, 1)}
              disabled={!isSignedIn || votingId === c.id}
              className={`w-8 h-8 flex items-center justify-center rounded border text-xs font-light disabled:opacity-50 ${
                c.userVote === 1 ? "border-foreground/50 bg-foreground/10" : "border-foreground/20 hover:bg-foreground/5"
              }`}
              title={!isSignedIn ? "Sign in to vote" : "Upvote"}
              aria-label="Upvote"
            >
              ↑
            </button>
            <span className="text-xs text-foreground/60 font-light min-w-[1.5rem] text-center" aria-live="polite">
              {(c.voteScore ?? 0)}
            </span>
            <button
              type="button"
              onClick={() => onVote(c.id, -1)}
              disabled={!isSignedIn || votingId === c.id}
              className={`w-8 h-8 flex items-center justify-center rounded border text-xs font-light disabled:opacity-50 ${
                c.userVote === -1 ? "border-foreground/50 bg-foreground/10" : "border-foreground/20 hover:bg-foreground/5"
              }`}
              title={!isSignedIn ? "Sign in to vote" : "Downvote"}
              aria-label="Downvote"
            >
              ↓
            </button>
          </div>
          {replyingToId === c.id && (
            <form onSubmit={(e) => onReplySubmit(e, c.id)} className="mt-3 space-y-2">
              <textarea
                value={replyBody}
                onChange={(e) => onReplyBodyChange(e.target.value)}
                placeholder="Write a reply…"
                rows={2}
                className="w-full border border-border bg-background px-3 py-2 text-foreground font-light text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-y"
                maxLength={10000}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submittingReply || !replyBody.trim()}
                  className="px-3 py-1.5 border border-foreground text-foreground font-light text-sm rounded-xl hover:bg-foreground hover:text-background disabled:opacity-50"
                >
                  {submittingReply ? "Posting…" : "Post reply"}
                </button>
                <button
                  type="button"
                  onClick={() => { onSetReplyingToId(null); onReplyBodyChange(""); }}
                  className="px-3 py-1.5 text-foreground/70 font-light text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {replies.length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => onToggleCollapsed(c.id)}
                className="flex items-center gap-1.5 text-xs text-foreground/60 font-light hover:text-foreground"
                aria-expanded={!isCollapsed}
                aria-label={isCollapsed ? `Show ${replies.length} ${replies.length === 1 ? "reply" : "replies"}` : "Hide replies"}
              >
                <span className="inline-block w-4 text-center" aria-hidden>
                  {isCollapsed ? "▶" : "▼"}
                </span>
                {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </button>
              {!isCollapsed && (
                <ul className="space-y-4 mt-2 list-none">
                  {replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      displayName={reply.author_name || "Anonymous"}
                      displayImageUrl={reply.author_image_url ?? null}
                      getReplies={getReplies}
                      isAdmin={isAdmin}
                      isSignedIn={isSignedIn}
                      replyingToId={replyingToId}
                      replyBody={replyBody}
                      submittingReply={submittingReply}
                      deletingId={deletingId}
                      votingId={votingId}
                      collapsedIds={collapsedIds}
                      onToggleCollapsed={onToggleCollapsed}
                      onSetReplyingToId={onSetReplyingToId}
                      onReplyBodyChange={onReplyBodyChange}
                      onReplySubmit={onReplySubmit}
                      onVote={onVote}
                      onDelete={onDelete}
                      formatDateTime={fmt}
                      depth={depth + 1}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export function CommentSection({
  postId,
  initialComments,
  isAdmin,
  isSignedIn,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!postId) return;
    fetch(`/api/comments?postId=${encodeURIComponent(postId)}`, { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) setComments(data as Comment[]);
      })
      .catch(() => {});
  }, [postId]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleCollapsed = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const roots = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parent_id === parentId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const handleVote = async (commentId: string, vote: 1 | -1) => {
    if (!isSignedIn || votingId) return;
    setVotingId(commentId);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, voteScore: data.score ?? (c.voteScore ?? 0) + vote, userVote: data.userVote ?? vote }
              : c
          )
        );
      }
    } finally {
      setVotingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, body: trimmed }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to post comment");
        return;
      }
      setBody("");
      setComments((prev) => [...prev, { ...data, voteScore: 0, userVote: 0 }]);
    } catch {
      setError("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const getDescendantIds = (id: string): Set<string> => {
    const set = new Set<string>([id]);
    let added = 1;
    while (added) {
      added = 0;
      comments.forEach((c) => {
        if (c.parent_id && set.has(c.parent_id) && !set.has(c.id)) {
          set.add(c.id);
          added++;
        }
      });
    }
    return set;
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Delete this comment?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        const toRemove = getDescendantIds(id);
        setComments((prev) => prev.filter((c) => !toRemove.has(c.id)));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    const trimmed = replyBody.trim();
    if (!trimmed || !replyingToId) return;
    setSubmittingReply(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, body: trimmed, parentId }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to post reply");
        return;
      }
      setComments((prev) => [...prev, { ...data, voteScore: 0, userVote: 0 }]);
      setReplyingToId(null);
      setReplyBody("");
    } catch {
      setError("Failed to post reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <section className="space-y-6 pt-8 border-t border-border">
      <h2 className="text-xl font-light tracking-tight text-foreground">
        Comments
      </h2>
      {isSignedIn && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <p className="text-sm text-red-600 font-light" role="alert">
              {error}
            </p>
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a comment…"
            rows={3}
            className="w-full border border-border bg-background px-3 py-2 text-foreground font-light text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-y"
            maxLength={10000}
          />
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="px-4 py-2 border border-foreground text-foreground font-light text-sm rounded-xl hover:bg-foreground hover:text-background disabled:opacity-50"
          >
            {submitting ? "Posting…" : "Post comment"}
          </button>
        </form>
      )}
      {!isSignedIn && (
        <p className="text-sm text-foreground/60 font-light">
          Sign in to leave a comment.
        </p>
      )}
      <ul className="space-y-6">
        {comments.length === 0 ? (
          <li className="text-foreground/60 font-light text-sm">No comments yet.</li>
        ) : (
          roots.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              displayName={c.author_name || "Anonymous"}
              displayImageUrl={c.author_image_url ?? null}
              getReplies={getReplies}
              isAdmin={isAdmin}
              isSignedIn={isSignedIn}
              replyingToId={replyingToId}
              replyBody={replyBody}
              submittingReply={submittingReply}
              deletingId={deletingId}
              votingId={votingId}
              collapsedIds={collapsedIds}
              onToggleCollapsed={toggleCollapsed}
              onSetReplyingToId={setReplyingToId}
              onReplyBodyChange={setReplyBody}
              onReplySubmit={handleReplySubmit}
              onVote={handleVote}
              onDelete={handleDelete}
              formatDateTime={formatDateTime}
              depth={0}
            />
          ))
        )}
      </ul>
    </section>
  );
}
