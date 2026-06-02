import { NextResponse } from 'next/server'
import { sql } from '../../../lib/db'
import type { WorkshopRow } from '../../../lib/types'
import { auth } from '@/auth'

type CreateWorkshopBody = {
  title?: string
}

const defaultWorkshopData = {
  startTime: '09:00',
  endTime: '15:00',
  bolker: []
}

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: 'Ikke innlogget' }, { status: 401 })
    }

    const rows = await sql<WorkshopRow>(
      'SELECT id, title, data, owner_id, read_token, created_at, updated_at FROM workshops WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 20',
      [userId]
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    const body = (await request.json()) as CreateWorkshopBody
    const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : 'Workshop'

    const rows = await sql<WorkshopRow>(
      'INSERT INTO workshops (title, data, owner_id) VALUES ($1, $2::jsonb, $3) RETURNING *',
      [title, JSON.stringify(defaultWorkshopData), userId ?? null]
    )

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 })
  }
}
