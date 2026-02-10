"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toEETLocalInput, fromEETLocalInput, nowEETLocalInput, formatInEET } from "@/lib/datetime";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

type TagOption = { id: string; name: string };

interface PostFormProps {
  id?: string;
  defaultTitle?: string;
  defaultSlug?: string;
  defaultExcerpt?: string;
  defaultContent?: string;
  defaultPublished?: boolean;
  defaultPublishedAt?: string;
  tags?: TagOption[];
  defaultTagIds?: string[];
}

export function PostForm({
  id,
  defaultTitle = "",
  defaultSlug = "",
  defaultExcerpt = "",
  defaultContent = "",
  defaultPublished = false,
  defaultPublishedAt,
  tags = [],
  defaultTagIds = [],
}: PostFormProps) {
  const initialPublishedAt = defaultPublishedAt ? toEETLocalInput(defaultPublishedAt) : nowEETLocalInput();
  const router = useRouter();
  const [title, setTitle] = useState(defaultTitle);
  const [slug, setSlug] = useState(defaultSlug);
  const [excerpt, setExcerpt] = useState(defaultExcerpt);
  const [content, setContent] = useState(defaultContent);
  const [published, setPublished] = useState(defaultPublished);
  const [publishedAt, setPublishedAt] = useState(initialPublishedAt);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set(defaultTagIds));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  const insertAtCursor = (text: string) => {
    const ta = contentRef.current;
    if (!ta) {
      setContent((c) => c + text);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = content.slice(0, start);
    const after = content.slice(end);
    setContent(before + text + after);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, kind: "image" | "pdf") => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form, credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      const url = data.url as string;
      if (kind === "image") {
        insertAtCursor(`\n![${file.name}](${url})\n`);
      } else {
        insertAtCursor(`\n[Download PDF: ${file.name}](${url})\n`);
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTitle(v);
    if (!id && !defaultSlug) setSlug(slugify(v));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        title,
        slug: slug || slugify(title),
        excerpt,
        content,
        published,
        published_at: fromEETLocalInput(publishedAt),
        tag_ids: Array.from(selectedTagIds),
      };
      if (id) {
        const res = await fetch(`/api/posts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const err = typeof data.error === "string" ? data.error : data.error?.message ?? "Update failed";
          setError(err);
          return;
        }
        router.push("/admin");
        router.refresh();
      } else {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const err = typeof data.error === "string" ? data.error : data.error?.message ?? "Create failed";
          setError(err);
          return;
        }
        router.push("/admin");
        router.refresh();
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 font-light">
      {error && (
        <p className="text-foreground/80 text-sm" role="alert">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="title" className="block text-sm text-foreground/80 mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          required
          className="w-full border border-border bg-background px-3 py-2 text-foreground font-light rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/30"
        />
      </div>
      <div>
        <label htmlFor="slug" className="block text-sm text-foreground/80 mb-1">
          Slug
        </label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          pattern="^[a-z0-9-]+$"
          title="Lowercase letters, numbers, hyphens only"
          className="w-full border border-border bg-background px-3 py-2 text-foreground font-light rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/30"
        />
      </div>
      <div>
        <label htmlFor="published_at" className="block text-sm text-foreground/80 mb-1">
          Publish at (EET)
        </label>
        <input
          id="published_at"
          type="datetime-local"
          value={publishedAt}
          onChange={(e) => setPublishedAt(e.target.value)}
          className="w-full border border-border bg-background px-3 py-2 text-foreground font-light rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/30"
        />
        <p className="text-xs text-foreground/60 mt-1">
          Use a future date to schedule. Post will go live at that time (keep Published checked).
        </p>
        {published && publishedAt && new Date(fromEETLocalInput(publishedAt)) > new Date() && (
          <p className="text-xs text-foreground/70 mt-1" role="status">
            Scheduled for {formatInEET(fromEETLocalInput(publishedAt), { dateStyle: "medium", timeStyle: "short" })} (EET).
          </p>
        )}
      </div>
      {tags.length > 0 && (
        <div>
          <span className="block text-sm text-foreground/80 mb-2">Tags</span>
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2 font-light text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTagIds.has(tag.id)}
                  onChange={() => toggleTag(tag.id)}
                  className="border border-border rounded"
                />
                {tag.name}
              </label>
            ))}
          </div>
        </div>
      )}
      <div>
        <label htmlFor="excerpt" className="block text-sm text-foreground/80 mb-1">
          Excerpt
        </label>
        <p className="text-xs text-foreground/60 mb-2">
          Markdown supported. For images with a specific size use HTML, e.g.{" "}
          <code className="bg-foreground/10 px-1">&lt;img src=&quot;/path.jpg&quot; width=&quot;300&quot; /&gt;</code>
        </p>
        <textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          className="w-full border border-border bg-background px-3 py-2 text-foreground font-light rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-y"
        />
      </div>
      <div>
        <label htmlFor="content" className="block text-sm text-foreground/80 mb-1">
          Content (Markdown)
        </label>
        <p className="text-xs text-foreground/60 mb-2">
          Supports tables, images, links, and math: <code className="bg-foreground/10 px-1">$inline$</code> or <code className="bg-foreground/10 px-1">$$block$$</code>.
        </p>
        <div className="flex flex-wrap gap-2 mb-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            id="upload-image"
            onChange={(e) => handleFileUpload(e, "image")}
          />
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            id="upload-pdf"
            onChange={(e) => handleFileUpload(e, "pdf")}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => document.getElementById("upload-image")?.click()}
            className="px-3 py-1.5 text-sm border border-foreground/30 text-foreground/80 font-light rounded-xl hover:bg-foreground/5 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Insert image"}
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => document.getElementById("upload-pdf")?.click()}
            className="px-3 py-1.5 text-sm border border-foreground/30 text-foreground/80 font-light rounded-xl hover:bg-foreground/5 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Attach PDF"}
          </button>
        </div>
        <textarea
          ref={contentRef}
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          className="w-full border border-border bg-background px-3 py-2 text-foreground font-light rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-y font-mono text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="published"
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="border border-border rounded"
        />
        <label htmlFor="published" className="text-sm text-foreground/80">
          Published
        </label>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 border border-foreground text-foreground font-light rounded-xl hover:bg-foreground hover:text-background disabled:opacity-50"
        >
          {submitting ? "Saving…" : id ? "Update" : "Create"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="px-4 py-2 border border-red-600 text-red-600 font-light rounded-xl hover:text-red-700 hover:border-red-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
