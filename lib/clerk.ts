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
