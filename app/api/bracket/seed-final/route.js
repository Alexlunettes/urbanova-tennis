import { NextResponse }  from 'next/server'
import { cookies }       from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request) {
  const cookieStore = await cookies()
  if (cookieStore.get('admin_session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { level } = await request.json()
  const lvl = Number(level)

  // Get the 2 SF encounters + their match winners
  const { data: sfs } = await supabaseAdmin
    .from('knockout_encounters')
    .select('id, match_id, matches(winner_id)')
    .eq('level', lvl).eq('round', 'semifinal').order('created_at')

  if (!sfs || sfs.length !== 2) {
    return NextResponse.json({ error: 'Semifinales no encontradas' }, { status: 400 })
  }

  const w1 = sfs[0].matches?.winner_id
  const w2 = sfs[1].matches?.winner_id
  if (!w1 || !w2) {
    return NextResponse.json(
      { error: 'Ambas semifinales deben completarse primero' }, { status: 400 }
    )
  }

  // Get the final placeholder encounter
  const { data: finalKO } = await supabaseAdmin
    .from('knockout_encounters')
    .select('id, match_id').eq('level', lvl).eq('round', 'final').maybeSingle()

  if (!finalKO) {
    return NextResponse.json({ error: 'Slot de final no encontrado' }, { status: 400 })
  }
  if (finalKO.match_id) {
    return NextResponse.json({ error: 'La final ya fue generada' }, { status: 400 })
  }

  // Create the final match (now both teams are known)
  const { data: finalMatch, error } = await supabaseAdmin
    .from('matches')
    .insert({ level: lvl, stage: 'final', team1_id: w1, team2_id: w2 })
    .select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Link the match to the final encounter and fill in team IDs
  await supabaseAdmin
    .from('knockout_encounters')
    .update({ team1_id: w1, team2_id: w2, match_id: finalMatch.id })
    .eq('id', finalKO.id)

  return NextResponse.json({ success: true })
}