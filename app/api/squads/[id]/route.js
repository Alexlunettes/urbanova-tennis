import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin }  from '@/lib/auth'

export async function PATCH(request, { params }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const patch = {}
  if (body.name !== undefined) {
    const trimmed = String(body.name).trim()
    if (!trimmed || trimmed.length > 60) {
      return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 })
    }
    patch.name = trimmed
  }
  if (body.seed !== undefined) {
    patch.seed = Number.isInteger(body.seed) ? body.seed : null
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('squads').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/**
 * Delete a squad. Its members go with it (ON DELETE CASCADE) and any encounter
 * referencing it is reset to "por determinar" (ON DELETE SET NULL), so the
 * bracket stays coherent.
 */
export async function DELETE(request, { params }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params

  // Matches belong to the tie, not the squad, so drop those explicitly first.
  const { data: encounters } = await supabaseAdmin
    .from('squad_encounters')
    .select('id')
    .or(`squad1_id.eq.${id},squad2_id.eq.${id}`)

  for (const e of encounters ?? []) {
    await supabaseAdmin.from('matches').delete().eq('squad_encounter_id', e.id)
  }

  const { error } = await supabaseAdmin.from('squads').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
