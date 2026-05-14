#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import pg from 'pg'

const root = process.cwd()
const auditDate = process.env.AUDIT_DATE || new Date().toISOString().slice(0, 10)
const outputPath = resolve(root, 'docs/events-sql-rpc-verification.md')
const { Client } = pg
let sqlSource = 'exec_sql'
let rpcSqlError = null
let skipRpc = false
let pgClient = null

function readEnvFile(path) {
  if (!existsSync(path)) return {}

  const env = {}
  const text = readFileSync(path, 'utf8')

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const index = line.indexOf('=')
    if (index === -1) continue

    const key = line.slice(0, index).trim()
    let value = line.slice(index + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    env[key] = value
  }

  return env
}

function envUrl(source) {
  return source.SUPABASE_URL || source.VITE_SUPABASE_URL || source.NEXT_PUBLIC_SUPABASE_URL
}

function isLocalSupabaseUrl(value) {
  if (!value) return false
  try {
    const url = new URL(value)
    return ['127.0.0.1', 'localhost', '::1'].includes(url.hostname)
  } catch {
    return false
  }
}

const fileEnvs = {
  root: readEnvFile(resolve(root, '.env.local')),
  app: readEnvFile(resolve(root, 'app/.env.local')),
  functions: readEnvFile(resolve(root, 'supabase/functions/.env')),
  migration: readEnvFile(resolve(root, 'scripts/migration/.env'))
}

const urlCandidates = [
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  envUrl(fileEnvs.root),
  envUrl(fileEnvs.app),
  envUrl(fileEnvs.migration),
  envUrl(fileEnvs.functions)
].filter(Boolean)

const supabaseUrl = urlCandidates.find((value) => !isLocalSupabaseUrl(value)) || urlCandidates[0]
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  fileEnvs.root.SUPABASE_SERVICE_ROLE_KEY ||
  fileEnvs.migration.SUPABASE_SERVICE_ROLE_KEY ||
  fileEnvs.functions.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing production Supabase URL or service role key')
}

const normalizedUrl = supabaseUrl.replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${normalizedUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  })

  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  if (!response.ok) {
    const detail = typeof body === 'string' ? body : JSON.stringify(body)
    throw new Error(`${response.status} ${response.statusText}: ${detail}`)
  }

  return body
}

async function execSql(sql) {
  if (!skipRpc && process.env.SQL_VERIFICATION_METHOD !== 'pg') {
    try {
      const data = await request('/rest/v1/rpc/exec_sql', {
        method: 'POST',
        body: { sql }
      })

      sqlSource = 'exec_sql'
      return extractExecRows(data)
    } catch (error) {
      rpcSqlError = error.message
      skipRpc = true
    }
  }

  sqlSource = 'supabase-cli-pg'
  return execSqlWithPg(sql)
}

async function execSqlWithPg(sql) {
  if (!pgClient) {
    const credentials = getSupabaseCliPgCredentials()
    pgClient = new Client({
      host: credentials.PGHOST,
      port: Number(credentials.PGPORT || 5432),
      user: credentials.PGUSER,
      password: credentials.PGPASSWORD,
      database: credentials.PGDATABASE || 'postgres',
      ssl: { rejectUnauthorized: false }
    })

    await pgClient.connect()
  }

  const result = await pgClient.query(sql)
  return extractExecRows(result.rows)
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

async function execSqlRpcOnly(sql) {
  const data = await request('/rest/v1/rpc/exec_sql', {
    method: 'POST',
    body: { sql }
  })

  return extractExecRows(data)
}

function extractExecRows(data) {
  if (Array.isArray(data) && data.length === 1 && Array.isArray(data[0]?.result)) {
    return data[0].result
  }

  if (Array.isArray(data?.result)) return data.result
  if (Array.isArray(data)) return data
  return []
}

function escapeCell(value) {
  if (value === null || value === undefined || value === '') return '-'
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function formatTable(headers, rows) {
  if (!rows.length) return '_No rows._'

  const headerLine = `| ${headers.map(escapeCell).join(' | ')} |`
  const separator = `| ${headers.map(() => '---').join(' | ')} |`
  const body = rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`)

  return [headerLine, separator, ...body].join('\n')
}

function includesAny(values, candidates) {
  return candidates.some((candidate) => values.includes(candidate))
}

const policyRows = await execSql(`
  WITH target_tables(schema_name, table_name) AS (
    VALUES
      ('public', 'offerings'),
      ('public', 'offering_events'),
      ('public', 'event_categories'),
      ('public', 'event_capacity'),
      ('public', 'site_pages'),
      ('public', 'page_sections'),
      ('storage', 'objects')
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(summary) ORDER BY schema_name, table_name), '[]'::jsonb) AS result
  FROM (
    SELECT
      t.schema_name,
      t.table_name,
      c.oid IS NOT NULL AS table_exists,
      COALESCE(c.relrowsecurity, FALSE) AS rls_enabled,
      COALESCE(c.relforcerowsecurity, FALSE) AS rls_forced,
      COUNT(p.policyname)::integer AS policy_count,
      COUNT(p.policyname) FILTER (WHERE p.cmd = 'SELECT')::integer AS select_policy_count,
      COUNT(p.policyname) FILTER (WHERE p.cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL'))::integer AS mutation_policy_count,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'name', p.policyname,
            'cmd', p.cmd,
            'roles', p.roles,
            'qual', p.qual,
            'with_check', p.with_check
          )
          ORDER BY p.policyname
        ) FILTER (WHERE p.policyname IS NOT NULL),
        '[]'::jsonb
      ) AS policies
    FROM target_tables t
    LEFT JOIN pg_namespace n
      ON n.nspname = t.schema_name
    LEFT JOIN pg_class c
      ON c.relnamespace = n.oid
      AND c.relname = t.table_name
      AND c.relkind IN ('r', 'p')
    LEFT JOIN pg_policies p
      ON p.schemaname = t.schema_name
      AND p.tablename = t.table_name
    GROUP BY t.schema_name, t.table_name, c.oid, c.relrowsecurity, c.relforcerowsecurity
  ) summary;
`)

const functionRows = await execSql(`
  SELECT COALESCE(jsonb_agg(to_jsonb(fn) ORDER BY routine_name, identity_arguments), '[]'::jsonb) AS result
  FROM (
    SELECT
      n.nspname AS routine_schema,
      p.proname AS routine_name,
      pg_get_function_identity_arguments(p.oid) AS identity_arguments,
      pg_get_function_result(p.oid) AS result_type,
      p.prosecdef AS security_definer,
      p.provolatile AS volatility,
      p.proconfig AS config,
      obj_description(p.oid, 'pg_proc') AS comment,
      pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n
      ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('update_event_capacity_total', 'decrement_event_capacity')
  ) fn;
`)

const grantRows = await execSql(`
  SELECT COALESCE(jsonb_agg(to_jsonb(grants) ORDER BY routine_name, grantee, privilege_type), '[]'::jsonb) AS result
  FROM (
    SELECT
      n.nspname AS routine_schema,
      p.proname AS routine_name,
      pg_get_function_identity_arguments(p.oid) AS identity_arguments,
      CASE
        WHEN acl.grantee = 0 THEN 'PUBLIC'
        ELSE pg_get_userbyid(acl.grantee)
      END AS grantee,
      acl.privilege_type
    FROM pg_proc p
    JOIN pg_namespace n
      ON n.oid = p.pronamespace
    CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) AS acl
    WHERE n.nspname = 'public'
      AND p.proname IN ('update_event_capacity_total', 'decrement_event_capacity')
      AND acl.privilege_type = 'EXECUTE'
  ) grants;
`)

if (pgClient) {
  await pgClient.end()
}

const findings = []

for (const row of policyRows) {
  if (!row.table_exists) {
    findings.push({
      severity: 'P0',
      area: 'RLS table missing',
      detail: `${row.schema_name}.${row.table_name}`
    })
    continue
  }

  if (!row.rls_enabled) {
    findings.push({
      severity: 'P0',
      area: 'RLS disabled',
      detail: `${row.schema_name}.${row.table_name}`
    })
  }

  if (row.policy_count === 0) {
    findings.push({
      severity: 'P0',
      area: 'No policies',
      detail: `${row.schema_name}.${row.table_name}`
    })
  }
}

const grantsByFunction = grantRows.reduce((map, row) => {
  const grants = map.get(row.routine_name) || []
  grants.push(row)
  map.set(row.routine_name, grants)
  return map
}, new Map())

const requiredFunctions = [
  {
    name: 'update_event_capacity_total',
    signatureParts: ['p_offering_event_id uuid', 'p_total_capacity integer', 'p_waitlist_enabled boolean'],
    requiredBodyTerms: ['event_capacity', 'total_capacity', 'waitlist_enabled', 'offering_events']
  },
  {
    name: 'decrement_event_capacity',
    signatureParts: ['p_offering_event_id uuid', 'p_attendees integer'],
    requiredBodyTerms: ['event_capacity', 'spaces_booked', 'offering_events', 'current_bookings']
  }
]

const functionSummaries = []

for (const required of requiredFunctions) {
  const matches = functionRows.filter((row) =>
    row.routine_name === required.name &&
    required.signatureParts.every((part) => row.identity_arguments.includes(part))
  )
  const fn = matches[0]
  const grants = grantsByFunction.get(required.name) || []
  const grantees = [...new Set(grants.map((grant) => grant.grantee))].sort()
  const definition = fn?.definition || ''
  const config = Array.isArray(fn?.config) ? fn.config : []
  const fixedSearchPath = config.some((entry) => String(entry).startsWith('search_path='))
  const hasAdminGuard = /auth\.jwt\(\)|app_metadata|role'\)\s*=\s*'admin|role'\)\s*<>/i.test(definition)
  const hasRequiredBodyTerms = required.requiredBodyTerms.every((term) => definition.includes(term))
  const callableByBroadRole = includesAny(grantees, ['PUBLIC', 'anon', 'authenticated'])

  functionSummaries.push({
    name: required.name,
    found: Boolean(fn),
    signature: fn?.identity_arguments || '-',
    result_type: fn?.result_type || '-',
    security_definer: fn?.security_definer || false,
    fixed_search_path: fixedSearchPath,
    grantees,
    has_admin_guard: hasAdminGuard,
    has_required_body_terms: hasRequiredBodyTerms
  })

  if (!fn) {
    findings.push({
      severity: 'P0',
      area: 'RPC missing',
      detail: required.name
    })
    continue
  }

  if (matches.length > 1) {
    findings.push({
      severity: 'P1',
      area: 'RPC overload ambiguity',
      detail: `${required.name} has ${matches.length} matching overloads`
    })
  }

  if (fn.result_type !== 'void') {
    findings.push({
      severity: 'P1',
      area: 'RPC return type',
      detail: `${required.name} returns ${fn.result_type}`
    })
  }

  if (!fn.security_definer) {
    findings.push({
      severity: 'P0',
      area: 'RPC security mode',
      detail: `${required.name} is not SECURITY DEFINER`
    })
  }

  if (!fixedSearchPath) {
    findings.push({
      severity: 'P1',
      area: 'RPC search_path',
      detail: `${required.name} does not set search_path`
    })
  }

  if (!hasRequiredBodyTerms) {
    findings.push({
      severity: 'P1',
      area: 'RPC body check',
      detail: `${required.name} definition does not include expected capacity sync terms`
    })
  }

  if (required.name === 'update_event_capacity_total' && callableByBroadRole && !hasAdminGuard) {
    findings.push({
      severity: 'P0',
      area: 'RPC admin authorization',
      detail: 'update_event_capacity_total is callable by a broad role without an internal admin check'
    })
  }

  if (required.name === 'decrement_event_capacity' && callableByBroadRole) {
    findings.push({
      severity: 'P0',
      area: 'RPC execute grant',
      detail: 'decrement_event_capacity is callable by a broad role; it should be limited to service/webhook execution'
    })
  }
}

const markdown = `# Events SQL/RPC Verification

Status: current
Last updated: ${auditDate}
Parent workstream: [Events Data And CMS Readiness](./events-data-cms-readiness.md)
Audit source: production Supabase direct SQL through \`${sqlSource}\`${rpcSqlError ? `; \`exec_sql\` unavailable (${rpcSqlError.replace(/\|/g, '\\|')})` : ''}

## Run Summary

| Check | Result |
|-------|--------|
| Audit date | ${auditDate} |
| Project | ${new URL(normalizedUrl).host} |
| Policy tables checked | ${policyRows.length} |
| RPCs checked | ${requiredFunctions.length} |
| Findings | ${findings.length} |
| P0 findings | ${findings.filter((finding) => finding.severity === 'P0').length} |
| P1 findings | ${findings.filter((finding) => finding.severity === 'P1').length} |

## RLS Policy Summary

${formatTable(
  ['Table', 'Exists', 'RLS enabled', 'Policies', 'SELECT policies', 'Mutation policies'],
  policyRows.map((row) => [
    `${row.schema_name}.${row.table_name}`,
    row.table_exists ? 'yes' : 'no',
    row.rls_enabled ? 'yes' : 'no',
    row.policy_count,
    row.select_policy_count,
    row.mutation_policy_count
  ])
)}

## RLS Policy Names

${formatTable(
  ['Table', 'Command', 'Policy', 'Roles'],
  policyRows.flatMap((row) =>
    (row.policies || []).map((policy) => [
      `${row.schema_name}.${row.table_name}`,
      policy.cmd,
      policy.name,
      Array.isArray(policy.roles) ? policy.roles.join(', ') : policy.roles
    ])
  )
)}

## RPC Summary

${formatTable(
  ['RPC', 'Found', 'Signature', 'Returns', 'Security definer', 'Fixed search_path', 'Grantees', 'Admin guard', 'Capacity body terms'],
  functionSummaries.map((fn) => [
    fn.name,
    fn.found ? 'yes' : 'no',
    fn.signature,
    fn.result_type,
    fn.security_definer ? 'yes' : 'no',
    fn.fixed_search_path ? 'yes' : 'no',
    fn.grantees.length ? fn.grantees.join(', ') : '-',
    fn.has_admin_guard ? 'yes' : 'no',
    fn.has_required_body_terms ? 'yes' : 'no'
  ])
)}

## Findings

${formatTable(
  ['Severity', 'Area', 'Detail'],
  findings.map((finding) => [finding.severity, finding.area, finding.detail])
)}

## Interpretation

- Direct SQL can read \`pg_policies\`, \`pg_proc\`, and routine grants in production.
- RLS table checks confirm whether the target tables have RLS enabled and policies present; they do not prove every policy expression is semantically correct.
- RPC verification checks production function signatures, \`SECURITY DEFINER\`, explicit \`search_path\`, routine grants, and whether the function definitions include the expected capacity synchronization terms.
- Mutating RPCs were not executed against live event rows during this audit.
`

writeFileSync(outputPath, markdown, 'utf8')

console.log(JSON.stringify({
  outputPath,
  auditDate,
  policyTablesChecked: policyRows.length,
  rpcsChecked: requiredFunctions.length,
  findings: findings.length,
  p0Findings: findings.filter((finding) => finding.severity === 'P0').length,
  p1Findings: findings.filter((finding) => finding.severity === 'P1').length
}, null, 2))
