import { NewsletterSignup } from "@/components/NewsletterSignup";

export const dynamic = "force-dynamic";

export default function NewsletterPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-light tracking-tight text-foreground">
        Newsletter
      </h1>
      <p className="text-foreground/80 font-light leading-relaxed">
        Get new posts in your inbox. No spam, unsubscribe anytime.
      </p>
      <NewsletterSignup />
    </div>
  );
}
