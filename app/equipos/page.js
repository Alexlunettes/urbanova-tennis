import { supabase } from '@/lib/supabase'
import { LEVELS, CATEGORY_META, CATEGORY_RULES } from '@/lib/tournament'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import EmptyState from '@/app/components/ui/EmptyState'
import Badge from '@/app/components/ui/Badge'
import Button from '@/app/components/ui/Button'
import Card from '@/app/components/ui/Card'

export const revalidate = 60

export const metadata = { title: 'Parejas' }

export default async function EquiposPage() {
  const { data: teams, error } = await supabase
    .from('teams')
    .select(`
      id, name, level,
      player1:player1_id(id, name),
      player2:player2_id(id, name)
    `)
    .order('level')
    .order('name')

  const total = teams?.length ?? 0

  return (
    <PageShell>
      <PageHeader
        eyebrow="Torneo Urbanova 2026"
        title="LAS PAREJAS"
        description={
          total > 0
            ? `${total} parejas repartidas en cuatro categorías, de la más competitiva a la más numerosa.`
            : 'Cuarenta parejas repartidas en cuatro categorías.'
        }
      />

      {error && (
        <div
          role="alert"
          className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300"
        >
          No se pudieron cargar las parejas: {error.message}
        </div>
      )}

      {total === 0 && !error && (
        <EmptyState
          icon={<UsersIcon />}
          title="Parejas próximamente"
          description="El cuadro de inscritos se publicará en cuanto se cierren las inscripciones."
          action={
            <Button href="mailto:torneourbanova@gmail.com" variant="secondary">
              torneourbanova@gmail.com
            </Button>
          }
        />
      )}

      <div className="space-y-14">
        {LEVELS.map(level => {
          const categoryTeams = teams?.filter(t => t.level === level) ?? []
          if (categoryTeams.length === 0) return null
          const meta  = CATEGORY_META[level]
          const rules = CATEGORY_RULES[level]

          return (
            <section key={level}>
              <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-hairline pb-4">
                <span className="font-display text-4xl text-accent/30">{meta.short}</span>
                <div className="mr-auto">
                  <h2 className="font-display text-2xl text-fg">{meta.name}</h2>
                  <p className="text-xs text-fg-subtle">{meta.blurb}</p>
                </div>
                <Badge tone="neutral" size="md">{categoryTeams.length} parejas</Badge>
                <Badge tone="accent" size="md">
                  {rules.byes > 0
                    ? `1ª a semis · ${rules.qualifiers} a cuartos`
                    : `Top ${rules.qualifiers} a cuartos`}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categoryTeams.map((team, i) => (
                  <TeamCard key={team.id} team={team} index={i} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </PageShell>
  )
}

function TeamCard({ team, index }) {
  // Historically this read `team.players`, a field the query never returned,
  // so no roster ever rendered. The pair comes from player1/player2.
  const players = [team.player1, team.player2].filter(Boolean)

  return (
    <Card
      interactive
      className="animate-fade-up p-4"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <p className="truncate font-display text-lg text-fg">{team.name}</p>

      <div className="mt-3 space-y-1.5 border-t border-hairline pt-3">
        {players.length > 0 ? (
          players.map(p => (
            <p key={p.id} className="flex items-center gap-2 text-[13px] text-fg-muted">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[9px] font-medium text-accent">
                {initials(p.name)}
              </span>
              <span className="truncate">{p.name}</span>
            </p>
          ))
        ) : (
          <p className="text-xs italic text-fg-subtle">Jugadores por confirmar</p>
        )}
      </div>
    </Card>
  )
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3.2" />
      <path d="M22 20v-2a4 4 0 0 0-3-3.85M16.5 3.6a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
