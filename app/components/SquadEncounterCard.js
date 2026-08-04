import { CATEGORY_META, categoriesInEncounter } from '@/lib/tournament'
import Badge from './ui/Badge'
import { cn } from '@/lib/cn'

/**
 * One squad-versus-squad tie.
 *
 * Rendered as a scoreboard rather than a bracket node, because each tie
 * contains up to four separate matches and a tree node cannot show them.
 * Every category line makes it visible that a pair can lose while its squad
 * still advances.
 */
export default function SquadEncounterCard({ entry, isFinal = false }) {
  const { squad1, squad2, resolution, explanation, matchesByCategory, is_reduced } = entry
  const categories = categoriesInEncounter(is_reduced)

  const s1Wins = resolution.winnerSquadId && resolution.winnerSquadId === entry.squad1_id
  const s2Wins = resolution.winnerSquadId && resolution.winnerSquadId === entry.squad2_id

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border bg-surface transition-shadow',
        isFinal
          ? 'border-sand-300/70 shadow-lg ring-1 ring-sand-300/30 dark:border-sand-400/30 dark:ring-sand-400/15'
          : 'border-hairline shadow-xs hover:shadow-md',
      )}
    >
      {/* ── Scoreboard ── */}
      <header
        className={cn(
          'grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-hairline px-4 py-4 sm:px-5',
          isFinal ? 'bg-sand-50/60 dark:bg-sand-400/[0.06]' : 'bg-surface-2/50',
        )}
      >
        <SquadLabel squad={squad1} won={s1Wins} decided={resolution.isComplete} />

        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <Tally value={resolution.score.squad1.matches} winning={s1Wins} pending={!resolution.isComplete} />
            <span className="text-[11px] text-fg-subtle">—</span>
            <Tally value={resolution.score.squad2.matches} winning={s2Wins} pending={!resolution.isComplete} />
          </div>
          {!resolution.isComplete && (
            <span className="tabular text-[10px] text-fg-subtle">
              {resolution.played}/{resolution.total}
            </span>
          )}
        </div>

        <SquadLabel squad={squad2} won={s2Wins} decided={resolution.isComplete} align="right" />
      </header>

      {/* ── One line per category ── */}
      <div className="divide-y divide-hairline">
        {categories.map(level => (
          <CategoryLine
            key={level}
            level={level}
            match={matchesByCategory[level]}
            squad1={squad1}
            squad2={squad2}
          />
        ))}

        {/* Categories 1 and 2 have only 7 teams, so their group winners wait in
            the semifinals — this tie is contested by Categories 3 and 4 alone. */}
        {is_reduced && [1, 2].map(level => (
          <div key={level} className="flex items-center gap-3 bg-surface-2/30 px-4 py-3 sm:px-5">
            <CategoryChip level={level} muted />
            <p className="text-[11.5px] leading-snug text-fg-subtle">
              Se incorpora en semifinales — la 1ª clasificada de{' '}
              {CATEGORY_META[level].name} entra directamente.
            </p>
          </div>
        ))}
      </div>

      {/* ── Outcome ── */}
      {(explanation || resolution.isTied) && (
        <footer
          className={cn(
            'flex flex-wrap items-center gap-2 border-t border-hairline px-4 py-3 sm:px-5',
            resolution.isTied ? 'bg-red-50/60 dark:bg-red-500/[0.07]' : 'bg-accent-soft',
          )}
        >
          {resolution.isTied ? (
            <Badge tone="danger" size="sm">Empate total</Badge>
          ) : (
            <Badge tone={isFinal ? 'sand' : 'accent'} size="sm">
              {isFinal ? '🏆 Campeona' : 'Clasificada'}
            </Badge>
          )}
          <p className="text-[12px] text-fg-muted">
            {resolution.isTied
              ? 'Empate en partidos, sets y juegos — lo resuelve la organización.'
              : explanation}
          </p>
        </footer>
      )}
    </article>
  )
}

function SquadLabel({ squad, won, decided, align = 'left' }) {
  const undecided = !squad
  return (
    <div className={cn('min-w-0', align === 'right' && 'text-right')}>
      <p
        className={cn(
          'truncate font-display text-xl sm:text-2xl',
          undecided ? 'italic text-fg-subtle'
          : won      ? 'text-fg'
          : decided  ? 'text-fg-subtle'
          :            'text-fg-muted',
        )}
      >
        {squad?.name ?? 'Por determinar'}
      </p>
      {won && (
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
          Avanza
        </p>
      )}
    </div>
  )
}

function Tally({ value, winning, pending }) {
  return (
    <span
      className={cn(
        'tabular flex h-9 w-9 items-center justify-center rounded-lg font-mono text-base font-medium',
        winning
          ? 'bg-accent text-accent-fg shadow-sm'
          : pending
            ? 'border border-dashed border-hairline-strong text-fg-subtle'
            : 'border border-hairline bg-surface-2 text-fg-muted',
      )}
    >
      {value}
    </span>
  )
}

function CategoryLine({ level, match, squad1, squad2 }) {
  const t1 = match?.team1
  const t2 = match?.team2
  const t1Won = match?.completed && match.winner_id === match.team1_id
  const t2Won = match?.completed && match.winner_id === match.team2_id

  const sets = (match?.sets ?? []).slice().sort((a, b) => a.set_number - b.set_number)

  // Before the tie is drawn, fall back to whichever pair each squad has
  // registered for this category.
  const fallback1 = squad1?.membersByCategory?.[level]
  const fallback2 = squad2?.membersByCategory?.[level]

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 sm:gap-4 sm:px-5">
      <PairName pair={t1 ?? fallback1} won={t1Won} dimmed={match?.completed && !t1Won} />

      <div className="flex flex-col items-center gap-1">
        <CategoryChip level={level} />
        {match?.completed ? (
          <div className="flex gap-0.5">
            {sets.map(s => (
              <span
                key={s.set_number}
                className="tabular rounded border border-hairline bg-surface-2 px-1 py-0.5 font-mono text-[10px] leading-none text-fg-muted"
              >
                {s.team1_score}–{s.team2_score}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[10px] text-fg-subtle">
            {match ? 'Pendiente' : '—'}
          </span>
        )}
      </div>

      <PairName pair={t2 ?? fallback2} won={t2Won} dimmed={match?.completed && !t2Won} align="right" />
    </div>
  )
}

function CategoryChip({ level, muted = false }) {
  return (
    <span
      className={cn(
        'rounded-md border px-1.5 py-0.5 font-display text-[12px] leading-none',
        muted
          ? 'border-dashed border-hairline-strong text-fg-subtle'
          : 'border-hairline bg-surface-2 text-fg-muted',
      )}
      title={CATEGORY_META[level].name}
    >
      {CATEGORY_META[level].short}
    </span>
  )
}

function PairName({ pair, won, dimmed, align = 'left' }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-1.5', align === 'right' && 'flex-row-reverse')}>
      {won && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" className="shrink-0 text-accent" aria-label="Ganado">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      <p
        className={cn(
          'truncate text-[12.5px]',
          align === 'right' && 'text-right',
          !pair   ? 'italic text-fg-subtle'
          : won   ? 'font-medium text-fg'
          : dimmed ? 'text-fg-subtle'
          :         'text-fg-muted',
        )}
      >
        {pair?.name ?? 'Por determinar'}
      </p>
    </div>
  )
}
