'use client'

import { FormEvent, useState } from 'react'

type CreateWorkshopResponse = {
  id: string
}

export default function CreateButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleCreateWorkshop = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    const title = titleInput.trim() || 'Workshop'

    try {
      const response = await fetch('/api/workshops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
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

  const handleOpenForm = () => {
    setErrorMessage('')
    setIsFormOpen(true)
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setTitleInput('')
    setErrorMessage('')
  }

  return (
    <div>
      {isFormOpen ? (
        <form onSubmit={handleCreateWorkshop}>
          <input
            type="text"
            value={titleInput}
            onChange={(event) => setTitleInput(event.target.value)}
            placeholder="Navn på workshop…"
            autoFocus
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Oppretter…' : 'Opprett'}
          </button>{' '}
          <button type="button" onClick={handleCancel} disabled={isLoading}>
            Avbryt
          </button>
        </form>
      ) : (
        <button type="button" onClick={handleOpenForm}>
          Opprett nytt program
        </button>
      )}
      {errorMessage ? <p>{errorMessage}</p> : null}
    </div>
  )
}
