'use client'

import { useState } from 'react'

type CreateWorkshopResponse = {
  id: string
}

export default function CreateButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleCreateWorkshop = async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/workshops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'Workshop' })
      })

      if (!response.ok) {
        throw new Error('Request failed')
      }

      const workshop = (await response.json()) as CreateWorkshopResponse

      if (!workshop?.id) {
        throw new Error('Missing workshop id')
      }

      window.location.href = `/workshop/${workshop.id}`
    } catch {
      setErrorMessage('Noe gikk galt, prøv igjen')
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={handleCreateWorkshop} disabled={isLoading}>
        {isLoading ? 'Oppretter…' : 'Opprett nytt program'}
      </button>
      {errorMessage ? <p>{errorMessage}</p> : null}
    </div>
  )
}
