import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Records one MVP vote.
 *
 * The `voter_token` is generated client-side and stored in localStorage, and
 * the UNIQUE constraint on it is what enforces one vote per browser. That is
 * deliberately light — this is a friendly prize, not an election — but it does
 * mean a determined voter can clear storage and vote again.
 */
export async function POST(request) {
  try {
    const { player_id, voter_token } = await request.json().catch(() => ({}))

    if (
      typeof player_id !== 'string' ||
      typeof voter_token !== 'string' ||
      voter_token.length < 10 ||
      voter_token.length > 100
    ) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    // Reject votes for players who are not in the tournament.
    const { data: player } = await supabaseAdmin
      .from('players')
      .select('id')
      .eq('id', player_id)
      .maybeSingle()

    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('mvp_votes')
      .insert({ player_id, voter_token })

    if (error) {
      // 23505 = unique violation = this browser has already voted.
      if (error.code === '23505') {
        return NextResponse.json({ error: 'already_voted' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
