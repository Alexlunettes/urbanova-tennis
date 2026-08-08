import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin }  from '@/lib/auth'
import { buildSlamBracket, descendantsOf, SLAM_ROUND_KEYS } from '@/lib/slam'

/** Loads the bracket as the server currently sees it. */
async function loadBracket() {
  const [{ data: participants }, { data: matches }] = await Promise.all([
    supabaseAdmin.from('slam_participants')
      .select('id, seed, label, player:player_id(id, name)').order('seed'),
    supabaseAdmin.from('slam_matches')
      .select('id, round, position, winner_slot, score, completed, scheduled_at, court'),
  ])
  return buildSlamBracket(participants ?? [], matches ?? [])
}

/** Finds one match in a built bracket. */
function locate(bracket, round, position) {
  return bracket.rounds
    .find(r => r.key === round)?.matches
    .find(m => m.position === position) ?? null
}

/**
 * Records the winner of one 1 Point Slam match.
 *
 * The winner is stored as a SLOT (1 = upper participant, 2 = lower) rather than
 * a player id, because later rounds have no stored line-up — their
 * participants are derived from the winners below. That is also why a result
 * can only be entered once both participants are actually known.
 */
export async function POST(request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { round, position, winner_slot, score } = await request.json().catch(() => ({}))
  const pos  = Number(position)
  const slot = Number(winner_slot)

  if (!SLAM_ROUND_KEYS.includes(round) || !Number.isInteger(pos) || pos < 1) {
    return NextResponse.json({ error: 'Partido inválido' }, { status: 400 })
  }
  if (slot !== 1 && slot !== 2) {
    return NextResponse.json({ error: 'Ganador inválido' }, { status: 400 })
  }
  if (score != null && (typeof score !== 'string' || score.length > 40)) {
    return NextResponse.json({ error: 'Resultado inválido' }, { status: 400 })
  }

  const bracket = await loadBracket()
  const match   = locate(bracket, round, pos)

  if (!match?.id) {
    return NextResponse.json(
      { error: 'Ese partido no existe todavía. Prepara el cuadro primero.' },
      { status: 404 },
    )
  }
  if (!match.ready) {
    return NextResponse.json(
      { error: 'Faltan los participantes: primero hay que resolver la ronda anterior.' },
      { status: 400 },
    )
  }

  // Re-picking the same winner is a no-op and must not wipe the rounds above.
  const changed = match.winnerSlot !== slot

  const { error } = await supabaseAdmin
    .from('slam_matches')
    .update({ winner_slot: slot, score: score?.trim() || null, completed: true })
    .eq('id', match.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const cleared = changed ? await clearDownstream(round, pos) : 0
  return NextResponse.json({ ok: true, cleared })
}

/** Resets one match back to pending. */
export async function DELETE(request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const url   = new URL(request.url)
  const round = url.searchParams.get('round')
  const pos   = Number(url.searchParams.get('position'))

  if (!SLAM_ROUND_KEYS.includes(round) || !Number.isInteger(pos) || pos < 1) {
    return NextResponse.json({ error: 'Partido inválido' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('slam_matches')
    .update({ winner_slot: null, score: null, completed: false })
    .eq('round', round).eq('position', pos)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const cleared = await clearDownstream(round, pos)
  return NextResponse.json({ ok: true, cleared })
}

/**
 * Clears every result above the match that just changed.
 *
 * A win is only meaningful against the opponent who was actually there, and a
 * match stores its winner as a SLOT rather than a person. So when the player
 * feeding a slot changes, leaving the old slot in place would silently
 * re-attribute someone else's win — flip the round of 16 and the quarterfinal
 * above it would still read "won", but now by a player who never played it.
 *
 * Clearing the whole chain to the final is the honest response: those matches
 * have to be re-entered because, as far as the bracket is concerned, they have
 * not happened yet.
 */
async function clearDownstream(round, position) {
  const chain = descendantsOf(round, position)
  let cleared = 0

  for (const target of chain) {
    const { data } = await supabaseAdmin
      .from('slam_matches')
      .update({ winner_slot: null, score: null, completed: false })
      .eq('round', target.round).eq('position', target.position)
      .eq('completed', true)
      .select('id')
    cleared += data?.length ?? 0
  }

  return cleared
}
