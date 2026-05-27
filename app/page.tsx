import Link from 'next/link'
import CreateButton from '../components/CreateButton'
import DeleteButton from '../components/DeleteButton'
import { sql } from '../lib/db'
import type { WorkshopRow } from '../lib/types'

export const revalidate = 0

type WorkshopData = {
  bolker?: unknown[]
}

async function getWorkshops() {
  return sql<WorkshopRow>(
    'SELECT id, title, data, created_at, updated_at FROM workshops ORDER BY created_at DESC LIMIT 20'
  )
}

function getBolkCount(data: object) {
  const workshopData = data as WorkshopData

  return Array.isArray(workshopData.bolker) ? workshopData.bolker.length : 0
}

export default async function Page() {
  const workshops = await getWorkshops()

  return (
    <main className="home-shell">
      <div className="home-app">
        <header className="home-header">
          <div>
            <div className="home-tag">Workshop Agenda</div>
            <h1 className="home-title">Workshop Agenda</h1>
          </div>
          <CreateButton />
        </header>

        {workshops.length === 0 ? (
          <p className="home-empty">Ingen programmer ennå</p>
        ) : (
          <ul className="home-list">
            {workshops.map((workshop) => (
              <li key={workshop.id} className="home-card">
                <div className="home-card-main">
                  <Link href={`/workshop/${workshop.id}`} className="home-card-title">
                    {workshop.title}
                  </Link>
                  <div className="home-card-meta">
                    <span className="home-meta-pill">{getBolkCount(workshop.data)} bolker</span>
                    <span className="home-meta-pill">
                      {new Date(workshop.created_at).toLocaleDateString('nb-NO')}
                    </span>
                  </div>
                </div>
                <div className="home-card-actions">
                  <DeleteButton id={workshop.id} title={workshop.title} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
