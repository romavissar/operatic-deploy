import Link from "next/link";

const nav = [
  { href: "/", label: "Home" },
  { href: "/posts", label: "Posts" },
  { href: "/about", label: "About" },
];

export function SimpleHeader() {
  return (
    <header className="border-b border-border">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <Link href="/" className="text-foreground font-light text-lg tracking-tight hover:opacity-70">
          operatic
        </Link>
        <nav className="flex items-center gap-6">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              prefetch={href === "/posts" ? false : undefined}
              className="text-foreground/80 font-light text-sm tracking-tight hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
