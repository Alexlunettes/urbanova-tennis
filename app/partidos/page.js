import { supabase } from '@/lib/supabase'
import { CATEGORY_META } from '@/lib/tournament'
import RealtimeRefresher from '@/app/components/RealtimeRefresher'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import CategoryTabs, { parseCategory } from '@/app/components/ui/CategoryTabs'
import EmptyState from '@/app/components/ui/EmptyState'
import Badge from '@/app/components/ui/Badge'
import { cn } from '@/lib/cn'

export const revalidate = 0

export const metadata = { title: 'Partidos' }

const TZ = 'Europe/Madrid'

function dayLabel(iso) {
  if (!iso) return 'Sin horario asignado'
  return new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ,
  })
}

function timeLabel(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit', timeZone: TZ,
  })
}

export default async function PartidosPage({ searchParams }) {
  const params = await searchParams
  const cat    = parseCategory(params)

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, completed, scheduled_at, court, winner_id,
      team1:team1_id(id, name),
      team2:team2_id(id, name),
      sets(set_number, team1_score, team2_score, is_super_tiebreak)
    `)
    .eq('stage', 'group_stage')
    .eq('level', cat)
    .order('scheduled_at', { ascending: true, nullsFirst: false })

  // Group by calendar day. Matches without a slot fall into their own bucket
  // at the end, rather than being hidden.
  const days = []
  const index = new Map()
  for (const match of matches ?? []) {
    const key = match.scheduled_at
      ? new Date(match.scheduled_at).toLocaleDateString('es-ES', { timeZone: TZ })
      : 'SIN_HORARIO'
    if (!index.has(key)) {
      index.set(key, { key, label: dayLabel(match.scheduled_at), matches: [] })
      days.push(index.get(key))
    }
    index.get(key).matches.push(match)
  }

  const played = (matches ?? []).filter(m => m.completed).length

  return (
    <PageShell>
      <RealtimeRefresher tables={['matches', 'sets']} />

      <PageHeader
        eyebrow="Fase de grupos"
        title="PARTIDOS"
        description="Calendario y resultados de la fase de grupos. Los resultados se actualizan en directo según se van introduciendo."
      />

      <CategoryTabs basePath="/partidos" active={cat} />

      <div className="mt-8 flex flex-wrap items-end gap-x-6 gap-y-3">
        <p className="font-display text-3xl text-fg">{CATEGORY_META[cat].name}</p>
        {(matches ?? []).length > 0 && (
          <Badge tone={played === matches.length ? 'accent' : 'neutral'} size="md" className="ml-auto">
            {played} / {matches.length} jugados
          </Badge>
        )}
      </div>

      {days.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<CalendarIcon />}
          title="Calendario no disponible"
          description={`Los partidos de ${CATEGORY_META[cat].name} se publicarán aquí en cuanto se cierre el sorteo.`}
        />
      ) : (
        <div className="mt-8 space-y-10">
          {days.map(day => (
            <section key={day.key}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="font-display text-2xl capitalize text-fg">{day.label}</h2>
                <span className="h-px flex-1 bg-hairline" />
                <span className="tabular text-xs text-fg-subtle">
                  {day.matches.length} {day.matches.length === 1 ? 'partido' : 'partidos'}
                </span>
              </div>
              <div className="space-y-2">
                {day.matches.map(m => <MatchRow key={m.id} match={m} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  )
}

function MatchRow({ match }) {
  const sets   = (match.sets ?? []).slice().sort((a, b) => a.set_number - b.set_number)
  const t1Won  = match.completed && match.winner_id === match.team1?.id
  const t2Won  = match.completed && match.winner_id === match.team2?.id
  const time   = timeLabel(match.scheduled_at)

  return (
    <article
      className={cn(
        'group grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border px-4 py-3.5',
        'transition-all duration-200 sm:gap-5 sm:px-5',
        match.completed
          ? 'border-hairline bg-surface hover:border-hairline-strong'
          : 'border-court-200/70 bg-court-50/40 dark:border-court-400/20 dark:bg-court-400/5',
      )}
    >
      <TeamName name={match.team1?.name} won={t1Won} dimmed={match.completed && !t1Won} />

      <div className="flex flex-col items-center gap-1">
        {match.completed ? (
          <div className="flex gap-1">
            {sets.map(s => (
              <span
                key={s.set_number}
                className={cn(
                  'tabular rounded-md border px-1.5 py-1 font-mono text-[11px] leading-none',
                  s.is_super_tiebreak
                    ? 'border-sand-300/60 bg-sand-50 text-sand-800 dark:bg-sand-400/10 dark:text-sand-300'
                    : 'border-hairline bg-surface-2 text-fg-muted',
                )}
                title={s.is_super_tiebreak ? 'Super tiebreak' : `Set ${s.set_number}`}
              >
                {s.team1_score}–{s.team2_score}
              </span>
            ))}
          </div>
        ) : (
          <span className="tabular rounded-full border border-court-300/50 bg-surface px-3 py-1 font-mono text-[11px] text-court-700 dark:border-court-400/25 dark:text-court-300">
            {time ?? 'Por fijar'}
          </span>
        )}
        {match.court && (
          <span className="text-[10px] text-fg-subtle">Pista {match.court}</span>
        )}
      </div>

      <TeamName name={match.team2?.name} won={t2Won} dimmed={match.completed && !t2Won} align="right" />
    </article>
  )
}

function TeamName({ name, won, dimmed, align = 'left' }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-1.5', align === 'right' && 'flex-row-reverse')}>
      {won && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" className="shrink-0 text-accent" aria-label="Ganador">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      <p
        className={cn(
          'truncate text-[13.5px]',
          align === 'right' && 'text-right',
          won ? 'font-medium text-fg' : dimmed ? 'text-fg-subtle' : 'text-fg-muted',
        )}
      >
        {name ?? '—'}
      </p>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}
