import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { calculateCategoryStandings, calculateGroupedStandings } from '@/lib/standings'
import { buildBracket, survivorsForDivision } from '@/lib/squads'
import { LEVELS, CATEGORY_RULES } from '@/lib/tournament'
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

  const [{ data: matches }, { data: teams }, { data: groups }, { data: squads }, { data: encounters }] =
    await Promise.all([
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

  // Per-division progress, which is what drives the knockout controls.
  const divisions = {}
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
    const survivors    = survivorsForDivision(level, quarters, standings)

    divisions[level] = {
      groupsPlayed,
      groupsTotal:   groupGames.length,
      groupsDone:    groupGames.length > 0 && groupsPlayed === groupGames.length,
      quartersDrawn: quarters.length > 0,
      quartersPlayed: quarters.filter(m => m.completed).length,
      survivors:     survivors.survivors.length,
    }
  }

  const counts = {
    pending:      all.filter(m => !m.completed).length,
    completed:    all.filter(m => m.completed).length,
    resolvedTies: bracket.filter(b => b.resolution.isComplete).length,
  }

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
        squads={squadList}
        bracket={bracket}
        counts={counts}
      />
    </PageShell>
  )
}
