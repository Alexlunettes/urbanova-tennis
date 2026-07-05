import { NextResponse }  from 'next/server'
import { cookies }       from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

/* Inline standings calculator for seeding purposes.
   Returns teams sorted by: wins → set diff → game diff.  */
function computeGroupSeedings(entries, matches) {
  const s = {}
  for (const e of entries) {
    s[e.team_id] = { team_id: e.team_id, name: e.teams.name, W: 0, L: 0, SW: 0, SL: 0, GW: 0, GL: 0 }
  }
  for (const m of matches) {
    if (!m.winner_id || !m.sets?.length) continue
    const t1 = s[m.team1_id], t2 = s[m.team2_id]
    if (!t1 || !t2) continue
    let t1s = 0, t2s = 0
    for (const set of m.sets) {
      t1.GW += set.team1_score; t1.GL += set.team2_score
      t2.GW += set.team2_score; t2.GL += set.team1_score
      if (set.team1_score > set.team2_score) t1s++; else t2s++
    }
    t1.SW += t1s; t1.SL += t2s
    t2.SW += t2s; t2.SL += t1s
    m.winner_id === m.team1_id ? (t1.W++, t2.L++) : (t2.W++, t1.L++)
  }
  return Object.values(s).sort((a, b) => {
    if (b.W !== a.W) return b.W - a.W
    const sd = (b.SW - b.SL) - (a.SW - a.SL)
    if (sd !== 0) return sd
    return (b.GW - b.GL) - (a.GW - a.GL)
  })
}

export async function POST(request) {
  try {
    // 1. Auth
    const cookieStore = await cookies()
    if (cookieStore.get('admin_session')?.value !== 'authenticated') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { level } = await request.json()
    const lvl = Number(level)
    if (![1, 2, 3].includes(lvl)) {
      return NextResponse.json({ error: 'Nivel inválido' }, { status: 400 })
    }

  // 2. Guard: bracket must not already exist
  const { data: existing } = await supabaseAdmin
    .from('knockout_encounters').select('id').eq('level', lvl)
  if (existing?.length > 0) {
    return NextResponse.json({ error: 'El cuadro ya existe para este nivel' }, { status: 400 })
  }

  // 3. Get the two groups for this level
  const { data: groups } = await supabaseAdmin
    .from('tournament_groups').select('id, name').eq('level', lvl).order('name')
  if (!groups || groups.length < 2) {
    return NextResponse.json({ error: 'Se necesitan al menos 2 grupos' }, { status: 400 })
  }

  // 4. Compute standings per group
  const seedsByGroup = {}
  for (const g of groups) {
    const { data: entries } = await supabaseAdmin
      .from('group_entries')
      .select('team_id, teams(id, name)')
      .eq('group_id', g.id)

    const { data: matches } = await supabaseAdmin
      .from('matches')
      .select('team1_id, team2_id, winner_id, sets(team1_score, team2_score)')
      .eq('group_id', g.id)
      .eq('stage', 'group_stage')

    seedsByGroup[g.name] = computeGroupSeedings(entries || [], matches || [])
  }

  const ga = seedsByGroup['Grupo A']
  const gb = seedsByGroup['Grupo B']
  if (!ga?.[0] || !ga?.[1] || !gb?.[0] || !gb?.[1]) {
    return NextResponse.json({ error: 'No hay suficientes equipos clasificados' }, { status: 400 })
  }

  // SF1: Grupo A 1st vs Grupo B 2nd
  // SF2: Grupo B 1st vs Grupo A 2nd
  const { data: sf1, error: sf1Err } = await supabaseAdmin
  .from('matches')
  .insert({ level: lvl, stage: 'semifinal', team1_id: ga[0].team_id, team2_id: gb[1].team_id })
  .select('id').single()

if (sf1Err || !sf1) {
  console.error('SF1 insert mislukt:', sf1Err)
  return NextResponse.json({ error: `SF1 insert: ${sf1Err?.message}` }, { status: 500 })
}

const { data: sf2, error: sf2Err } = await supabaseAdmin
  .from('matches')
  .insert({ level: lvl, stage: 'semifinal', team1_id: gb[0].team_id, team2_id: ga[1].team_id })
  .select('id').single()

if (sf2Err || !sf2) {
  console.error('SF2 insert mislukt:', sf2Err)
  return NextResponse.json({ error: `SF2 insert: ${sf2Err?.message}` }, { status: 500 })
}

  // Create 3 knockout_encounters: SF1, SF2, Final placeholder (no match yet for Final)
  const { error: koErr } = await supabaseAdmin.from('knockout_encounters').insert([
  { level: lvl, round: 'semifinal', team1_id: ga[0].team_id, team2_id: gb[1].team_id, match_id: sf1.id },
  { level: lvl, round: 'semifinal', team1_id: gb[0].team_id, team2_id: ga[1].team_id, match_id: sf2.id },
  { level: lvl, round: 'final',     team1_id: null,           team2_id: null,           match_id: null  },
])

if (koErr) {
  console.error('knockout_encounters insert mislukt:', koErr)
  return NextResponse.json({ error: `KO insert: ${koErr.message}` }, { status: 500 })
}

  return NextResponse.json({
    success: true,
    sf1: `${ga[0].name} vs ${gb[1].name}`,
    sf2: `${gb[0].name} vs ${ga[1].name}`,
  })
}
 catch (err) {
    console.error('[bracket/seed] onverwachte fout:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}