import { cookies }      from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request, { params }) {
  // Auth check — reads the cookie from the request
  const cookieStore = await cookies()
  if (cookieStore.get('admin_session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params          // Next.js 15: params is a Promise
  const { sets } = await request.json()
  // sets: [{ set_number, team1_score, team2_score }, ...]

  // Delete existing sets (allows correcting a score)
  await supabaseAdmin.from('sets').delete().eq('match_id', id)

  // Insert new sets
  const { error: setsError } = await supabaseAdmin.from('sets').insert(
    sets.map(s => ({
      match_id:          id,
      set_number:        s.set_number,
      team1_score:       s.team1_score,
      team2_score:       s.team2_score,
      is_super_tiebreak: s.set_number === 3,
    }))
  )
  if (setsError) {
    return NextResponse.json({ error: setsError.message }, { status: 500 })
  }

  // Determine winner
  let t1Sets = 0, t2Sets = 0
  for (const s of sets) {
    if (s.team1_score > s.team2_score) t1Sets++
    else t2Sets++
  }

  const { data: match, error: fetchError } = await supabaseAdmin
    .from('matches')
    .select('team1_id, team2_id, stage')
    .eq('id', id)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const winnerId = t1Sets > t2Sets ? match.team1_id : match.team2_id

  const { error: updateError } = await supabaseAdmin
    .from('matches')
    .update({ completed: true, winner_id: winnerId })
    .eq('id', id)

    // If this is a knockout match, propagate winner to knockout_encounters
    if (match.stage !== 'group_stage' && winnerId) {
    const { data: ko } = await supabaseAdmin
        .from('knockout_encounters')
        .select('id')
        .eq('match_id', id)
        .maybeSingle()

    if (ko) {
        await supabaseAdmin
        .from('knockout_encounters')
        .update({ winner_id: winnerId })
        .eq('id', ko.id)
    }   
    }

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}