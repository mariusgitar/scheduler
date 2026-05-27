'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type DeleteButtonProps = {
  id: string
  title: string
}

export default function DeleteButton({ id, title }: DeleteButtonProps) {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/workshops/${id}`, { method: 'DELETE' })

      if (!response.ok) {
        throw new Error('Kunne ikke slette program')
      }

      router.refresh()
    } finally {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (confirmDelete) {
    return (
      <div className="home-delete-confirm">
        <button type="button" onClick={handleDelete} disabled={isDeleting} className="home-delete-confirm-delete">
          Slett
        </button>{' '}
        <button
          type="button"
          onClick={() => setConfirmDelete(false)}
          disabled={isDeleting}
          className="home-delete-confirm-cancel"
        >
          Avbryt
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmDelete(true)}
      disabled={isDeleting}
      className="home-delete-button"
      aria-label={`Slett ${title}`}
      title={`Slett ${title}`}
    >
      🗑
    </button>
  )
}
