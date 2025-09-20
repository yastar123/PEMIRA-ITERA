import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Protected routes
  const protectedRoutes = ["/register", "/generate-code", "/waiting", "/vote", "/success", "/admin", "/super-admin"]
  const adminRoutes = ["/admin"]
  const superAdminRoutes = ["/super-admin"]

  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
  const isSuperAdminRoute = superAdminRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Mock authentication check - for testing, allow access to most routes
  const hasAuth = request.cookies.get("mock-auth")?.value === "true"

  if (isProtectedRoute && !hasAuth && !request.nextUrl.pathname.startsWith("/login")) {
    // Redirect to login if not authenticated
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // For testing purposes, allow admin access
  // In production, this would check actual user roles from database

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
