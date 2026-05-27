import { NextResponse } from 'next/server'
import { sql } from '../../../lib/db'
import type { WorkshopRow } from '../../../lib/types'

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
    const rows = await sql<WorkshopRow>(
      'SELECT id, title, data, owner_id, read_token, created_at, updated_at FROM workshops ORDER BY created_at DESC LIMIT 20'
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateWorkshopBody
    const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : 'Workshop'

    const rows = await sql<WorkshopRow>(
      'INSERT INTO workshops (title, data) VALUES ($1, $2::jsonb) RETURNING *',
      [title, JSON.stringify(defaultWorkshopData)]
    )

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 })
  }
}
