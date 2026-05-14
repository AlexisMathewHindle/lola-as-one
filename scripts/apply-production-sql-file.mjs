#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import pg from 'pg'

const root = process.cwd()
const { Client } = pg
const sqlFile = process.env.SQL_FILE
const applySql = process.env.APPLY_SQL === 'true'

if (!sqlFile) {
  throw new Error('Set SQL_FILE to the migration or SQL file to apply')
}

const sqlPath = resolve(root, sqlFile)
if (!existsSync(sqlPath)) {
  throw new Error(`SQL file not found: ${sqlPath}`)
}

const sql = readFileSync(sqlPath, 'utf8')

function findSupabaseCli() {
  const candidates = [
    process.env.SUPABASE_CLI_PATH,
    '/opt/homebrew/bin/supabase',
    '/usr/local/bin/supabase',
    '/opt/homebrew/Cellar/supabase/2.75.0/bin/supabase'
  ].filter(Boolean)

  const cli = candidates.find((candidate) => existsSync(candidate))
  if (!cli) {
    throw new Error('Supabase CLI was not found. Set SUPABASE_CLI_PATH or install the CLI.')
  }

  return cli
}

function getSupabaseCliPgCredentials() {
  const cli = findSupabaseCli()
  let output

  try {
    output = execFileSync(cli, ['db', 'dump', '--linked', '--schema', 'public', '--dry-run'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    })
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr).trim() : ''
    throw new Error(`Supabase CLI dry-run failed${stderr ? `: ${stderr}` : ''}`)
  }

  const credentials = {}
  for (const match of output.matchAll(/^export (PG[A-Z]+)="([^"]*)"$/gm)) {
    credentials[match[1]] = match[2]
  }

  for (const key of ['PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE']) {
    if (!credentials[key]) {
      throw new Error(`Supabase CLI dry-run did not return ${key}`)
    }
  }

  return credentials
}

if (!applySql) {
  console.log(JSON.stringify({
    mode: 'dry-run',
    sqlFile,
    bytes: sql.length,
    message: 'Set APPLY_SQL=true to apply this file to the linked production database.'
  }, null, 2))
} else {
  const credentials = getSupabaseCliPgCredentials()
  const client = new Client({
    host: credentials.PGHOST,
    port: Number(credentials.PGPORT || 5432),
    user: credentials.PGUSER,
    password: credentials.PGPASSWORD,
    database: credentials.PGDATABASE || 'postgres',
    ssl: { rejectUnauthorized: false }
  })

  await client.connect()
  try {
    await client.query('SET ROLE postgres')
    await client.query(sql)
  } finally {
    await client.end()
  }

  console.log(JSON.stringify({
    mode: 'applied',
    sqlFile,
    bytes: sql.length
  }, null, 2))
}
