import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin }  from '@/lib/auth'
import { LEVELS, CATEGORY_META, CATEGORY_RULES } from '@/lib/tournament'
import { calculateCategoryStandings, calculateGroupedStandings } from '@/lib/standings'
import { survivorsForDivision, SEMIFINAL_SEEDING } from '@/lib/squads'

/**
 * The four semifinal teams, composed BY HAND.
 *
 * From the semifinals the tournament is played by teams of four pairs, one per
 * division. Those teams are drawn by the organisers once every quarterfinal is
 * done — the site never generates them, because players have real-world
 * availability constraints that only the organisers know about.
 *
 * This endpoint therefore takes a complete composition and stores it verbatim.
 * It validates rather than decides:
 *
 *   · exactly four teams
 *   · one pair per division in each
 *   · every pair actually survived its quarterfinal
 *   · no pair used twice
 *
 * Saving also seeds the semifinals — Equipo 1 v Equipo 2 and Equipo 3 v
 * Equipo 4 — and creates their four matches each, so the public bracket fills
 * in the moment the organisers press save.
 */

/** The pairs still standing, by division — what the admin picker offers. */
async function loadSurvivors() {
  const [{ data: teams }, { data: allMatches }, { data: groups }] = await Promise.all([
    supabaseAdmin.from('teams').select('id, name, level'),
    supabaseAdmin.from('matches')
      .select('id, level, stage, group_id, team1_id, team2_id, completed, winner_id, sets(team1_score, team2_score)')
      .in('stage', ['group_stage', 'quarterfinal']),
    supabaseAdmin.from('tournament_groups')
      .select('id, name, level, group_entries(team_id)').order('name'),
  ])

  const byDivision = {}
  const blocking = []

  for (const level of LEVELS) {
    const rules      = CATEGORY_RULES[level]
    const divTeams   = (teams ?? []).filter(t => t.level === level)
                        .map(t => ({ team_id: t.id, team_name: t.name }))
    const groupGames = (allMatches ?? []).filter(m => m.stage === 'group_stage' && m.level === level)
    const quarters   = (allMatches ?? []).filter(m => m.stage === 'quarterfinal' && m.level === level)

    let standings
    if (rules.groups > 1) {
      const grouped = calculateGroupedStandings(
        level,
        (groups ?? []).filter(g => g.level === level).map(g => ({
          id: g.id,
          name: g.name,
          teams: (g.group_entries ?? [])
            .map(e => divTeams.find(t => t.team_id === e.team_id))
            .filter(Boolean),
        })),
        groupGames,
      )
      standings = grouped.tables.flatMap(t => t.standings)
    } else {
      standings = calculateCategoryStandings(level, divTeams, groupGames)
    }

    const result = survivorsForDivision(level, quarters, standings)
    byDivision[level] = result

    if (quarters.length < rules.quarterfinals) {
      blocking.push(`${CATEGORY_META[level].name}: faltan cuartos por sortear`)
    } else if (!result.complete) {
      blocking.push(`${CATEGORY_META[level].name}: faltan cuartos por jugar`)
    }
  }

  return { byDivision, blocking }
}

/** POST — store the hand-picked teams and seed the semifinals from them. */
export async function POST(request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { teams: incoming } = await request.json().catch(() => ({}))

  if (!Array.isArray(incoming) || incoming.length !== 4) {
    return NextResponse.json({ error: 'Se requieren exactamente 4 equipos' }, { status: 400 })
  }

  const { byDivision, blocking } = await loadSurvivors()
  if (blocking.length > 0) {
    return NextResponse.json({ error: blocking.join(' · ') }, { status: 400 })
  }

  // Only pairs that actually survived their quarterfinal may be picked.
  const allowed = {}
  for (const level of LEVELS) {
    allowed[level] = new Set(byDivision[level].survivors.map(s => s.team_id))
  }

  const used = new Set()
  const clean = []

  for (const [i, team] of incoming.entries()) {
    const members = {}
    for (const level of LEVELS) {
      const id = team?.members?.[level] ?? team?.members?.[String(level)]
      if (!id) {
        return NextResponse.json(
          { error: `Equipo ${i + 1}: falta la pareja de ${CATEGORY_META[level].name}` },
          { status: 400 },
        )
      }
      if (!allowed[level].has(id)) {
        return NextResponse.json(
          { error: `Equipo ${i + 1}: esa pareja de ${CATEGORY_META[level].name} no está clasificada` },
          { status: 400 },
        )
      }
      if (used.has(id)) {
        return NextResponse.json(
          { error: `Una pareja no puede estar en dos equipos (${CATEGORY_META[level].name})` },
          { status: 400 },
        )
      }
      used.add(id)
      members[level] = id
    }

    const name = String(team?.name ?? '').trim() || `Equipo ${i + 1}`
    if (name.length > 60) {
      return NextResponse.json({ error: `Equipo ${i + 1}: nombre demasiado largo` }, { status: 400 })
    }
    clean.push({ seed: i + 1, name, members })
  }

  // Never disturb a knockout already in progress.
  const { data: played } = await supabaseAdmin
    .from('matches').select('id')
    .in('stage', ['semifinal', 'final']).eq('completed', true).limit(1)
  if (played?.length) {
    return NextResponse.json(
      { error: 'Ya hay partidos de equipo jugados. Bórralos antes de rehacer los equipos.' },
      { status: 400 },
    )
  }

  await supabaseAdmin.from('matches').delete().in('stage', ['semifinal', 'final'])
  await supabaseAdmin.from('squads').delete().not('id', 'is', null)

  const { data: created, error: squadError } = await supabaseAdmin
    .from('squads')
    .insert(clean.map(t => ({ name: t.name, seed: t.seed })))
    .select('id, name, seed')
  if (squadError) return NextResponse.json({ error: squadError.message }, { status: 500 })

  const bySeed = Object.fromEntries(created.map(s => [s.seed, s]))

  const { error: memberError } = await supabaseAdmin.from('squad_members').insert(
    clean.flatMap(t => LEVELS.map(level => ({
      squad_id: bySeed[t.seed].id,
      team_id:  t.members[level],
      category: level,
    }))),
  )
  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })

  // Seed the semifinals and create their matches.
  const { data: encounters } = await supabaseAdmin
    .from('squad_encounters')
    .select('id, position').eq('round', 'semifinal').order('position')

  const matchRows = []
  for (const [i, [seedA, seedB]] of SEMIFINAL_SEEDING.entries()) {
    const encounter = encounters?.[i]
    if (!encounter) continue

    await supabaseAdmin.from('squad_encounters')
      .update({ squad1_id: bySeed[seedA].id, squad2_id: bySeed[seedB].id })
      .eq('id', encounter.id)

    const a = clean.find(t => t.seed === seedA)
    const b = clean.find(t => t.seed === seedB)
    for (const level of LEVELS) {
      matchRows.push({
        level,
        stage:              'semifinal',
        squad_encounter_id: encounter.id,
        // team1 always belongs to squad1 — the whole bracket relies on it.
        team1_id:  a.members[level],
        team2_id:  b.members[level],
        completed: false,
      })
    }
  }

  if (matchRows.length > 0) {
    const { error } = await supabaseAdmin.from('matches').insert(matchRows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // The final stays empty until both semifinals are settled.
  const { data: finalEnc } = await supabaseAdmin
    .from('squad_encounters').select('id').eq('round', 'final').maybeSingle()
  if (finalEnc) {
    await supabaseAdmin.from('squad_encounters')
      .update({ squad1_id: null, squad2_id: null }).eq('id', finalEnc.id)
  }

  return NextResponse.json({
    ok: true,
    teams: created.length,
    matches: matchRows.length,
    message: `${created.length} equipos guardados · semifinales montadas`,
  })
}

/** DELETE — undo the draw, as long as nothing has been played. */
export async function DELETE() {
  const denied = await requireAdmin()
  if (denied) return denied

  const { data: played } = await supabaseAdmin
    .from('matches').select('id')
    .in('stage', ['semifinal', 'final']).eq('completed', true).limit(1)
  if (played?.length) {
    return NextResponse.json(
      { error: 'Hay partidos de equipo jugados. Bórralos primero.' },
      { status: 400 },
    )
  }

  await supabaseAdmin.from('matches').delete().in('stage', ['semifinal', 'final'])
  await supabaseAdmin.from('squads').delete().not('id', 'is', null)
  await supabaseAdmin.from('squad_encounters')
    .update({ squad1_id: null, squad2_id: null })
    .in('round', ['semifinal', 'final'])

  return NextResponse.json({ ok: true, message: 'Equipos eliminados' })
}
