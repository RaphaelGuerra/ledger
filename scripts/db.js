#!/usr/bin/env node
/* eslint-env node */
/* eslint no-console: 0 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config() // fallback to .env if present

const { Client } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function readSqlFiles(dir) {
  const abs = path.resolve(process.cwd(), dir)
  if (!fs.existsSync(abs)) return []
  return fs
    .readdirSync(abs)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .map(f => ({ name: f, sql: fs.readFileSync(path.join(abs, f), 'utf8') }))
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      checksum TEXT,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)
}

async function migrate() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }
  const client = new Client({ connectionString: dbUrl })
  await client.connect()
  try {
    await ensureMigrationsTable(client)
    const files = readSqlFiles('db/migrations')
    for (const f of files) {
      const res = await client.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [f.name])
      if (res.rowCount > 0) {
        console.log(`- already applied: ${f.name}`)
        continue
      }
      console.log(`> applying: ${f.name}`)
      await client.query('BEGIN')
      try {
        await client.query(f.sql)
        await client.query('INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)', [f.name, String(f.sql.length)])
        await client.query('COMMIT')
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      }
    }
    console.log('migrations complete')
  } finally {
    await client.end()
  }
}

async function seed() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }
  const client = new Client({ connectionString: dbUrl })
  await client.connect()
  try {
    const files = readSqlFiles('db/seeds')
    for (const f of files) {
      console.log(`> seeding: ${f.name}`)
      await client.query(f.sql)
    }
    console.log('seeding complete')
  } finally {
    await client.end()
  }
}

const cmd = process.argv[2]
if (cmd === 'migrate') {
  migrate().catch(err => {
    console.error(err)
    process.exit(1)
  })
} else if (cmd === 'seed') {
  seed().catch(err => {
    console.error(err)
    process.exit(1)
  })
} else {
  console.error('usage: node scripts/db.js [migrate|seed]')
  process.exit(1)
}
