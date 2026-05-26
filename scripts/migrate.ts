import fs from 'fs'
import path from 'path'
import { sql } from '../lib/db'

async function runMigration() {
  try {
    const schemaPath = path.join(process.cwd(), 'lib', 'schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')

    await sql(schemaSql)
    console.log('Migration complete')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
