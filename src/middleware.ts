import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard')
  const isOnAdmin = req.nextUrl.pathname.startsWith('/admin')
  const isOnLogin = req.nextUrl.pathname.startsWith('/login')

  if (isOnLogin) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn && (isOnDashboard || isOnAdmin)) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (isOnAdmin && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
