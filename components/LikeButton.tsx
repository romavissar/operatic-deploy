"use client";

import { useState } from "react";

interface LikeButtonProps {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  isSignedIn: boolean;
}

export function LikeButton({ postId, initialCount, initialLiked, isSignedIn }: LikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!isSignedIn || loading) return;
    setLoading(true);
    try {
      if (liked) {
        const res = await fetch(`/api/likes?postId=${encodeURIComponent(postId)}`, { method: "DELETE", credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setCount(data.count ?? count - 1);
          setLiked(false);
        }
      } else {
        const res = await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setCount(data.count ?? count + 1);
          setLiked(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm text-foreground/60 font-light">
      <button
        type="button"
        onClick={toggle}
        disabled={!isSignedIn || loading}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors ${
          liked
            ? "bg-red-500/10 border-red-500/40 text-red-600"
            : "border-foreground/20 hover:bg-foreground/5"
        } ${!isSignedIn ? "cursor-default opacity-80" : ""}`}
        title={!isSignedIn ? "Sign in to like" : liked ? "Unlike" : "Like"}
        aria-pressed={liked}
      >
        <span aria-hidden>♥</span>
        <span>{count} {count === 1 ? "like" : "likes"}</span>
      </button>
      {!isSignedIn && (
        <span className="text-foreground/50 text-xs">Sign in to like</span>
      )}
    </div>
  );
}
