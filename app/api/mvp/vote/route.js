import { NextResponse }   from 'next/server'
import { supabaseAdmin }  from '@/lib/supabase-admin'
import { LEVELS }         from '@/lib/tournament'
import { VOTING_CLOSED }  from '@/lib/awards'

/**
 * Records one MVP vote, for one division.
 *
 * The 2026 vote is CLOSED (`VOTING_CLOSED` in lib/awards.js) and this endpoint
 * refuses everything while that holds. The voting UI is gone from the site, but
 * closing it here too is what actually stops a late vote landing and quietly
 * changing a result the Palmarés already presents as final. Flip the flag to
 * reopen for the next edition.
 *
 * There are four MVPs, one per division, so a visitor votes four times — once
 * in each. The UNIQUE index on (voter_token, level) is what keeps that to one
 * vote per browser per division. That is deliberately light — this is a
 * friendly prize, not an election — but it does mean a determined voter can
 * clear storage and vote again.
 *
 * The division is never taken from the request: it is looked up from the pair
 * the player actually plays in, so a crafted request cannot cast a 4ª-division
 * vote for a 1ª-division player, or spend four votes inside one division.
 */
export async function POST(request) {
  if (VOTING_CLOSED) {
    return NextResponse.json(
      { error: 'La votación al MVP está cerrada.', code: 'voting_closed' },
      { status: 403 },
    )
  }

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

    // Reject votes for players who are not in the tournament, and derive the
    // division from the pair they belong to.
    const { data: pairs } = await supabaseAdmin
      .from('teams')
      .select('level')
      .or(`player1_id.eq.${player_id},player2_id.eq.${player_id}`)

    if (!pairs?.length) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    const level = Math.min(...pairs.map(p => p.level))
    if (!LEVELS.includes(level)) {
      return NextResponse.json({ error: 'División inválida' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('mvp_votes')
      .insert({ player_id, voter_token, level })

    if (error) {
      if (error.code === '23505') {
        // A unique violation SHOULD mean this browser already voted in this
        // division. Confirm it against the table before saying so, because a
        // leftover unique index on `voter_token` alone raises the same code —
        // that is exactly how the old global one-vote-per-device lock survived
        // a migration that tried to drop it by the wrong name, and reporting it
        // as "already voted" is what made it invisible.
        const { count } = await supabaseAdmin
          .from('mvp_votes')
          .select('id', { count: 'exact', head: true })
          .eq('voter_token', voter_token)
          .eq('level', level)

        if (count && count > 0) {
          return NextResponse.json({ error: 'already_voted', level }, { status: 409 })
        }

        return NextResponse.json(
          {
            error: 'La votación está restringida por dispositivo en todas las categorías. ' +
                   'Falta aplicar la migración 0007 en Supabase.',
            code: 'global_lock',
          },
          { status: 503 },
        )
      }
      // 42703 = the `level` column is missing, i.e. migration 0005 has not run.
      if (error.code === '42703') {
        return NextResponse.json(
          { error: 'La votación por división aún no está activa.' },
          { status: 503 },
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, level })
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
