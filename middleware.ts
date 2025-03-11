import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { NextRequest, NextResponse } from "next/server"

// Use only one of the two middleware options below
// 1. Use middleware directly
// export const { auth: middleware } = NextAuth(authConfig)
 
// 2. Wrapped middleware option
const { auth } = NextAuth(authConfig)
export default auth(async function middleware(request: NextRequest) {
  // Your custom middleware logic goes here
  const session = await auth()

  // Define protected routes that require authentication
  const protectedRoutes = ["/dashboard"]

  // Define auth routes that should redirect to dashboard if already authenticated
  const authRoutes = ["/login", "/register", "/reset-password", "/new-password"]

  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname === route)

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if accessing auth routes with session
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()  
})