import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CATEGORY_META, CATEGORY_COLOR, LEVELS, ROUNDS, formatFor } from '@/lib/tournament'
import { buildBracket } from '@/lib/squads'
import RealtimeRefresher from '@/app/components/RealtimeRefresher'
import Bracket from '@/app/components/Bracket'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import EmptyState from '@/app/components/ui/EmptyState'
import Badge from '@/app/components/ui/Badge'
import { cn } from '@/lib/cn'

export const revalidate = 0

export const metadata = { title: 'Partidos' }

const TZ = 'Europe/Madrid'

const BASE_FIELDS = `
  id, level, stage, completed, scheduled_at, court, winner_id,
  team1_id, team2_id, squad_encounter_id,
  team1:team1_id(id, name),
  team2:team2_id(id, name),
  sets(set_number, team1_score, team2_score, is_super_tiebreak)
`

// `slot` only exists once migration 0003 has run, and only knockout matches
// use it. Keeping it out of the group-stage query means the calendar keeps
// working on a database that has not been migrated yet.
const KNOCKOUT_FIELDS = `${BASE_FIELDS}, slot`

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

/** ?cat= accepts a division number or "todos" for the chronological view. */
function parseView(params) {
  const vista = params?.vista === 'cuadro' ? 'cuadro' : 'grupos'
  const raw   = params?.cat
  const cat   = LEVELS.includes(Number(raw)) ? Number(raw) : 'todos'
  return { vista, cat }
}

export default async function PartidosPage({ searchParams }) {
  const params = await searchParams
  const { vista, cat } = parseView(params)

  const [{ data: groupMatches }, { data: knockoutMatches }, { data: encounters }, { data: squads }] =
    await Promise.all([
      supabase.from('matches').select(BASE_FIELDS)
        .eq('stage', 'group_stage')
        .order('scheduled_at', { ascending: true, nullsFirst: false }),

      supabase.from('matches').select(KNOCKOUT_FIELDS)
        .neq('stage', 'group_stage'),

      supabase.from('squad_encounters')
        .select('id, round, position, squad1_id, squad2_id, scheduled_at, court')
        .order('position'),

      supabase.from('squads')
        .select('id, name, seed, squad_members(category, teams(id, name))')
        .order('seed', { nullsFirst: false }),
    ])

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
    (knockoutMatches ?? []).filter(m => m.squad_encounter_id),
  )

  const quarterfinalsByDivision = {}
  for (const level of LEVELS) {
    quarterfinalsByDivision[level] = (knockoutMatches ?? [])
      .filter(m => m.stage === 'quarterfinal' && m.level === level)
      .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0))
  }

  return (
    <PageShell width="wide">
      <RealtimeRefresher
        tables={['matches', 'sets', 'squad_encounters', 'squads', 'squad_members']}
      />

      <PageHeader
        eyebrow="Calendario y resultados"
        title="PARTIDOS"
        description="Toda la competición en un sitio: el calendario de la fase de grupos y el cuadro final. Los resultados se actualizan en directo."
      />

      <ViewTabs vista={vista} cat={cat} />

      {vista === 'grupos'
        ? <GroupStageView matches={groupMatches ?? []} cat={cat} />
        : (
          <KnockoutView
            quarterfinalsByDivision={quarterfinalsByDivision}
            bracket={bracket}
            squads={squadList}
          />
        )}
    </PageShell>
  )
}

/* ──────────────────────────── NAVIGATION ──────────────────────────── */

function ViewTabs({ vista, cat }) {
  const tabs = [
    { key: 'grupos', label: 'Fase de grupos', href: '/partidos' },
    { key: 'cuadro', label: 'Cuadro final',   href: '/partidos?vista=cuadro' },
  ]

  return (
    <div className="mt-2 space-y-4">
      <div className="inline-flex gap-1 rounded-2xl border border-hairline bg-surface-2 p-1">
        {tabs.map(t => (
          <Link
            key={t.key}
            href={t.href}
            scroll={false}
            className={cn(
              'rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200',
              vista === t.key ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {vista === 'grupos' && (
        <div className="-mx-5 overflow-x-auto px-5 no-scrollbar sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-1.5">
            <DivisionChip href="/partidos" active={cat === 'todos'} label="Todas" />
            {LEVELS.map(level => (
              <DivisionChip
                key={level}
                href={`/partidos?cat=${level}`}
                active={cat === level}
                label={CATEGORY_META[level].name}
                dot={CATEGORY_COLOR[level].dot}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DivisionChip({ href, active, label, dot }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all',
        active
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-hairline bg-surface text-fg-muted hover:border-hairline-strong hover:text-fg',
      )}
    >
      {dot && <span className={cn('h-2 w-2 rounded-full', dot)} />}
      {label}
    </Link>
  )
}

/* ───────────────────────── GROUP STAGE VIEW ───────────────────────── */

function GroupStageView({ matches, cat }) {
  const visible = cat === 'todos' ? matches : matches.filter(m => m.level === cat)
  const played  = visible.filter(m => m.completed).length

  // Group by calendar day; unscheduled matches fall into their own bucket.
  const days = []
  const index = new Map()
  for (const match of visible) {
    const key = match.scheduled_at
      ? new Date(match.scheduled_at).toLocaleDateString('es-ES', { timeZone: TZ })
      : 'SIN_HORARIO'
    if (!index.has(key)) {
      index.set(key, { key, label: dayLabel(match.scheduled_at), matches: [] })
      days.push(index.get(key))
    }
    index.get(key).matches.push(match)
  }

  return (
    <>
      <div className="mt-7 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <p className="font-display text-3xl text-fg">
            {cat === 'todos' ? 'CALENDARIO COMPLETO' : CATEGORY_META[cat].name.toUpperCase()}
          </p>
          <p className="mt-0.5 text-xs text-fg-subtle">
            {cat === 'todos'
              ? 'Todos los partidos de las cuatro divisiones, en orden cronológico'
              : `${CATEGORY_META[cat].blurb} · ${formatFor('group_stage').label} por partido`}
          </p>
        </div>
        {visible.length > 0 && (
          <Badge tone={played === visible.length ? 'accent' : 'neutral'} size="md" className="ml-auto">
            {played} / {visible.length} jugados
          </Badge>
        )}
      </div>

      {days.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<CalendarIcon />}
          title="Calendario no disponible"
          description="Los partidos se publicarán aquí en cuanto se cierre el sorteo."
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
                {day.matches.map(m => (
                  <MatchRow key={m.id} match={m} showDivision={cat === 'todos'} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}

function MatchRow({ match, showDivision }) {
  const sets  = (match.sets ?? []).slice().sort((a, b) => a.set_number - b.set_number)
  const t1Won = match.completed && match.winner_id === match.team1_id
  const t2Won = match.completed && match.winner_id === match.team2_id
  const time  = timeLabel(match.scheduled_at)
  const colour = CATEGORY_COLOR[match.level]

  return (
    <article
      className={cn(
        'relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 overflow-hidden rounded-xl border py-3.5 pl-5 pr-4',
        'transition-all duration-200 sm:gap-5 sm:pr-5',
        match.completed
          ? 'border-hairline bg-surface hover:border-hairline-strong'
          : 'border-hairline bg-surface-2/40',
      )}
    >
      {/* Division rail — the same colour coding as the printed schedule. */}
      <span className={cn('absolute left-0 top-0 h-full w-1', colour.rail)} aria-hidden="true" />

      <div className="min-w-0">
        {showDivision && (
          <span className={cn('mb-1 inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider', colour.chip)}>
            {CATEGORY_META[match.level].short} División
          </span>
        )}
        <TeamName name={match.team1?.name} won={t1Won} dimmed={match.completed && !t1Won} />
      </div>

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
          <span className="tabular rounded-full border border-hairline bg-surface px-3 py-1 font-mono text-[11px] text-fg-muted">
            {time ?? 'Por fijar'}
          </span>
        )}
        {match.court && <span className="text-[10px] text-fg-subtle">Pista {match.court}</span>}
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

/* ─────────────────────────── KNOCKOUT VIEW ─────────────────────────── */

function KnockoutView({ quarterfinalsByDivision, bracket, squads }) {
  const semifinals = bracket.filter(b => b.round === 'semifinal')
  const final      = bracket.find(b => b.round === 'final')
  const anyMatches = Object.values(quarterfinalsByDivision).some(v => v.length > 0)

  return (
    <>
      <div className="mt-7 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <p className="font-display text-3xl text-fg">CUADRO FINAL</p>
          <p className="mt-0.5 text-xs text-fg-subtle">
            Cuartos por parejas · semifinales y final por equipos
          </p>
        </div>
        <Badge tone="neutral" size="md" className="ml-auto">
          {ROUNDS.quarterfinal.label} → {ROUNDS.final.label}
        </Badge>
      </div>

      {!anyMatches && squads.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<TrophyIcon />}
          title="El cuadro aún no está formado"
          description="Los cuartos se sortean cuando terminan los grupos. Los equipos se forman después, con las parejas que sobrevivan."
        />
      ) : (
        <div className="mt-8">
          <Bracket
            quarterfinalsByDivision={quarterfinalsByDivision}
            semifinals={semifinals}
            final={final}
            squads={squads}
          />
        </div>
      )}
    </>
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

function TrophyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 4M17 6h2.5a2.5 2.5 0 0 1-2.5 4M9 20h6M12 14v6" />
    </svg>
  )
}
