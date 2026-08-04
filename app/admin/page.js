import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { calculateCategoryStandings } from '@/lib/standings'
import { buildBracket } from '@/lib/squads'
import { LEVELS } from '@/lib/tournament'
import AdminShell from '@/app/components/admin/AdminShell'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import Badge from '@/app/components/ui/Badge'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Administración', robots: { index: false, follow: false } }

const MATCH_FIELDS = `
  id, level, stage, squad_encounter_id, completed, winner_id,
  team1_id, team2_id, scheduled_at, court,
  team1:team1_id(id, name),
  team2:team2_id(id, name),
  sets(set_number, team1_score, team2_score, is_super_tiebreak)
`

export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/admin/login')

  const [
    { data: groupMatches },
    { data: knockoutMatches },
    { data: squads },
    { data: encounters },
    { data: teams },
  ] = await Promise.all([
    supabase.from('matches').select(MATCH_FIELDS)
      .eq('stage', 'group_stage')
      .order('scheduled_at', { ascending: true, nullsFirst: false }),

    supabase.from('matches').select(MATCH_FIELDS)
      .not('squad_encounter_id', 'is', null),

    supabase.from('squads')
      .select('id, name, seed, squad_members(id, category, teams(id, name, level))')
      .order('created_at'),

    supabase.from('squad_encounters')
      .select('id, round, position, squad1_id, squad2_id, is_reduced, scheduled_at, court')
      .order('position'),

    supabase.from('teams').select('id, name, level'),
  ])

  // Final group positions drive the pair pickers in the squad builder.
  const standingsByCategory = {}
  for (const level of LEVELS) {
    standingsByCategory[level] = calculateCategoryStandings(
      level,
      (teams ?? []).filter(t => t.level === level).map(t => ({ team_id: t.id, team_name: t.name })),
      (groupMatches ?? []).filter(m => m.level === level),
    )
  }

  const squadIndex = Object.fromEntries((squads ?? []).map(s => [s.id, s]))
  const bracket = buildBracket(
    (encounters ?? []).map(e => ({
      ...e,
      squad1: squadIndex[e.squad1_id] ?? null,
      squad2: squadIndex[e.squad2_id] ?? null,
    })),
    knockoutMatches ?? [],
  )

  const allMatches = [...(groupMatches ?? []), ...(knockoutMatches ?? [])]
  const counts = {
    pending:      allMatches.filter(m => !m.completed).length,
    completed:    allMatches.filter(m => m.completed).length,
    resolvedTies: bracket.filter(b => b.resolution.isComplete).length,
  }

  const needsMigration = encounters === null

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Solo organización"
        title="ADMINISTRACIÓN"
        description="Introduce resultados, compón las escuadras y monta el cuadro final. Todo se publica en el sitio al instante."
        actions={
          <>
            <Badge tone="neutral" size="md">{counts.pending} pendientes</Badge>
            <Badge tone="accent" size="md">{counts.completed} jugados</Badge>
          </>
        }
      />

      {needsMigration && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">
          Las tablas del cuadro por escuadras no existen todavía. Ejecuta las
          migraciones de <code className="font-mono text-[12px]">supabase/migrations/</code> en
          el editor SQL de Supabase.
        </div>
      )}

      <AdminShell
        groupMatches={groupMatches ?? []}
        knockoutMatches={knockoutMatches ?? []}
        squads={squads ?? []}
        encounters={encounters ?? []}
        bracket={bracket}
        standingsByCategory={standingsByCategory}
        counts={counts}
      />
    </PageShell>
  )
}
