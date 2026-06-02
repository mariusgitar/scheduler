import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isWorkshopView = req.nextUrl.pathname.startsWith('/workshop/view/')

  // Ikke blokker noe her lenger — tilgangskontroll skjer i page.tsx
  return NextResponse.next()
})

export const config = {
  matcher: ['/workshop/:path*'],
}
