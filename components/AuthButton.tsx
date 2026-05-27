'use client'

import { signIn, signOut, useSession } from 'next-auth/react'

export default function AuthButton() {
  const { data: session } = useSession()

  if (!session?.user) {
    return (
      <div className="auth-bar">
        <button className="signin-btn" onClick={() => signIn('google')}>
          Logg inn med Google
        </button>
      </div>
    )
  }

  const displayName = session.user.name || session.user.email

  return (
    <div className="auth-bar">
      <span className="user-info">{displayName}</span>
      <button className="signout-btn" onClick={() => signOut()}>
        Logg ut
      </button>
    </div>
  )
}
