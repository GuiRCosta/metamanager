import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const SUPERADMIN_ALLOWED_PREFIXES = [
  "/monitoring",
  "/docs",
  "/api/",
  "/login",
  "/register",
  "/terms",
  "/privacy",
]

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })

  if (!token) return NextResponse.next()

  const role = token.role as string | undefined
  const { pathname } = request.nextUrl

  if (role === "superadmin") {
    const isAllowed = SUPERADMIN_ALLOWED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    )

    if (!isAllowed && pathname !== "/") {
      return NextResponse.redirect(new URL("/monitoring", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
