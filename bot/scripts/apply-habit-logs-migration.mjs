import pg from 'pg'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import 'dotenv/config'

const ref = new URL(process.env.SUPABASE_URL).hostname.split('.')[0]
const sql = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../backend/supabase/migrations/20260524c_habit_logs_log_date.sql'),
  'utf8',
)

const hosts = [
  `postgresql://postgres.${ref}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD ?? '')}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD ?? '')}@db.${ref}.supabase.co:5432/postgres`,
]

if (process.env.SUPABASE_DB_PASSWORD) {
  for (const connectionString of hosts) {
    const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
    try {
      await client.connect()
      console.log('Connected via', connectionString.replace(/:[^:@]+@/, ':***@'))
      await client.query(sql)
      console.log('Migration applied successfully')
      await client.end()
      process.exit(0)
    } catch (e) {
      console.log('Failed:', e.message)
      await client.end().catch(() => {})
    }
  }
}

console.log('Set SUPABASE_DB_PASSWORD in bot/.env (Supabase → Settings → Database → Database password) and rerun:')
console.log('  node bot/scripts/apply-habit-logs-migration.mjs')
