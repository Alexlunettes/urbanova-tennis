import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin }  from '@/lib/auth'
import { LEVELS, CATEGORY_RULES } from '@/lib/tournament'
import { calculateCategoryStandings, calculateGroupedStandings } from '@/lib/standings'
import { survivorsForDivision, proposeSquads, SEMIFINAL_SEEDING } from '@/lib/squads'

/**
 * Builds the four squads once every quarterfinal has been played, and slots
 * them into the semifinals.
 *
 * Each division ends the quarterfinals with four surviving pairs. They are
 * ranked on their group-stage record — for divisions 1, 2 and 4 that is the
 * overall table; for division 3, whose pairs come from three separate groups,
 * the same comparison is applied across them. The best remaining pair of each
 * division forms Escuadra 1, the second-best of each Escuadra 2, and so on.
 *
 * The semifinals are then seeded 1v4 and 2v3, and each tie's four matches
 * (one per division) are created. Anything already played is left alone.
 */
export async function POST() {
  const denied = await requireAdmin()
  if (denied) return denied

  const [{ data: teams }, { data: allMatches }, { data: groups }] = await Promise.all([
    supabaseAdmin.from('teams').select('id, name, level'),
    supabaseAdmin.from('matches')
      .select('id, level, stage, slot, group_id, team1_id, team2_id, completed, winner_id, sets(team1_score, team2_score)')
      .in('stage', ['group_stage', 'quarterfinal']),
    supabaseAdmin.from('tournament_groups')
      .select('id, name, level, group_entries(team_id)').order('name'),
  ])

  const byDivision = {}
  const blocking = []

  for (const level of LEVELS) {
    const rules      = CATEGORY_RULES[level]
    const divTeams   = (teams ?? []).filter(t => t.level === level).map(t => ({ team_id: t.id, team_name: t.name }))
    const groupGames = (allMatches ?? []).filter(m => m.stage === 'group_stage' && m.level === level)
    const quarters   = (allMatches ?? []).filter(m => m.stage === 'quarterfinal' && m.level === level)

    // Ranking source: one table, or three tables compared across.
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
      blocking.push(`División ${level}: faltan cuartos por sortear`)
    } else if (!result.complete) {
      blocking.push(`División ${level}: faltan cuartos por jugar`)
    }
  }

  if (blocking.length > 0) {
    return NextResponse.json({ error: blocking.join(' · ') }, { status: 400 })
  }

  const { squads: proposal } = proposeSquads(byDivision)

  // Rebuild the squads from scratch — but only if nothing has been played yet
  // in the squad rounds, so a tournament in progress is never disturbed.
  const { data: playedSquadMatches } = await supabaseAdmin
    .from('matches')
    .select('id')
    .in('stage', ['semifinal', 'final'])
    .eq('completed', true)
    .limit(1)

  if (playedSquadMatches?.length) {
    return NextResponse.json(
      { error: 'Ya hay partidos de escuadra jugados. Bórralos antes de rehacer las escuadras.' },
      { status: 400 },
    )
  }

  await supabaseAdmin.from('matches').delete().in('stage', ['semifinal', 'final'])
  await supabaseAdmin.from('squads').delete().not('id', 'is', null)

  const { data: created, error: squadError } = await supabaseAdmin
    .from('squads')
    .insert(proposal.map(s => ({ name: s.name, seed: s.seed })))
    .select('id, name, seed')
  if (squadError) return NextResponse.json({ error: squadError.message }, { status: 500 })

  const squadBySeed = Object.fromEntries(created.map(s => [s.seed, s]))

  const members = proposal.flatMap(s =>
    LEVELS.map(level => ({
      squad_id: squadBySeed[s.seed].id,
      team_id:  s.members[level].team_id,
      category: level,
    })),
  )
  const { error: memberError } = await supabaseAdmin.from('squad_members').insert(members)
  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })

  // Seed the semifinals 1v4 and 2v3, then create their matches.
  const { data: encounters } = await supabaseAdmin
    .from('squad_encounters')
    .select('id, round, position')
    .eq('round', 'semifinal')
    .order('position')

  const matchRows = []
  for (const [i, [seedA, seedB]] of SEMIFINAL_SEEDING.entries()) {
    const encounter = encounters?.[i]
    if (!encounter) continue
    const s1 = squadBySeed[seedA]
    const s2 = squadBySeed[seedB]

    await supabaseAdmin
      .from('squad_encounters')
      .update({ squad1_id: s1.id, squad2_id: s2.id })
      .eq('id', encounter.id)

    for (const level of LEVELS) {
      matchRows.push({
        level,
        stage:              'semifinal',
        squad_encounter_id: encounter.id,
        // team1 always belongs to squad1 — the whole bracket relies on it.
        team1_id: proposal.find(p => p.seed === seedA).members[level].team_id,
        team2_id: proposal.find(p => p.seed === seedB).members[level].team_id,
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
    await supabaseAdmin
      .from('squad_encounters')
      .update({ squad1_id: null, squad2_id: null })
      .eq('id', finalEnc.id)
  }

  return NextResponse.json({
    ok: true,
    squads: created.length,
    matches: matchRows.length,
    message: `${created.length} escuadras formadas · semifinales sorteadas (1v4 y 2v3)`,
  })
}
