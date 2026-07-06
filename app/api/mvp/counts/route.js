import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  const { data, error } = await supabase
    .from('mvp_votes')
    .select('player_id')

  if (error) return NextResponse.json({}, { status: 500 })

  // Count votes per player_id
  const counts = {}
  for (const row of data) {
    counts[row.player_id] = (counts[row.player_id] ?? 0) + 1
  }

  return NextResponse.json(counts)
}