"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface PageFormProps {
  slug: string;
  defaultTitle: string;
  defaultBody: string;
  pageLabel: string;
}

export function PageForm({
  slug,
  defaultTitle,
  defaultBody,
  pageLabel: _pageLabel,
}: PageFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(defaultTitle);
  const [body, setBody] = useState(defaultBody);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (text: string) => {
    const ta = bodyRef.current;
    if (!ta) {
      setBody((b) => b + text);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = body.slice(0, start);
    const after = body.slice(end);
    setBody(before + text + after);
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/pages/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Update failed");
        return;
      }
      router.refresh();
    } catch {
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
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-border bg-background px-3 py-2 text-foreground font-light focus:outline-none focus:ring-1 focus:ring-foreground/30"
        />
      </div>
      <div>
        <label htmlFor="body" className="block text-sm text-foreground/80 mb-1">
          Body (Markdown)
        </label>
        <p className="text-xs text-foreground/60 mb-2">
          Supports tables, images, links, and math: <code className="bg-foreground/10 px-1">$inline$</code> or <code className="bg-foreground/10 px-1">$$block$$</code>.
        </p>
        <div className="flex flex-wrap gap-2 mb-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            id={`upload-image-${slug}`}
            onChange={(e) => handleFileUpload(e, "image")}
          />
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            id={`upload-pdf-${slug}`}
            onChange={(e) => handleFileUpload(e, "pdf")}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => document.getElementById(`upload-image-${slug}`)?.click()}
            className="px-3 py-1.5 text-sm border border-foreground/30 text-foreground/80 font-light hover:bg-foreground/5 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Insert image"}
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => document.getElementById(`upload-pdf-${slug}`)?.click()}
            className="px-3 py-1.5 text-sm border border-foreground/30 text-foreground/80 font-light hover:bg-foreground/5 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Attach PDF"}
          </button>
        </div>
        <textarea
          ref={bodyRef}
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="w-full border border-border bg-background px-3 py-2 text-foreground font-light focus:outline-none focus:ring-1 focus:ring-foreground/30 resize-y font-mono text-sm"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 border border-foreground text-foreground font-light hover:bg-foreground hover:text-background disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/pages")}
          className="px-4 py-2 text-foreground/80 font-light hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
