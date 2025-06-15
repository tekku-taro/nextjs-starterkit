// import NextAuth from "next-auth"
// import authConfig from "./auth.config"
import { NextRequest, NextResponse } from "next/server"
import { getSmartAuth } from "./lib/smart-auth"

// Use only one of the two middleware options below
// 1. Use middleware directly
// export const { auth: middleware } = NextAuth(authConfig)
 
// 2. Wrapped middleware option
// const { auth } = NextAuth(authConfig)
// export default auth(async function middleware(request: NextRequest) {
export async function middleware(request: NextRequest) {  
  // Your custom middleware logic goes here
  // const session = await auth()
  const smartAuth = getSmartAuth();
  const session = await smartAuth.getSession();  
  // Define protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/profile"]

  // Define auth routes that should redirect to dashboard if already authenticated
  const authRoutes = ["/login", "/register", "/reset-password", "/new-password"]

  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname === route)

  console.log("session", session)
  console.log("isProtectedRoute", isProtectedRoute)
  console.log("isAuthRoute", isAuthRoute)
  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    console.log("Redirect to login")
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if accessing auth routes with session
  if (isAuthRoute && session) {
    console.log("Redirect to dashboard")
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()  
}
// })