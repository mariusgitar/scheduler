'use client'

import { signIn, signOut, useSession } from 'next-auth/react'

type AuthButtonProps = {
  signInLabel?: string
}

export default function AuthButton({ signInLabel = 'Logg inn med Google' }: AuthButtonProps) {
  const { data: session } = useSession()

  if (!session?.user) {
    return (
      <div className="auth-bar">
        <button className="signin-btn" onClick={() => signIn('google')}>
          {signInLabel}
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
