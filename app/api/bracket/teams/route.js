import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin }  from '@/lib/auth'
import { LEVELS, CATEGORY_META, CATEGORY_RULES } from '@/lib/tournament'
import { calculateCategoryStandings, calculateGroupedStandings } from '@/lib/standings'
import { rankSurvivorsForDivision, deriveTeams, SEMIFINAL_SEEDING } from '@/lib/squads'
import { semifinalSlot, slotToISO } from '@/lib/tournament-data'

/**
 * The four semifinal teams, DERIVED FROM THE QUARTERFINAL RESULTS.
 *
 * From the semifinals the tournament is played by teams of four pairs, one per
 * division. Nothing here is chosen by hand: each division ranks its four
 * survivors on quarterfinal performance (see lib/squads.js), and the four teams
 * are then assembled by the fixed composition matrix — Equipo A takes the #1 of
 * the 1ª, the #2 of the 2ª, the #1 of the 3ª and the #2 of the 4ª, and so on.
 *
 * Saving also seeds the semifinals — A v D and B v C — and creates their four
 * matches each with their Sunday-morning kick-off times, so the public bracket
 * fills in the moment the last quarterfinal is scored.
 */

/** Ranks every division's survivors from the quarterfinals actually played. */
async function loadRankings() {
  const [{ data: teams }, { data: allMatches }, { data: groups }] = await Promise.all([
    supabaseAdmin.from('teams').select('id, name, level'),
    supabaseAdmin.from('matches')
      .select('id, level, stage, slot, group_id, team1_id, team2_id, completed, winner_id, team1:team1_id(name), team2:team2_id(name), sets(team1_score, team2_score)')
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

    // The group table is consulted for one thing only: identifying the pair
    // that skipped the quarterfinals in divisions 1 and 2. It never influences
    // the ranking of the pairs that actually played.
    byDivision[level] = rankSurvivorsForDivision(level, quarters, standings)

    if (quarters.length < rules.quarterfinals) {
      blocking.push(`${CATEGORY_META[level].name}: faltan cuartos por sortear`)
    } else if (!byDivision[level].complete) {
      const { played, total } = byDivision[level]
      blocking.push(`${CATEGORY_META[level].name}: faltan cuartos por jugar (${played}/${total})`)
    }
  }

  return { byDivision, blocking }
}

/** GET — the current derivation, for the admin panel to preview. */
export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  const { byDivision, blocking } = await loadRankings()
  const { teams, ready } = deriveTeams(byDivision)

  return NextResponse.json({ byDivision, teams, ready, blocking })
}

/** POST — derive the teams from the results and seed the semifinals. */
export async function POST() {
  const denied = await requireAdmin()
  if (denied) return denied

  const { byDivision, blocking } = await loadRankings()
  if (blocking.length > 0) {
    return NextResponse.json({ error: blocking.join(' · ') }, { status: 400 })
  }

  const { teams: derived, ready } = deriveTeams(byDivision)
  if (!ready || derived.some(t => !t.complete)) {
    return NextResponse.json(
      { error: 'Los cuartos no están completos: no se pueden formar los equipos todavía.' },
      { status: 400 },
    )
  }

  // Sanity check the matrix against the data before writing anything: sixteen
  // distinct pairs, four per team, one per division.
  const used = new Set()
  for (const team of derived) {
    for (const level of LEVELS) {
      const id = team.members[level]?.team_id
      if (!id) {
        return NextResponse.json(
          { error: `${team.name}: falta la pareja de ${CATEGORY_META[level].name}` },
          { status: 500 },
        )
      }
      if (used.has(id)) {
        return NextResponse.json(
          { error: `Una pareja quedaría en dos equipos (${CATEGORY_META[level].name})` },
          { status: 500 },
        )
      }
      used.add(id)
    }
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
    .insert(derived.map(t => ({ name: t.name, seed: t.seed })))
    .select('id, name, seed')
  if (squadError) return NextResponse.json({ error: squadError.message }, { status: 500 })

  const bySeed = Object.fromEntries(created.map(s => [s.seed, s]))

  const { error: memberError } = await supabaseAdmin.from('squad_members').insert(
    derived.flatMap(t => LEVELS.map(level => ({
      squad_id: bySeed[t.seed].id,
      team_id:  t.members[level].team_id,
      category: level,
    }))),
  )
  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })

  // Seed the semifinals — A v D and B v C — and create their matches.
  const { data: encounters } = await supabaseAdmin
    .from('squad_encounters')
    .select('id, position').eq('round', 'semifinal').order('position')

  const matchRows = []
  for (const [i, [seedA, seedB]] of SEMIFINAL_SEEDING.entries()) {
    const encounter = encounters?.[i]
    if (!encounter) continue
    const position = encounter.position ?? i + 1

    await supabaseAdmin.from('squad_encounters')
      .update({ squad1_id: bySeed[seedA].id, squad2_id: bySeed[seedB].id })
      .eq('id', encounter.id)

    const a = derived.find(t => t.seed === seedA)
    const b = derived.find(t => t.seed === seedB)
    for (const level of LEVELS) {
      const slot = semifinalSlot(position, level)
      matchRows.push({
        level,
        stage:              'semifinal',
        squad_encounter_id: encounter.id,
        // team1 always belongs to squad1 — the whole bracket relies on it.
        team1_id:     a.members[level].team_id,
        team2_id:     b.members[level].team_id,
        completed:    false,
        scheduled_at: slot ? slotToISO(slot.day, slot.time) : null,
        court:        slot?.court ?? null,
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
    message: `${created.length} equipos formados desde los cuartos · semifinales montadas`,
  })
}

/** DELETE — undo the derivation, as long as nothing has been played. */
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
