import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request) {
  try {
    const { player_id, voter_token } = await request.json()

    if (!player_id || !voter_token || voter_token.length < 10) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('mvp_votes')
      .insert({ player_id, voter_token })

    if (error) {
      // Postgres error code 23505 = UNIQUE constraint violation = already voted
      if (error.code === '23505') {
        return NextResponse.json({ error: 'already_voted' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}