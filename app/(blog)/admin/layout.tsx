import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserEmail } from "@/lib/clerk";
import { isAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userEmail = await getCurrentUserEmail();
  if (!isAdmin(userEmail ?? undefined)) {
    redirect("/");
  }
  return (
    <div className="space-y-8">
      <nav className="flex gap-4 text-sm font-light">
        <Link href="/admin" className="text-foreground/80 hover:text-foreground">
          Dashboard
        </Link>
        <Link href="/admin/new" className="text-foreground/80 hover:text-foreground">
          New post
        </Link>
        <Link href="/admin/pages" className="text-foreground/80 hover:text-foreground">
          Pages
        </Link>
        <Link href="/admin/tags" className="text-foreground/80 hover:text-foreground">
          Tags
        </Link>
        <Link href="/admin/newsletter" className="text-foreground/80 hover:text-foreground">
          Newsletter
        </Link>
        <Link href="/" className="text-foreground/80 hover:text-foreground">
          ← Site
        </Link>
      </nav>
      {children}
    </div>
  );
}
