import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin }  from '@/lib/auth'
import { slamParticipantRows, slamMatchRows, assertOppositeHalves, SLAM_DRAW } from '@/lib/slam'
import { slotToISO }     from '@/lib/tournament-data'

/**
 * Sets up the 1 Point Slam: the sixteen draw positions and the fifteen empty
 * matches that make up the bracket.
 *
 * Entrants are matched to EXISTING `players` rows by name — the slam never
 * creates a person who is already in the tournament. A name that matches
 * nothing is reported back rather than quietly inserted, because a miss almost
 * always means a spelling difference, and inventing a row would produce exactly
 * the duplicate this is meant to avoid.
 *
 * Safe to repeat: results already entered are left alone.
 */
export async function POST() {
  const denied = await requireAdmin()
  if (denied) return denied

  // Refuse to write a draw that would let the two of them meet early.
  try {
    assertOppositeHalves()
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  const wanted = SLAM_DRAW.filter(d => d.name).map(d => d.name)

  const { data: players, error: playerError } = await supabaseAdmin
    .from('players').select('id, name').in('name', wanted)
  if (playerError) {
    return NextResponse.json({ error: playerError.message }, { status: 500 })
  }

  const byName = Object.fromEntries((players ?? []).map(p => [p.name, p.id]))

  // Someone flagged `external` plays only the slam, so there is no existing
  // record to reuse and creating one is correct rather than duplication.
  const toCreate = SLAM_DRAW
    .filter(d => d.name && d.external && !byName[d.name])
    .map(d => ({ name: d.name }))

  if (toCreate.length > 0) {
    const { data: created, error } = await supabaseAdmin
      .from('players').insert(toCreate).select('id, name')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    for (const p of created ?? []) byName[p.name] = p.id
  }

  // Everyone else must already be in the tournament. A miss here almost always
  // means a spelling difference, and inserting would produce exactly the
  // duplicate this is meant to avoid.
  const missing = SLAM_DRAW
    .filter(d => d.name && !d.external && !byName[d.name])
    .map(d => d.name)

  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: `No se encuentran estos jugadores en el torneo: ${missing.join(', ')}. ` +
               'Corrige la ortografía en lib/slam.js en vez de crear jugadores nuevos.',
      },
      { status: 400 },
    )
  }

  const { error: partError } = await supabaseAdmin
    .from('slam_participants')
    .upsert(slamParticipantRows(byName), { onConflict: 'seed' })
  if (partError) {
    return NextResponse.json({ error: partError.message }, { status: 500 })
  }

  // Insert only the matches that do not exist yet, so scores survive a re-run.
  const { data: existing } = await supabaseAdmin
    .from('slam_matches').select('round, position')
  const have = new Set((existing ?? []).map(m => `${m.round}:${m.position}`))

  const newMatches = slamMatchRows(slotToISO).filter(r => !have.has(`${r.round}:${r.position}`))
  if (newMatches.length > 0) {
    const { error } = await supabaseAdmin.from('slam_matches').insert(newMatches)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    participants: SLAM_DRAW.length,
    created: newMatches.length,
    message:
      `1 Point Slam listo · ${SLAM_DRAW.length} participantes · ` +
      `${newMatches.length} partidos creados` +
      (toCreate.length ? ` · ${toCreate.length} jugador nuevo` : ''),
  })
}
