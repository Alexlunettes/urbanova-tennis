import { cookies }      from 'next/headers'
import { redirect }     from 'next/navigation'
import { supabase }     from '@/lib/supabase'
import AdminPanel       from '@/app/components/AdminPanel'
import AdminBracket     from '@/app/components/AdminBracket'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const cookieStore = await cookies()
  if (cookieStore.get('admin_session')?.value !== 'authenticated') {
    redirect('/admin/login')
  }

  const [
    { data: pending   },
    { data: completed },
    { data: encounters },
  ] = await Promise.all([
    supabase
      .from('matches')
      .select(`
        id, level, scheduled_at, court,
        team1:team1_id(id, name),
        team2:team2_id(id, name),
        tournament_groups(id, name)
      `)
      .eq('stage', 'group_stage')
      .eq('completed', false)
      .order('level')
      .order('scheduled_at', { ascending: true, nullsFirst: false }),

    supabase
      .from('matches')
      .select(`
        id, level,
        team1:team1_id(id, name),
        team2:team2_id(id, name),
        winner:winner_id(id, name),
        sets(set_number, team1_score, team2_score)
      `)
      .eq('stage', 'group_stage')
      .eq('completed', true)
      .order('level'),

    supabase
      .from('knockout_encounters')
      .select(`
        id, level, round, team1_id, team2_id, winner_id,
        team1:team1_id(id, name),
        team2:team2_id(id, name),
        winner:winner_id(id, name),
        match:match_id(id, completed, winner_id,
          sets(set_number, team1_score, team2_score))
      `)
      .order('level')
      .order('created_at'),
  ])

  return (
    <>
      <AdminPanel
        initialPending={pending    || []}
        initialCompleted={completed || []}
      />
      <AdminBracket initialEncounters={encounters || []} />
    </>
  )
}