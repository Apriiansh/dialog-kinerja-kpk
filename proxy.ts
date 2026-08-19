import { NextRequest, NextResponse } from "next/server";
import { getRequestSession, homePathForRole } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const session = await getRequestSession(request);

  const { pathname } = request.nextUrl;
  const isLoggedIn = Boolean(session?.id);

  if (!isLoggedIn && pathname !== "/login" && pathname !== "/") {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(
      new URL(homePathForRole(session!.role), request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
