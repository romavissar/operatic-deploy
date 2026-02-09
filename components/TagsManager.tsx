"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tag = { id: string; name: string; slug: string };

interface TagsManagerProps {
  initialTags: Tag[];
}

export function TagsManager({ initialTags }: TagsManagerProps) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const createTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to create tag");
        return;
      }
      setTags((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTag = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/tags/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setTags((prev) => prev.filter((t) => t.id !== id));
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={createTag} className="flex flex-wrap items-end gap-2">
        <label htmlFor="tag-name" className="sr-only">
          New tag name
        </label>
        <input
          id="tag-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tag name"
          className="rounded-xl border border-border bg-background px-3 py-2 text-foreground font-light focus:outline-none focus:ring-1 focus:ring-foreground/30"
        />
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="rounded-xl px-4 py-2 border border-foreground text-foreground font-light hover:bg-foreground hover:text-background disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add tag"}
        </button>
      </form>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <ul className="space-y-2">
        {tags.length === 0 ? (
          <li className="text-foreground/60 font-light text-sm">No tags yet. Create one above.</li>
        ) : (
          tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center justify-between gap-4 py-2 border-b border-border"
            >
              <span className="font-light text-foreground">{tag.name}</span>
              <button
                type="button"
                onClick={() => deleteTag(tag.id)}
                disabled={deletingId === tag.id}
                className="text-sm font-light text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {deletingId === tag.id ? "Deleting…" : "Delete"}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
