import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin }  from '@/lib/auth'
import { LEVELS }        from '@/lib/tournament'

/**
 * Assigns a pair to a squad's category slot, replacing whatever was there.
 *
 * A slot may legitimately be filled late: the squad that wins the reduced
 * quarterfinal receives its Category 1 and 2 pairs only on reaching the
 * semifinals, so this is a PUT rather than a create-once.
 */
export async function PUT(request, { params }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: squadId } = await params
  const { team_id, category } = await request.json().catch(() => ({}))

  const cat = Number(category)
  if (!LEVELS.includes(cat)) {
    return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })
  }
  if (!team_id) {
    return NextResponse.json({ error: 'Falta la pareja' }, { status: 400 })
  }

  // The pair must actually belong to the category it is being slotted into.
  const { data: team } = await supabaseAdmin
    .from('teams')
    .select('id, name, level')
    .eq('id', team_id)
    .single()

  if (!team) {
    return NextResponse.json({ error: 'Pareja no encontrada' }, { status: 404 })
  }
  if (team.level !== cat) {
    return NextResponse.json(
      { error: `${team.name} es de Categoría ${team.level}, no de Categoría ${cat}` },
      { status: 400 },
    )
  }

  // A pair can only be in one squad — clear any previous assignment, then
  // free this squad's slot for the category.
  await supabaseAdmin.from('squad_members').delete().eq('team_id', team_id)
  await supabaseAdmin.from('squad_members').delete().eq('squad_id', squadId).eq('category', cat)

  const { data, error } = await supabaseAdmin
    .from('squad_members')
    .insert({ squad_id: squadId, team_id, category: cat })
    .select('id, category, teams(id, name, level)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Any tie already generated for this squad now has a stale line-up.
  await invalidateEncounterMatches(squadId, cat)

  return NextResponse.json({ member: data })
}

/** Empty a category slot. */
export async function DELETE(request, { params }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: squadId } = await params
  const cat = Number(new URL(request.url).searchParams.get('category'))

  if (!LEVELS.includes(cat)) {
    return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('squad_members')
    .delete()
    .eq('squad_id', squadId)
    .eq('category', cat)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await invalidateEncounterMatches(squadId, cat)
  return NextResponse.json({ ok: true })
}

/**
 * Removes the now-outdated match for this category from any tie the squad is
 * in, but only while it is still unplayed — a recorded result is never
 * silently discarded.
 */
async function invalidateEncounterMatches(squadId, category) {
  const { data: encounters } = await supabaseAdmin
    .from('squad_encounters')
    .select('id')
    .or(`squad1_id.eq.${squadId},squad2_id.eq.${squadId}`)

  for (const e of encounters ?? []) {
    await supabaseAdmin
      .from('matches')
      .delete()
      .eq('squad_encounter_id', e.id)
      .eq('level', category)
      .eq('completed', false)
  }
}
