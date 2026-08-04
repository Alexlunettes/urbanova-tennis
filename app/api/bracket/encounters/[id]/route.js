import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin }  from '@/lib/auth'
import { categoriesInEncounter } from '@/lib/tournament'

/** Assign (or clear) the two squads contesting a tie. */
export async function PATCH(request, { params }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const patch = {}
  for (const key of ['squad1_id', 'squad2_id']) {
    if (body[key] !== undefined) patch[key] = body[key] || null
  }
  if (body.scheduled_at !== undefined) patch.scheduled_at = body.scheduled_at || null
  if (body.court !== undefined)        patch.court = body.court || null

  if (patch.squad1_id && patch.squad1_id === patch.squad2_id) {
    return NextResponse.json(
      { error: 'Una escuadra no puede enfrentarse a sí misma' },
      { status: 400 },
    )
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  // Changing who plays invalidates any unplayed match already generated.
  if (patch.squad1_id !== undefined || patch.squad2_id !== undefined) {
    await supabaseAdmin
      .from('matches')
      .delete()
      .eq('squad_encounter_id', id)
      .eq('completed', false)
  }

  const { error } = await supabaseAdmin.from('squad_encounters').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/**
 * Creates the individual matches for a tie — one per contested category.
 *
 * Convention enforced here and relied on everywhere downstream:
 * team1 always belongs to squad1 and team2 to squad2, which is what lets the
 * bracket derive squad results straight from `matches.winner_id`.
 *
 * Already-played matches are left untouched, so this is safe to re-run when a
 * squad receives a late pair (the reduced quarterfinal winner picking up its
 * Category 1 and 2 pairs for the semifinal).
 */
export async function POST(request, { params }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params

  const { data: encounter, error: encError } = await supabaseAdmin
    .from('squad_encounters')
    .select('id, round, position, squad1_id, squad2_id, is_reduced')
    .eq('id', id)
    .single()

  if (encError || !encounter) {
    return NextResponse.json({ error: 'Eliminatoria no encontrada' }, { status: 404 })
  }
  if (!encounter.squad1_id || !encounter.squad2_id) {
    return NextResponse.json(
      { error: 'Asigna las dos escuadras antes de generar los partidos' },
      { status: 400 },
    )
  }

  const { data: members } = await supabaseAdmin
    .from('squad_members')
    .select('squad_id, team_id, category')
    .in('squad_id', [encounter.squad1_id, encounter.squad2_id])

  const lookup = {}
  for (const m of members ?? []) lookup[`${m.squad_id}:${m.category}`] = m.team_id

  const { data: existing } = await supabaseAdmin
    .from('matches')
    .select('id, level, completed')
    .eq('squad_encounter_id', id)

  const existingByLevel = Object.fromEntries((existing ?? []).map(m => [m.level, m]))

  const toInsert = []
  const skipped  = []

  for (const category of categoriesInEncounter(encounter.is_reduced)) {
    if (existingByLevel[category]?.completed) continue     // never touch a played match

    const team1 = lookup[`${encounter.squad1_id}:${category}`]
    const team2 = lookup[`${encounter.squad2_id}:${category}`]

    if (!team1 || !team2) {
      skipped.push(category)
      continue
    }

    toInsert.push({
      level:              category,
      stage:              encounter.round,
      squad_encounter_id: id,
      team1_id:           team1,
      team2_id:           team2,
      completed:          false,
    })
  }

  // Replace the unplayed placeholders in one go.
  await supabaseAdmin
    .from('matches')
    .delete()
    .eq('squad_encounter_id', id)
    .eq('completed', false)

  if (toInsert.length > 0) {
    const { error } = await supabaseAdmin.from('matches').insert(toInsert)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    created: toInsert.length,
    skipped,
    message: skipped.length
      ? `Creados ${toInsert.length} partidos. Falta asignar pareja en: Categoría ${skipped.join(', ')}.`
      : `Creados ${toInsert.length} partidos.`,
  })
}

/** Remove every unplayed match from a tie. */
export async function DELETE(request, { params }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const { error } = await supabaseAdmin
    .from('matches')
    .delete()
    .eq('squad_encounter_id', id)
    .eq('completed', false)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
