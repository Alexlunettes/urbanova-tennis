import { NextResponse } from 'next/server'
import { supabase }     from '@/lib/supabase'

/**
 * Vote tallies for the public MVP vote.
 *
 * Returns counts keyed by player id, plus the number of votes cast in each
 * division so the page can show a per-division total rather than one global
 * one. Reads with the anon key — the tallies are public.
 */
export async function GET() {
  let { data, error } = await supabase
    .from('mvp_votes')
    .select('player_id, level')

  // 42703 = no `level` column yet, i.e. migration 0005 has not been run. Fall
  // back to the flat tally so the page keeps working rather than going blank.
  if (error?.code === '42703') {
    ;({ data, error } = await supabase.from('mvp_votes').select('player_id'))
  }

  if (error) return NextResponse.json({ counts: {}, byLevel: {} }, { status: 500 })

  const counts  = {}
  const byLevel = {}
  for (const row of data ?? []) {
    counts[row.player_id] = (counts[row.player_id] ?? 0) + 1
    if (row.level != null) byLevel[row.level] = (byLevel[row.level] ?? 0) + 1
  }

  return NextResponse.json({ counts, byLevel })
}
