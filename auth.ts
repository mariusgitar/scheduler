import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { sql } from '@/lib/db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) return false
      const rows = await sql<{ email: string }>(
        'SELECT email FROM allowed_users WHERE email = $1',
        [profile.email]
      )
      return rows.length > 0
    },
    jwt({ token, account, profile }) {
      if (account && profile?.sub) {
        token.sub = profile.sub
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
  pages: {
    error: '/',
  },
})
