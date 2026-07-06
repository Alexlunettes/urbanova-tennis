import { NextResponse }  from 'next/server'
import { cookies }       from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request, { params }) {
  // 1. Auth check
  const cookieStore = await cookies()
  if (cookieStore.get('admin_session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params

  // 2. Delete all sets for this match
  const { error: setsError } = await supabaseAdmin
    .from('sets')
    .delete()
    .eq('match_id', id)

  if (setsError) {
    return NextResponse.json({ error: setsError.message }, { status: 500 })
  }

  // 3. Reset the match itself
  const { error: matchError } = await supabaseAdmin
    .from('matches')
    .update({
      completed:    false,
      winner_id:    null,
      completed_at: null,
    })
    .eq('id', id)

  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 })
  }

  // 4. If this was a knockout match, clear the winner from knockout_encounters too
  const { data: ko } = await supabaseAdmin
    .from('knockout_encounters')
    .select('id')
    .eq('match_id', id)
    .maybeSingle()

  if (ko) {
    await supabaseAdmin
      .from('knockout_encounters')
      .update({ winner_id: null })
      .eq('id', ko.id)
  }

  return NextResponse.json({ ok: true })
}