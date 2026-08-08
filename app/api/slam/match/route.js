import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin }  from '@/lib/auth'
import { buildSlamBracket, SLAM_ROUND_KEYS } from '@/lib/slam'

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

  const { error } = await supabaseAdmin
    .from('slam_matches')
    .update({ winner_slot: slot, score: score?.trim() || null, completed: true })
    .eq('id', match.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Changing a result can orphan later rounds — a player who no longer belongs
  // there must not keep a win they earned on the old path. Anything downstream
  // whose participants no longer resolve is reset.
  const cleared = await clearOrphaned()

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

  const cleared = await clearOrphaned()
  return NextResponse.json({ ok: true, cleared })
}

/**
 * Clears results that no longer have two known participants.
 *
 * Rebuilds the bracket and resets any completed match whose slots no longer
 * resolve, repeating until nothing changes — one correction in the round of 16
 * can cascade all the way to the final.
 */
async function clearOrphaned() {
  let cleared = 0

  for (let pass = 0; pass < SLAM_ROUND_KEYS.length; pass++) {
    const bracket = await loadBracket()
    const stale = bracket.rounds
      .flatMap(r => r.matches)
      .filter(m => m.completed && m.id && !m.ready)

    if (stale.length === 0) break

    for (const m of stale) {
      await supabaseAdmin.from('slam_matches')
        .update({ winner_slot: null, score: null, completed: false })
        .eq('id', m.id)
      cleared++
    }
  }

  return cleared
}
