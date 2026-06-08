import { NextResponse, type NextRequest } from 'next/server'
import { authServer } from '@/lib/auth/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isLoginRoute = pathname === '/admin/login'
  const isAdminRoute = pathname.startsWith('/admin')

  if (!isAdminRoute || isLoginRoute) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

  const sessionToken = request.cookies.get('better-auth.session_token')?.value

  if (!sessionToken) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const { valid } = await authServer.validateSessionToken(sessionToken)

  if (!valid) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next({ request: { headers: request.headers } })
}

export const config = {
  matcher: ['/admin/:path*'],
}