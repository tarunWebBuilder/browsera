import { NextRequest, NextResponse } from "next/server"

// paths that should never be gated by auth
const PUBLIC_PATHS = ["/", "/auth", "/signin"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow Next internals and public assets to pass through untouched
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.[^/]+$/)
  ) {
    return NextResponse.next()
  }

  // Let unauthenticated users reach the public sign-in/copy paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Gate everything else on the presence of auth-token cookie
  if (!request.cookies.has("auth-token")) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/signin"
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
