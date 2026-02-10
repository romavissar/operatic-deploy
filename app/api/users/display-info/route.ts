import { NextResponse } from "next/server";
import { getUserDisplayInfo } from "@/lib/clerk";

export const dynamic = "force-dynamic";

/**
 * GET /api/users/display-info?userId=xxx
 * Returns { name, imageUrl } for the user with that Clerk user id.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId || !userId.trim()) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  try {
    const info = await getUserDisplayInfo(userId.trim());
    return NextResponse.json({ name: info.name, imageUrl: info.imageUrl });
  } catch {
    return NextResponse.json({ name: null, imageUrl: null });
  }
}

/**
 * POST /api/users/display-info
 * Body: { userIds: string[] }
 * Returns { [userId]: { name, imageUrl } } for each Clerk user id.
 */
export async function POST(request: Request) {
  let body: { userIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const userIds = Array.isArray(body?.userIds) ? body.userIds : [];
  const ids = Array.from(new Set(userIds.map((id) => String(id).trim()).filter(Boolean)));
  const result: Record<string, { name: string | null; imageUrl: string | null }> = {};
  await Promise.all(
    ids.map(async (id) => {
      const info = await getUserDisplayInfo(id);
      result[id] = { name: info.name, imageUrl: info.imageUrl };
    })
  );
  return NextResponse.json(result);
}
