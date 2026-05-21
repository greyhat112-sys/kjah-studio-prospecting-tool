import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'

export async function middleware(request) {
  const session = request.cookies.get('session')?.value
  const valid = await verifySession(session)

  if (!valid) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
