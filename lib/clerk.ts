import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

/**
 * Clerk hosted sign-in URL (on clerk.accounts.dev). Used to redirect users to Clerk's page instead of embedding.
 */
export function getClerkHostedSignInUrl(): string | null {
  const host =
    process.env.NEXT_PUBLIC_CLERK_FRONTEND_API ||
    (() => {
      const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      if (!key?.startsWith("pk_")) return null;
      try {
        const b64 = key.replace(/^pk_(test|live)_/, "");
        return Buffer.from(b64, "base64").toString("utf8").replace(/\$/g, "").trim() || null;
      } catch {
        return null;
      }
    })();
  return host ? `https://${host}/sign-in` : null;
}

/** First and last name from Clerk, e.g. "Jane Doe". */
export async function getCurrentUserName(): Promise<string | null> {
  try {
    const user = await currentUser();
    if (user) {
      const parts = [user.firstName, user.lastName].filter(Boolean).map((s) => s!.trim());
      return parts.length ? parts.join(" ") : null;
    }
    const authObj = await auth();
    if (!authObj.userId) return null;
    const apiUser = await clerkClient().users.getUser(authObj.userId);
    const first = apiUser.firstName?.trim();
    const last = apiUser.lastName?.trim();
    const parts = [first, last].filter(Boolean);
    return parts.length ? parts.join(" ") : null;
  } catch {
    return null;
  }
}

/**
 * Fetches the current display name, image URL, and primary email for a user by Clerk user id.
 * Use when displaying comments so name/avatar stay in sync with Clerk profile updates.
 * Email is used to unify display when the same person has multiple Clerk accounts (same email → same profile).
 * Returns nulls on failure or if user no longer exists (caller can fall back to stored values).
 */
function pickNameAndImage(user: unknown): { name: string | null; imageUrl: string | null } {
  if (!user || typeof user !== "object") return { name: null, imageUrl: null };
  const u = user as Record<string, unknown>;
  const first = [u.firstName, u.first_name].find((v) => typeof v === "string") as string | undefined;
  const last = [u.lastName, u.last_name].find((v) => typeof v === "string") as string | undefined;
  const parts = [first?.trim(), last?.trim()].filter(Boolean);
  const name = parts.length ? parts.join(" ") : null;
  const imageUrl = [u.imageUrl, u.image_url, u.profileImageUrl, u.profile_image_url].find((v) => typeof v === "string" && v.trim()) as string | undefined;
  return { name, imageUrl: imageUrl?.trim() || null };
}

export async function getUserDisplayInfo(
  userId: string
): Promise<{ name: string | null; imageUrl: string | null; primaryEmail: string | null }> {
  try {
    const apiUser = await clerkClient().users.getUser(userId);
    const { name, imageUrl } = pickNameAndImage(apiUser);
    const primaryEmail =
      (apiUser.primaryEmailAddressId != null && apiUser.emailAddresses?.length
        ? apiUser.emailAddresses.find((e) => e.id === apiUser.primaryEmailAddressId)?.emailAddress
        : null) ?? apiUser.emailAddresses?.[0]?.emailAddress ?? null;
    return { name, imageUrl, primaryEmail: primaryEmail?.trim() || null };
  } catch {
    return { name: null, imageUrl: null, primaryEmail: null };
  }
}

/**
 * Fetches the current display name and image URL for a user by their primary email (e.g. from comment author_email).
 * Use this when you have the commenter's email stored and want to show their current Clerk profile.
 * Returns nulls if no user is found for that email or on error.
 */
export async function getUserDisplayInfoByEmail(
  email: string
): Promise<{ name: string | null; imageUrl: string | null }> {
  const trimmed = email?.trim();
  if (!trimmed) return { name: null, imageUrl: null };
  try {
    const res = await clerkClient().users.getUserList({ emailAddress: [trimmed], limit: 10 });
    const users = res && typeof res === "object" && "data" in res ? (res as { data: unknown[] }).data : [];
    const user = Array.isArray(users) ? users[0] : undefined;
    const { name, imageUrl } = pickNameAndImage(user);
    // If we found a user but they have no name in Clerk, use the email we looked up so we don't show null
    return { name: name ?? (user ? trimmed : null), imageUrl };
  } catch {
    return { name: null, imageUrl: null };
  }
}

export async function getCurrentUserEmail(): Promise<string | null> {
  try {
    // Prefer currentUser() in Server Components (more reliable for layout/pages)
    const user = await currentUser();
    if (user) {
      const primary = user.primaryEmailAddressId
        ? user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress
        : null;
      if (primary) return primary;
      const first = user.emailAddresses?.[0]?.emailAddress;
      if (first) return first;
    }
    // Fallback: auth() + clerkClient() for API routes or when currentUser is null
    const authObj = await auth();
    const userId = authObj.userId;
    if (!userId) return null;
    const apiUser = await clerkClient().users.getUser(userId);
    const primary = apiUser.primaryEmailAddress?.emailAddress;
    if (primary) return primary;
    const first = apiUser.emailAddresses?.[0]?.emailAddress;
    return first ?? null;
  } catch {
    return null;
  }
}
