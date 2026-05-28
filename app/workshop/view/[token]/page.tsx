import { notFound } from 'next/navigation'
import WorkshopViewer from '../../../../components/WorkshopViewer'
import { sql } from '../../../../lib/db'
import type { WorkshopRow } from '../../../../lib/types'

export const revalidate = 0

type PageProps = {
  params: {
    token: string
  }
}

export default async function WorkshopViewPage({ params }: PageProps) {
  const rows = await sql<WorkshopRow>('SELECT * FROM workshops WHERE read_token = $1', [params.token])

  const workshop = rows[0]

  if (!workshop) {
    notFound()
  }

  return <WorkshopViewer workshop={workshop} />
}
