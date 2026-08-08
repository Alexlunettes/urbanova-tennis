import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin }  from '@/lib/auth'
import { LEVELS }        from '@/lib/tournament'
import { resolveEncounter } from '@/lib/squads'
import { finalSlot, slotToISO } from '@/lib/tournament-data'

/**
 * Sets up the final once both semifinals are decided.
 *
 * The whole winning TEAM goes through, not the pairs that happened to win their
 * own semifinal match: a pair can win 2–0 and still be out because its team
 * lost the tie 3–1. So the final's four matches are the two winning squads'
 * pairs meeting division by division — team1 from the first semifinal's winner,
 * team2 from the second's.
 */
export async function POST() {
  const denied = await requireAdmin()
  if (denied) return denied

  const { data: encounters } = await supabaseAdmin
    .from('squad_encounters')
    .select('id, round, position, squad1_id, squad2_id')
    .order('position')

  const semis = (encounters ?? []).filter(e => e.round === 'semifinal')
  const final = (encounters ?? []).find(e => e.round === 'final')

  if (semis.length < 2 || !final) {
    return NextResponse.json({ error: 'Faltan las semifinales o la final' }, { status: 400 })
  }

  const { data: semiMatches } = await supabaseAdmin
    .from('matches')
    .select('id, level, squad_encounter_id, team1_id, team2_id, completed, winner_id, sets(team1_score, team2_score)')
    .eq('stage', 'semifinal')

  const winners = []
  for (const semi of semis) {
    const own = (semiMatches ?? []).filter(m => m.squad_encounter_id === semi.id)
    const res = resolveEncounter(semi, own)
    if (!res.winnerSquadId) {
      return NextResponse.json(
        { error: 'Ambas semifinales deben estar resueltas primero' },
        { status: 400 },
      )
    }
    winners.push(res.winnerSquadId)
  }

  const { data: played } = await supabaseAdmin
    .from('matches').select('id').eq('stage', 'final').eq('completed', true).limit(1)
  if (played?.length) {
    return NextResponse.json({ error: 'La final ya tiene resultados' }, { status: 400 })
  }

  const { data: members } = await supabaseAdmin
    .from('squad_members')
    .select('squad_id, team_id, category')
    .in('squad_id', winners)

  const lookup = {}
  for (const m of members ?? []) lookup[`${m.squad_id}:${m.category}`] = m.team_id

  await supabaseAdmin.from('matches').delete().eq('stage', 'final').eq('completed', false)
  await supabaseAdmin
    .from('squad_encounters')
    .update({ squad1_id: winners[0], squad2_id: winners[1] })
    .eq('id', final.id)

  const rows = []
  for (const level of LEVELS) {
    const t1 = lookup[`${winners[0]}:${level}`]
    const t2 = lookup[`${winners[1]}:${level}`]
    if (!t1 || !t2) continue
    const slot = finalSlot(level)
    rows.push({
      level,
      stage:              'final',
      squad_encounter_id: final.id,
      team1_id:           t1,
      team2_id:           t2,
      completed:          false,
      scheduled_at:       slot ? slotToISO(slot.day, slot.time) : null,
      court:              slot?.court ?? null,
    })
  }

  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from('matches').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    created: rows.length,
    message: `Final montada con ${rows.length} partidos`,
  })
}
