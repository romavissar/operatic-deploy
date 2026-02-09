const ADMIN_EMAILS = process.env.ADMIN_EMAILS ?? "";

export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  const allowlist = ADMIN_EMAILS.split(",")
    .map((e) => e.trim().replace(/^["']|["']$/g, "").toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}
