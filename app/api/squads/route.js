import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin }  from '@/lib/auth'

/** All squads with their registered pairs. */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('squads')
    .select('id, name, seed, squad_members(id, category, teams(id, name, level))')
    .order('seed', { nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ squads: data ?? [] })
}

/** Create a squad. Pairs are added afterwards, one category at a time. */
export async function POST(request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { name, seed } = await request.json().catch(() => ({}))
  const trimmed = String(name ?? '').trim()

  if (!trimmed || trimmed.length > 60) {
    return NextResponse.json(
      { error: 'El nombre debe tener entre 1 y 60 caracteres' },
      { status: 400 },
    )
  }

  const { data, error } = await supabaseAdmin
    .from('squads')
    .insert({ name: trimmed, seed: Number.isInteger(seed) ? seed : null })
    .select('id, name, seed')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ squad: data })
}
