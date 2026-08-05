import { CATEGORY_META, CATEGORY_COLOR, CATEGORY_RULES, LEVELS } from '@/lib/tournament'
import Badge from './ui/Badge'
import { cn } from '@/lib/cn'

/**
 * The knockout stage as a single left-to-right bracket.
 *
 * The two halves work differently and the layout says so: the quarterfinal
 * column holds INDIVIDUAL PAIRS, division by division, while the semifinal and
 * final columns hold SQUADS built from whoever survives. The band between them
 * is where the squads are drawn.
 *
 * Scrolls horizontally on narrow screens rather than reflowing, so the shape
 * of the draw is never lost.
 */
export default function Bracket({ quarterfinalsByDivision, semifinals, final, squads }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-4 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-5 lg:gap-7">

        {/* ── Column 1: quarterfinals, by division ── */}
        <section className="w-75 shrink-0 sm:w-80">
          <ColumnHeading
            title="Cuartos de final"
            note="Por parejas · al mejor de 2 sets"
          />
          <div className="space-y-5">
            {LEVELS.map(level => (
              <DivisionQuarterfinals
                key={level}
                level={level}
                ties={quarterfinalsByDivision[level] ?? []}
              />
            ))}
          </div>
        </section>

        <Connector />

        {/* ── The squad draw ── */}
        <section className="w-64 shrink-0 self-start">
          <ColumnHeading title="Se forman los equipos" note="Tras los cuartos" />
          <SquadDrawNote squads={squads} />
        </section>

        <Connector />

        {/* ── Column 2: semifinals ── */}
        <section className="w-80 shrink-0 self-center sm:w-88">
          <ColumnHeading title="Semifinales" note="Equipo vs equipo · 4 partidos" />
          <div className="space-y-5">
            {semifinals.length > 0
              ? semifinals.map(tie => <SquadNode key={tie.id} tie={tie} squads={squads} />)
              : [1, 2].map(i => <SquadNode key={i} placeholder label={`Semifinal ${i}`} />)}
          </div>
        </section>

        <Connector />

        {/* ── Column 3: final ── */}
        <section className="w-80 shrink-0 self-center sm:w-88">
          <ColumnHeading title="Final" note="El título" />
          {final
            ? <SquadNode tie={final} squads={squads} isFinal />
            : <SquadNode placeholder label="Final" isFinal />}
        </section>
      </div>
    </div>
  )
}

function ColumnHeading({ title, note }) {
  return (
    <div className="mb-4">
      <h3 className="font-display text-xl text-fg">{title.toUpperCase()}</h3>
      <p className="mt-0.5 text-[11px] text-fg-subtle">{note}</p>
    </div>
  )
}

function Connector() {
  return (
    <div className="flex w-5 shrink-0 items-center justify-center lg:w-7" aria-hidden="true">
      <span className="h-32 w-px bg-linear-to-b from-transparent via-hairline-strong to-transparent" />
    </div>
  )
}

/* ─────────────────────────── QUARTERFINALS ─────────────────────────── */

function DivisionQuarterfinals({ level, ties }) {
  const rules  = CATEGORY_RULES[level]
  const colour = CATEGORY_COLOR[level]
  const slots  = Array.from({ length: rules.quarterfinals }, (_, i) => ties[i] ?? null)

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xs">
      <div className="flex items-center gap-2 border-b border-hairline bg-surface-2/50 px-3.5 py-2.5">
        <span className={cn('h-2 w-2 rounded-full', colour.dot)} />
        <span className="font-display text-base text-fg">{CATEGORY_META[level].name}</span>
        {rules.byes > 0 && (
          <Badge tone="sand" size="xs" className="ml-auto">1º pasa directo</Badge>
        )}
      </div>

      <div className="divide-y divide-hairline">
        {slots.map((tie, i) => (
          <PairTie key={tie?.id ?? i} tie={tie} index={i} />
        ))}
      </div>
    </div>
  )
}

function PairTie({ tie, index }) {
  if (!tie) {
    return (
      <div className="px-3.5 py-2.5">
        <p className="text-[11px] italic text-fg-subtle">
          Cuarto {index + 1} — pendiente del sorteo
        </p>
      </div>
    )
  }

  const t1Won = tie.completed && tie.winner_id === tie.team1_id
  const t2Won = tie.completed && tie.winner_id === tie.team2_id
  const sets  = (tie.sets ?? []).slice().sort((a, b) => a.set_number - b.set_number)

  return (
    <div className="px-3.5 py-2">
      <PairLine name={tie.team1?.name} won={t1Won} dimmed={tie.completed && !t1Won} />
      <div className="my-1 flex items-center gap-2">
        <span className="h-px flex-1 bg-hairline" />
        {sets.length > 0 ? (
          <span className="tabular font-mono text-[10px] text-fg-subtle">
            {sets.map(s => `${s.team1_score}-${s.team2_score}`).join(' ')}
          </span>
        ) : (
          <span className="text-[10px] text-fg-subtle">vs</span>
        )}
        <span className="h-px flex-1 bg-hairline" />
      </div>
      <PairLine name={tie.team2?.name} won={t2Won} dimmed={tie.completed && !t2Won} />
    </div>
  )
}

function PairLine({ name, won, dimmed }) {
  return (
    <div className="flex items-center gap-1.5">
      {won && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="shrink-0 text-accent" aria-label="Ganador">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      <span
        className={cn(
          'truncate text-[12px]',
          !name  ? 'italic text-fg-subtle'
          : won  ? 'font-medium text-fg'
          : dimmed ? 'text-fg-subtle'
          : 'text-fg-muted',
        )}
      >
        {name ?? 'Por determinar'}
      </span>
    </div>
  )
}

/* ────────────────────────── THE SQUAD DRAW ────────────────────────── */

function SquadDrawNote({ squads = [] }) {
  const formed = squads.length > 0

  return (
    <div className="rounded-2xl border border-dashed border-hairline-strong bg-surface-2/40 p-4">
      <p className="text-[12px] leading-relaxed text-fg-muted">
        Cada división termina los cuartos con <span className="font-medium text-fg">cuatro
        parejas vivas</span>. Se ordenan por su clasificación y se agrupan por
        rango: la mejor de cada división forma el Equipo 1, la segunda de cada
        división el Equipo 2, y así hasta el cuarto.
      </p>

      <div className="mt-3.5 space-y-1.5">
        {(formed ? squads : [1, 2, 3, 4].map(seed => ({ id: seed, seed, name: `Equipo ${seed}` })))
          .map(squad => (
            <div
              key={squad.id ?? squad.seed}
              className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-2.5 py-1.5"
            >
              <span className="tabular font-mono text-[10px] text-fg-subtle">
                {squad.seed ?? '—'}
              </span>
              <span className={cn('truncate text-[12px]', formed ? 'text-fg' : 'italic text-fg-subtle')}>
                {squad.name}
              </span>
              {formed && (
                <span className="ml-auto flex gap-0.5">
                  {LEVELS.map(l => (
                    <span
                      key={l}
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        squad.membersByCategory?.[l] ? CATEGORY_COLOR[l].dot : 'bg-hairline-strong',
                      )}
                      title={CATEGORY_META[l].name}
                    />
                  ))}
                </span>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}

/* ──────────────────── SEMIFINALS AND FINAL (SQUADS) ──────────────────── */

function SquadNode({ tie, squads, placeholder = false, label, isFinal = false }) {
  if (placeholder) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline-strong bg-surface-2/40 px-4 py-6 text-center">
        <p className="text-[12px] italic text-fg-subtle">{label} — por determinar</p>
      </div>
    )
  }

  const { resolution, explanation, matchesByCategory } = tie
  const s1Won = resolution.winnerSquadId && resolution.winnerSquadId === tie.squad1_id
  const s2Won = resolution.winnerSquadId && resolution.winnerSquadId === tie.squad2_id

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border bg-surface',
        isFinal
          ? 'border-sand-300/70 shadow-lg ring-1 ring-sand-300/30 dark:border-sand-400/30'
          : 'border-hairline shadow-xs',
      )}
    >
      <SquadSide
        squad={tie.squad1}
        won={s1Won}
        decided={resolution.isComplete}
        score={resolution.score.squad1.matches}
        pending={!resolution.isComplete}
      />

      <div className="flex items-center gap-2 border-y border-hairline bg-surface-2/50 px-4 py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-fg-subtle">
          {resolution.isComplete ? 'Final' : `${resolution.played}/${resolution.total} partidos`}
        </span>
        <span className="ml-auto flex gap-0.5">
          {LEVELS.map(l => {
            const m = matchesByCategory[l]
            return (
              <span
                key={l}
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  m?.completed ? CATEGORY_COLOR[l].dot : 'bg-hairline-strong',
                )}
                title={`${CATEGORY_META[l].name}${m?.completed ? ' · jugado' : ' · pendiente'}`}
              />
            )
          })}
        </span>
      </div>

      <SquadSide
        squad={tie.squad2}
        won={s2Won}
        decided={resolution.isComplete}
        score={resolution.score.squad2.matches}
        pending={!resolution.isComplete}
      />

      {explanation && (
        <p
          className={cn(
            'border-t border-hairline px-4 py-2 text-[11px]',
            resolution.isTied ? 'bg-red-50/60 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                              : 'bg-accent-soft text-fg-muted',
          )}
        >
          {isFinal && !resolution.isTied ? '🏆 ' : ''}{explanation}
        </p>
      )}
    </article>
  )
}

/**
 * One side of a squad tie: the squad name, its running match tally, and the
 * four pairs that make it up in smaller type — so a visitor can always see
 * who is actually playing for that squad.
 */
function SquadSide({ squad, won, decided, score, pending }) {
  return (
    <div className={cn('px-4 py-3', won && 'bg-accent-soft')}>
      <div className="flex items-center gap-2.5">
        <p
          className={cn(
            'min-w-0 flex-1 truncate font-display text-xl',
            !squad   ? 'italic text-fg-subtle'
            : won    ? 'text-fg'
            : decided ? 'text-fg-subtle'
            : 'text-fg-muted',
          )}
        >
          {squad?.name ?? 'Por determinar'}
        </p>
        <span
          className={cn(
            'tabular flex h-7 w-7 items-center justify-center rounded-lg font-mono text-sm',
            won ? 'bg-accent text-accent-fg'
            : pending ? 'border border-dashed border-hairline-strong text-fg-subtle'
            : 'border border-hairline bg-surface-2 text-fg-muted',
          )}
        >
          {score}
        </span>
      </div>

      {squad && (
        <ul className="mt-2 space-y-0.5">
          {LEVELS.map(level => {
            const pair = squad.membersByCategory?.[level]
            return (
              <li key={level} className="flex items-center gap-1.5">
                <span className={cn('h-1 w-1 shrink-0 rounded-full', CATEGORY_COLOR[level].dot)} />
                <span className="w-4 shrink-0 font-display text-[10px] text-fg-subtle">
                  {CATEGORY_META[level].short}
                </span>
                <span className={cn('truncate text-[11px]', pair ? 'text-fg-muted' : 'italic text-fg-subtle')}>
                  {pair?.name ?? '—'}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
