import { notFound } from 'next/navigation'
import { sql } from '../../../lib/db'
import type { WorkshopRow } from '../../../lib/types'

type PageProps = {
  params: {
    id: string
  }
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function WorkshopPage({ params }: PageProps) {
  if (!uuidPattern.test(params.id)) {
    notFound()
  }

  const rows = await sql<WorkshopRow>(
    'SELECT id, title, data, created_at, updated_at FROM workshops WHERE id = $1',
    [params.id]
  )

  const workshop = rows[0]

  if (!workshop) {
    notFound()
  }

  return (
    <main>
      <h1>{workshop.title}</h1>
      <p>{workshop.id}</p>
      <p>Opprettet: {new Date(workshop.created_at).toLocaleDateString("nb-NO")}</p>
      <p>Planlegger kommer her</p>
    </main>
  )
}
