import { NextResponse } from 'next/server'
import { sql } from '../../../lib/db'

type HealthRow = {
  ok: number
}

export async function GET() {
  try {
    const rows = await sql<HealthRow>('SELECT 1 AS ok')

    if (rows[0]?.ok === 1) {
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: 'Uventet databasesvar' }, { status: 500 })
  } catch (error) {
    console.error(error)

    const message = error instanceof Error ? error.message : 'Ukjent feil'

    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
