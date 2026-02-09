"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeletePostButtonProps {
  postId: string;
  postTitle: string;
  className?: string;
  /** After delete, navigate here (e.g. "/admin" when deleting from edit page). */
  redirectTo?: string;
}

export function DeletePostButton({ postId, postTitle, className, redirectTo }: DeletePostButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete “${postTitle}”? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to delete");
        return;
      }
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    } catch {
      alert("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className={className}
      aria-label={`Delete ${postTitle}`}
    >
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
