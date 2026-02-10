"use client";

import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        setMessage(data.message ?? "Thanks for subscribing!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          required
          disabled={status === "loading"}
          className="flex-1 min-w-[200px] border border-border bg-background px-3 py-2 text-foreground font-light rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/30 disabled:opacity-50"
          aria-label="Email for newsletter"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-4 py-2 border border-foreground text-foreground font-light rounded-xl hover:bg-foreground hover:text-background disabled:opacity-50"
        >
          {status === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {message && (
        <p
          className={`text-sm font-light ${status === "success" ? "text-foreground/80" : "text-red-600"}`}
          role="alert"
        >
          {message}
        </p>
      )}
    </form>
  );
}
