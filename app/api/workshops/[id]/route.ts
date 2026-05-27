import { NextResponse } from 'next/server'
import { sql } from '../../../../lib/db'
import type { WorkshopRow } from '../../../../lib/types'

type RouteParams = {
  params: {
    id: string
  }
}

type UpdateWorkshopBody = {
  title?: string
  data?: object
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(_: Request, { params }: RouteParams) {
  if (!uuidPattern.test(params.id)) {
    return NextResponse.json({ error: 'Ugyldig id' }, { status: 400 })
  }

  const rows = await sql<WorkshopRow>(
    'SELECT id, title, data, created_at, updated_at FROM workshops WHERE id = $1',
    [params.id]
  )

  if (!rows[0]) {
    return NextResponse.json({ error: 'Ikke funnet' }, { status: 404 })
  }

  return NextResponse.json(rows[0])
}

export async function PUT(request: Request, { params }: RouteParams) {
  if (!uuidPattern.test(params.id)) {
    return NextResponse.json({ error: 'Ugyldig id' }, { status: 400 })
  }

  const body = (await request.json()) as UpdateWorkshopBody
  const hasTitle = body.title !== undefined
  const hasData = body.data !== undefined

  if (!hasTitle && !hasData) {
    return NextResponse.json({ error: 'Ingen felter å oppdatere' }, { status: 400 })
  }

  if (hasTitle && hasData) {
    const rows = await sql<WorkshopRow>(
      `UPDATE workshops
       SET title = $1, data = $2, updated_at = now()
       WHERE id = $3
       RETURNING id, title, data, created_at, updated_at`,
      [body.title, JSON.stringify(body.data), params.id]
    )

    if (!rows[0]) {
      return NextResponse.json({ error: 'Ikke funnet' }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  }

  const updates: string[] = []
  const values: unknown[] = []

  if (hasTitle) {
    values.push(body.title)
    updates.push(`title = $${values.length}`)
  }

  if (hasData) {
    values.push(JSON.stringify(body.data))
    updates.push(`data = $${values.length}::jsonb`)
  }

  updates.push('updated_at = now()')

  values.push(params.id)

  const rows = await sql<WorkshopRow>(
    `UPDATE workshops
     SET ${updates.join(', ')}
     WHERE id = $${values.length}
     RETURNING id, title, data, created_at, updated_at`,
    values
  )

  if (!rows[0]) {
    return NextResponse.json({ error: 'Ikke funnet' }, { status: 404 })
  }

  return NextResponse.json(rows[0])
}
