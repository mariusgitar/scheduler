import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isWorkshopEdit =
    req.nextUrl.pathname.startsWith('/workshop/') &&
    !req.nextUrl.pathname.startsWith('/workshop/view/')

  if (isWorkshopEdit && !isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/workshop/:path*'],
}
