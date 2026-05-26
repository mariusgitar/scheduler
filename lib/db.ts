import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}

const query = neon(databaseUrl)

export async function sql<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const rows = await query(text, params)
  return rows as T[]
}
