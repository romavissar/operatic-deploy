import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGES = [
  { slug: "home", label: "Home" },
  { slug: "about", label: "About" },
];

export default function AdminPagesPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-light tracking-tight text-foreground">
        Pages
      </h1>
      <p className="text-sm text-foreground/70 font-light">
        Edit the text on your Home and About pages.
      </p>
      <ul className="space-y-3">
        {PAGES.map(({ slug, label }) => (
          <li key={slug} className="flex items-center justify-between gap-4 py-2 border-b border-border">
            <span className="font-light text-foreground">{label}</span>
            <Link
              href={`/admin/pages/${slug}`}
              className="text-sm font-light text-foreground/80 hover:text-foreground"
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
