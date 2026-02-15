import { authMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const clerkAuth = authMiddleware({
  signInUrl: "/sign-in?after_sign_in_url=%2F&redirect_url=%2F",
  publicRoutes: [
    "/",
    "/posts",
    "/posts/(.*)",
    "/about",
    "/newsletter",
    "/api/(.*)",
    "/sign-in",
    "/sign-in/(.*)",
    "/sign-up",
    "/sign-up/(.*)",
  ],
});

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  // Don't redirect RSC/fetch requests or we can break the page and leave it loading
  if (url.searchParams.has("_rsc") || req.headers.get("RSC") === "1") {
    return clerkAuth(req);
  }

  // Only clean the main sign-in page. Never redirect /sign-in/factor-two or we strip
  // __clerk_db_jwt / __dev_session and Clerk gets stuck on loading.
  const redirectUrl = url.searchParams.get("redirect_url") ?? "";
  if (url.pathname === "/sign-in" && url.search && redirectUrl.length > 100) {
    return NextResponse.redirect(new URL("/sign-in?after_sign_in_url=%2F", req.url));
  }

  return clerkAuth(req);
}

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/api/posts(.*)"],
};
