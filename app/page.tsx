import Link from 'next/link'
import CreateButton from '../components/CreateButton'
import { sql } from '../lib/db'
import type { WorkshopRow } from '../lib/types'

export const revalidate = 0

async function getWorkshops() {
  return sql<WorkshopRow>(
    'SELECT id, title, data, created_at, updated_at FROM workshops ORDER BY created_at DESC LIMIT 20'
  )
}

export default async function Page() {
  const workshops = await getWorkshops()

  return (
    <main>
      <div>
        <h1>Workshop Agenda</h1>
        <CreateButton />
      </div>

      {workshops.length === 0 ? (
        <p>Ingen programmer ennå</p>
      ) : (
        <ul>
          {workshops.map((w) => (
            <li key={w.id}>
              <Link href={`/workshop/${w.id}`}>{w.title}</Link>
              <p>{new Date(w.created_at).toLocaleDateString('nb-NO')}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
