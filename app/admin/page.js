import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { calculateCategoryStandings, calculateGroupedStandings } from '@/lib/standings'
import { buildBracket, rankSurvivorsForDivision, deriveTeams } from '@/lib/squads'
import { buildSlamBracket } from '@/lib/slam'
import { LEVELS, CATEGORY_RULES } from '@/lib/tournament'
import { getAnalytics } from '@/lib/analytics-queries'
import AdminShell from '@/app/components/admin/AdminShell'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import Badge from '@/app/components/ui/Badge'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Administración', robots: { index: false, follow: false } }

const MATCH_FIELDS = `
  id, level, stage, group_id, squad_encounter_id, completed, winner_id,
  team1_id, team2_id, scheduled_at, court,
  team1:team1_id(id, name),
  team2:team2_id(id, name),
  sets(set_number, team1_score, team2_score, is_super_tiebreak)
`

export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/admin/login')

  const [
    { data: matches }, { data: teams }, { data: groups }, { data: squads }, { data: encounters },
    { data: slamParticipants }, { data: slamMatches },
  ] = await Promise.all([
      supabase.from('matches').select(MATCH_FIELDS)
        .order('scheduled_at', { ascending: true, nullsFirst: false }),
      supabase.from('teams').select('id, name, level'),
      supabase.from('tournament_groups')
        .select('id, name, level, group_entries(team_id)').order('name'),
      supabase.from('squads')
        .select('id, name, seed, squad_members(category, teams(id, name))')
        .order('seed', { nullsFirst: false }),
      supabase.from('squad_encounters')
        .select('id, round, position, squad1_id, squad2_id').order('position'),

      supabase.from('slam_participants')
        .select('id, seed, label, player:player_id(id, name)').order('seed'),
      supabase.from('slam_matches')
        .select('id, round, position, winner_slot, score, completed, scheduled_at, court'),
    ])

  const all = matches ?? []

  const squadList = (squads ?? []).map(s => ({
    ...s,
    membersByCategory: Object.fromEntries(
      (s.squad_members ?? []).filter(m => m.teams).map(m => [m.category, m.teams]),
    ),
  }))
  const squadIndex = Object.fromEntries(squadList.map(s => [s.id, s]))

  const bracket = buildBracket(
    (encounters ?? []).map(e => ({
      ...e,
      squad1: squadIndex[e.squad1_id] ?? null,
      squad2: squadIndex[e.squad2_id] ?? null,
    })),
    all.filter(m => m.squad_encounter_id),
  )

  // Per-division progress, which is what drives the knockout controls, plus
  // the ranking of the survivors the teams are derived from.
  const divisions  = {}
  const rankings   = {}
  for (const level of LEVELS) {
    const rules      = CATEGORY_RULES[level]
    const divTeams   = (teams ?? []).filter(t => t.level === level)
                        .map(t => ({ team_id: t.id, team_name: t.name }))
    const groupGames = all.filter(m => m.stage === 'group_stage' && m.level === level)
    const quarters   = all.filter(m => m.stage === 'quarterfinal' && m.level === level)

    let standings
    if (rules.groups > 1) {
      const grouped = calculateGroupedStandings(
        level,
        (groups ?? []).filter(g => g.level === level).map(g => ({
          id: g.id,
          name: g.name,
          teams: (g.group_entries ?? [])
            .map(e => divTeams.find(t => t.team_id === e.team_id))
            .filter(Boolean),
        })),
        groupGames,
      )
      standings = grouped.tables.flatMap(t => t.standings)
    } else {
      standings = calculateCategoryStandings(level, divTeams, groupGames)
    }

    const groupsPlayed = groupGames.filter(m => m.completed).length
    const ranking      = rankSurvivorsForDivision(level, quarters, standings)

    // Plain objects only — this crosses the server/client boundary, and the
    // performance object carries getters that would not survive the trip.
    rankings[level] = {
      complete: ranking.complete,
      played:   ranking.played,
      total:    ranking.total,
      ranked:   ranking.ranked.map(r => ({
        rank:      r.rank,
        team_id:   r.team_id,
        team_name: r.team_name,
        viaBye:    r.viaBye,
        setDiff:   r.performance?.setDiff  ?? null,
        gameDiff:  r.performance?.gameDiff ?? null,
        setsWon:   r.performance?.setsWon  ?? null,
        setsLost:  r.performance?.setsLost ?? null,
      })),
    }

    divisions[level] = {
      groupsPlayed,
      groupsTotal:   groupGames.length,
      groupsDone:    groupGames.length > 0 && groupsPlayed === groupGames.length,
      quartersDrawn: quarters.length > 0,
      quartersPlayed: quarters.filter(m => m.completed).length,
      survivors:     ranking.ranked.length,
    }
  }

  // What the four teams will look like given the results so far.
  const { teams: derivedTeams, ready: teamsReady } = deriveTeams(rankings)

  // The 1 Point Slam is its own competition; it just shares this panel.
  const slamBracket = buildSlamBracket(slamParticipants ?? [], slamMatches ?? [])
  const slam = {
    ...slamBracket,
    ready: (slamParticipants?.length ?? 0) > 0,
  }

  const counts = {
    pending:      all.filter(m => !m.completed).length,
    completed:    all.filter(m => m.completed).length,
    resolvedTies: bracket.filter(b => b.resolution.isComplete).length,
    slamPending:  slam.ready
      ? slamBracket.rounds.flatMap(r => r.matches).filter(m => m.ready && !m.completed).length
      : 0,
  }

  const analytics      = await getAnalytics(30)
  const needsMigration = encounters === null

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Solo organización"
        title="ADMINISTRACIÓN"
        description="Introduce resultados y lleva el torneo de la fase de grupos a la final. Todo se publica en el sitio al instante."
        actions={
          <>
            <Badge tone="neutral" size="md">{counts.pending} pendientes</Badge>
            <Badge tone="accent" size="md">{counts.completed} jugados</Badge>
          </>
        }
      />

      {needsMigration && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">
          Faltan tablas del cuadro. Ejecuta las migraciones de{' '}
          <code className="font-mono text-[12px]">supabase/migrations/</code> en el editor SQL de Supabase.
        </div>
      )}

      <AdminShell
        matches={all}
        divisions={divisions}
        rankings={rankings}
        derivedTeams={derivedTeams}
        teamsReady={teamsReady}
        squads={squadList}
        bracket={bracket}
        counts={counts}
        analytics={analytics}
        slam={slam}
      />
    </PageShell>
  )
}
