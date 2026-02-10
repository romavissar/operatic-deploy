import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { getCurrentUserEmail } from "@/lib/clerk";
import { isAdmin } from "@/lib/auth";

const nav = [
  { href: "/", label: "Home" },
  { href: "/posts", label: "Posts" },
  { href: "/about", label: "About" },
  { href: "/newsletter", label: "Newsletter" },
];

export async function Header() {
  let userIsAdmin = false;
  try {
    const userEmail = await getCurrentUserEmail();
    userIsAdmin = isAdmin(userEmail ?? undefined);
  } catch {
    // Clerk not configured or auth failed; show header without Admin
  }
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
          {userIsAdmin && (
            <Link
              href="/admin"
              className="text-foreground/80 font-light text-sm tracking-tight hover:text-foreground"
            >
              Admin
            </Link>
          )}
          <SignedOut>
            <SignInButton forceRedirectUrl="/" afterSignInUrl="/">
              <button className="text-foreground/80 font-light text-sm tracking-tight hover:text-foreground">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              userProfileUrl="/user-profile"
              userProfileMode="navigation"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
