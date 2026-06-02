import Link from 'next/link'
import CreateButton from '../components/CreateButton'
import DeleteButton from '../components/DeleteButton'
import { sql } from '../lib/db'
import AuthButton from '../components/AuthButton'
import AgendaPreview from '../components/AgendaPreview'
import type { WorkshopRow } from '../lib/types'
import { auth } from '@/auth'

export const revalidate = 0

type WorkshopData = {
  bolker?: unknown[]
}

async function getWorkshops(userId: string) {
  return sql<WorkshopRow>(
    'SELECT id, title, data, created_at, updated_at FROM workshops WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 20',
    [userId]
  )
}

function getBolkCount(data: object) {
  const workshopData = data as WorkshopData

  return Array.isArray(workshopData.bolker) ? workshopData.bolker.length : 0
}

type PageProps = {
  searchParams?: {
    error?: string
  }
}

export default async function Page({ searchParams }: PageProps) {
  const session = await auth()
  const userId = session?.user?.id
  const workshops = userId ? await getWorkshops(userId) : []
  const showAccessDenied = searchParams?.error === 'AccessDenied'

  return (
    <main className="home-shell">
      <div className="home-app">
        <header className="home-header">
          <div>
            <div className="home-tag">Workshop Agenda</div>
            <h1 className="home-title">Workshop Agenda</h1>
          </div>
          {userId ? <CreateButton /> : null}
        </header>

        {!userId ? (
          <>
            <div className="home-guest-actions">
              <CreateButton
                buttonLabel="Prøv uten konto"
                buttonClassName="home-guest-create-button"
              />
              <AuthButton signInLabel="Logg inn" />
            </div>
            <AgendaPreview />
          </>
        ) : (
          <AuthButton />
        )}
        {showAccessDenied ? (
          <p className="home-empty">
            Du har ikke tilgang til Workshop Agenda. Ta kontakt med administrator.
          </p>
        ) : null}

        {!userId ? null : workshops.length === 0 ? (
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
