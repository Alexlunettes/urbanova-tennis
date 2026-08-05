import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin }  from '@/lib/auth'
import { formatFor }     from '@/lib/tournament'

/**
 * Records the score of a match.
 *
 * The accepted shape depends on the round: a group-stage match is a single
 * set, while everything from the quarterfinals on is best of two sets with a
 * super tiebreak as the decider. The format is read from the match itself
 * rather than trusted from the client.
 *
 * Re-posting replaces the previous score, so a mistyped result is simply
 * entered again. Squad standings are derived from these rows, which means the
 * bracket updates itself with no extra bookkeeping.
 */
export async function POST(request, { params }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const { sets } = await request.json().catch(() => ({}))

  const { data: match, error: fetchError } = await supabaseAdmin
    .from('matches')
    .select('id, team1_id, team2_id, stage')
    .eq('id', id)
    .single()

  if (fetchError || !match) {
    return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })
  }

  const format  = formatFor(match.stage)
  const minSets = format.sets
  const maxSets = format.sets + (format.superTiebreak ? 1 : 0)

  if (!Array.isArray(sets) || sets.length < minSets || sets.length > maxSets) {
    return NextResponse.json(
      {
        error: minSets === maxSets
          ? `Este partido se juega a ${minSets} set`
          : `Se requieren ${minSets} o ${maxSets} sets`,
      },
      { status: 400 },
    )
  }

  const clean = []
  for (const [i, s] of sets.entries()) {
    const a = Number(s?.team1_score)
    const b = Number(s?.team2_score)
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a > 99 || b > 99) {
      return NextResponse.json({ error: `Set ${i + 1}: marcador inválido` }, { status: 400 })
    }
    if (a === b) {
      return NextResponse.json({ error: `Set ${i + 1}: no puede quedar empatado` }, { status: 400 })
    }
    clean.push({
      match_id:          id,
      set_number:        i + 1,
      team1_score:       a,
      team2_score:       b,
      // In a best-of-two the third entry is the deciding super tiebreak.
      is_super_tiebreak: format.superTiebreak && i === format.sets,
    })
  }

  let t1 = 0, t2 = 0
  for (const s of clean) (s.team1_score > s.team2_score ? t1++ : t2++)
  if (t1 === t2) {
    return NextResponse.json(
      { error: 'El resultado debe tener un ganador — añade el super tiebreak' },
      { status: 400 },
    )
  }

  const { error: deleteError } = await supabaseAdmin.from('sets').delete().eq('match_id', id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  const { error: insertError } = await supabaseAdmin.from('sets').insert(clean)
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const winnerId = t1 > t2 ? match.team1_id : match.team2_id

  const { error: updateError } = await supabaseAdmin
    .from('matches')
    .update({ completed: true, winner_id: winnerId, completed_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ ok: true, winner_id: winnerId })
}
