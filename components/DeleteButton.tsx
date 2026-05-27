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
      <span>
        Slette {title}?{' '}
        <button type="button" onClick={handleDelete} disabled={isDeleting}>
          Ja
        </button>{' '}
        /{' '}
        <button type="button" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
          Nei
        </button>
      </span>
    )
  }

  return (
    <button type="button" onClick={() => setConfirmDelete(true)} disabled={isDeleting}>
      Slett
    </button>
  )
}
