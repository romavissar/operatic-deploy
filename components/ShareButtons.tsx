"use client";

import { useState } from "react";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const getUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/posts/${slug}`;
    }
    return "";
  };

  const getShareUrl = () => getUrl();
  const encodedUrl = () => encodeURIComponent(getShareUrl());
  const encodedTitle = () => encodeURIComponent(title);

  const shareX = () => {
    const url = `https://twitter.com/intent/tweet?url=${encodedUrl()}&text=${encodedTitle()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodedTitle()}%20${encodedUrl()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareInstagram = () => {
    copyLink();
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    const url = getShareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: open prompt or leave as is
    }
  };

  return (
    <div className="pt-6 border-t border-border">
      <p className="text-sm text-foreground/60 font-light mb-3">Share</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={shareX}
          className="px-3 py-2 text-sm font-light border border-foreground/30 text-foreground/80 hover:bg-foreground/5 rounded-xl transition-colors"
        >
          X
        </button>
        <button
          type="button"
          onClick={shareWhatsApp}
          className="px-3 py-2 text-sm font-light border border-foreground/30 text-foreground/80 hover:bg-foreground/5 rounded-xl transition-colors"
        >
          WhatsApp
        </button>
        <button
          type="button"
          onClick={shareInstagram}
          className="px-3 py-2 text-sm font-light border border-foreground/30 text-foreground/80 hover:bg-foreground/5 rounded-xl transition-colors"
        >
          Instagram
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="px-3 py-2 text-sm font-light border border-foreground/30 text-foreground/80 hover:bg-foreground/5 rounded-xl transition-colors min-w-[5rem]"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
