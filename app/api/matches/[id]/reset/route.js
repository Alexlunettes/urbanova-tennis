import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin }  from '@/lib/auth'

/**
 * Clears a result and returns the match to pending.
 *
 * Previously this also wrote `completed_at`, a column that did not exist, so
 * every reset failed with a 500 and the button in the admin panel never worked.
 */
export async function POST(request, { params }) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params

  const { error: setsError } = await supabaseAdmin.from('sets').delete().eq('match_id', id)
  if (setsError) {
    return NextResponse.json({ error: setsError.message }, { status: 500 })
  }

  const { error: matchError } = await supabaseAdmin
    .from('matches')
    .update({ completed: false, winner_id: null, completed_at: null })
    .eq('id', id)

  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 })
  }

  // Nothing else to undo: squad results are derived from match rows, so the
  // bracket recalculates on its own.
  return NextResponse.json({ ok: true })
}
