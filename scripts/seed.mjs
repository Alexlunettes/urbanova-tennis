/**
 * scripts/seed.mjs
 *
 * Imports the 2026 roster and group-stage fixtures from `lib/tournament-data.js`
 * into Supabase.
 *
 *   node scripts/seed.mjs --dry     preview what would change, write nothing
 *   node scripts/seed.mjs --reset   DELETE all tournament data, then re-import
 *   node scripts/seed.mjs           import, refusing to run if data exists
 *
 * Run migrations 0001 and 0002 in the Supabase SQL editor first.
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { CATEGORIES, TEAMS, FIXTURES, GROUPS, GROUP_BY_TEAM, slotToISO } from '../lib/tournament-data.js'

// ── Load .env.local without adding a dotenv dependency ─────────────────────
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('✗ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
  process.exit(1)
}

const db     = createClient(url, key, { auth: { persistSession: false } })
const DRY    = process.argv.includes('--dry')
const RESET  = process.argv.includes('--reset')

const ok   = m => console.log(`  \x1b[32m✓\x1b[0m ${m}`)
const info = m => console.log(`  \x1b[2m·\x1b[0m ${m}`)
const step = m => console.log(`\n\x1b[1m${m}\x1b[0m`)

function die(label, error) {
  if (!error) return
  console.error(`\n✗ ${label}: ${error.message}`)
  if (error.message?.includes('does not exist')) {
    console.error('  Have you run supabase/migrations/0001 and 0002 in the SQL editor?')
  }
  process.exit(1)
}

/** Insert in chunks — PostgREST rejects very large single payloads. */
async function insertAll(table, rows, select = 'id') {
  const out = []
  for (let i = 0; i < rows.length; i += 100) {
    const { data, error } = await db.from(table).insert(rows.slice(i, i + 100)).select(select)
    die(`insert ${table}`, error)
    out.push(...(data ?? []))
  }
  return out
}

// ═══════════════════════════════════════════════════════════════════════════

console.log(`\n\x1b[1mUrbanova Tennis — seed 2026\x1b[0m`)
console.log(`\x1b[2m${url}\x1b[0m`)
if (DRY) console.log('\x1b[33mDRY RUN — nothing will be written\x1b[0m')

step('1. Checking current state')
const existing = {}
for (const t of ['teams', 'players', 'matches', 'sets', 'squads', 'squad_encounters']) {
  const { count, error } = await db.from(t).select('id', { count: 'exact', head: true })
  die(`read ${t}`, error)
  existing[t] = count ?? 0
  info(`${t}: ${count} rows`)
}

const hasData = existing.teams > 0 || existing.players > 0
if (hasData && !RESET && !DRY) {
  console.error(
    '\n✗ The database already contains tournament data.\n' +
    '  Re-run with --reset to erase it and import a clean 2026 roster,\n' +
    '  or with --dry to preview. Scores already entered WILL BE LOST by --reset.'
  )
  process.exit(1)
}

if (RESET && !DRY) {
  step('2. Erasing existing tournament data')
  // Order matters: children before parents.
  for (const t of ['sets', 'matches', 'squad_members', 'squad_encounters', 'squads',
                   'group_entries', 'tournament_groups', 'mvp_votes', 'teams', 'players']) {
    const { error } = await db.from(t).delete().not('id', 'is', null)
    die(`clear ${t}`, error)
    ok(`cleared ${t}`)
  }
} else {
  step('2. Erase — skipped')
}

step('3. Players')
const playerRows = TEAMS.flatMap(t => t.players.map(name => ({ name })))
info(`${playerRows.length} players across ${TEAMS.length} teams`)
let playerIds = []
if (!DRY) {
  playerIds = (await insertAll('players', playerRows, 'id, name')).map(p => p.id)
  ok(`inserted ${playerIds.length} players`)
}

step('4. Teams')
// playerRows was built by flattening TEAMS in order, so slice 2 ids per team.
const teamRows = TEAMS.map((t, i) => ({
  name:       t.name,
  level:      t.level,
  player1_id: DRY ? null : playerIds[i * 2],
  player2_id: DRY ? null : playerIds[i * 2 + 1],
}))
for (const c of CATEGORIES) {
  info(`${c.name}: ${teamRows.filter(t => t.level === c.level).length} teams`)
}
const teamIdBySlug = {}
if (!DRY) {
  const inserted = await insertAll('teams', teamRows, 'id, name')
  // Insert order is preserved per chunk, and chunks are sequential.
  TEAMS.forEach((t, i) => { teamIdBySlug[t.id] = inserted[i].id })
  ok(`inserted ${inserted.length} teams`)
}

step('5. Group tables')
// Divisions 1, 2 and 4 play as a single table. Division 3's twelve pairs are
// split into three groups of four, each a complete round robin.
const groupIdBySlug = {}
for (const g of GROUPS) {
  info(`${g.name} (División ${g.level}): ${g.teams.length} parejas`)
}
if (!DRY) {
  const inserted = await insertAll(
    'tournament_groups',
    GROUPS.map(g => ({ name: g.name, level: g.level })),
    'id, name'
  )
  GROUPS.forEach((g, i) => { groupIdBySlug[g.id] = inserted[i].id })
  ok(`inserted ${inserted.length} group tables`)

  const entries = TEAMS.map(t => ({
    group_id: groupIdBySlug[GROUP_BY_TEAM[t.id].id],
    team_id:  teamIdBySlug[t.id],
  }))
  await insertAll('group_entries', entries)
  ok(`inserted ${entries.length} group entries`)
}

step('6. Group-stage fixtures')
const matchRows = FIXTURES.map(([day, time, court, a, b]) => ({
  level:        TEAMS.find(t => t.id === a).level,
  stage:        'group_stage',
  group_id:     DRY ? null : groupIdBySlug[GROUP_BY_TEAM[a].id],
  team1_id:     DRY ? null : teamIdBySlug[a],
  team2_id:     DRY ? null : teamIdBySlug[b],
  court,
  scheduled_at: day ? slotToISO(day, time) : null,
  completed:    false,
}))
for (const c of CATEGORIES) {
  info(`${c.name}: ${matchRows.filter(m => m.level === c.level).length} fixtures`)
}
info(`${matchRows.filter(m => !m.scheduled_at).length} drawn but not yet scheduled`)
if (!DRY) {
  const inserted = await insertAll('matches', matchRows)
  ok(`inserted ${inserted.length} fixtures`)
}

step('7. Knockout skeleton')
// Quarterfinals are played by INDIVIDUAL PAIRS, division by division, so they
// are ordinary match rows created from the admin panel once the group tables
// are final — nothing to pre-create here.
// Squads only exist from the semifinals on: two semifinals and one final.
const encounters = [
  ...[1, 2].map(p => ({ round: 'semifinal', position: p })),
  { round: 'final', position: 1 },
]
for (const c of CATEGORIES) {
  const r = { 1: 3, 2: 3, 3: 4, 4: 4 }[c.level]
  info(`${c.name}: ${r} cuartos entre parejas`)
}
info('Equipos: se forman al terminar los cuartos (2 semifinales + 1 final)')
if (!DRY) {
  await insertAll('squad_encounters', encounters)
  ok(`inserted ${encounters.length} squad ties (2 semifinales + final)`)
}

console.log(
  DRY
    ? '\n\x1b[33mDry run complete — no changes written.\x1b[0m\n'
    : '\n\x1b[32m\x1b[1mSeed complete.\x1b[0m Open /admin to start entering results.\n'
)
