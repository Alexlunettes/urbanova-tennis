import { CATEGORY_META } from '@/lib/tournament'
import { cn } from '@/lib/cn'

/**
 * Static illustration of how a squad encounter works.
 *
 * This is the single hardest idea in the tournament to explain in words, so it
 * gets a worked example: four matches, Squad A wins three, and the Category 2
 * pair loses its own match yet still advances. Shown on the homepage and again
 * on /reglas.
 */

const EXAMPLE = [
  { level: 1, a: 'Pareja 1ª A', b: 'Pareja 1ª B', winner: 'a', score: '6-4 6-3'  },
  { level: 2, a: 'Pareja 2ª A', b: 'Pareja 2ª B', winner: 'b', score: '4-6 2-6'  },
  { level: 3, a: 'Pareja 3ª A', b: 'Pareja 3ª B', winner: 'a', score: '7-5 6-4'  },
  { level: 4, a: 'Pareja 4ª A', b: 'Pareja 4ª B', winner: 'a', score: '6-2 6-1'  },
]

export default function SquadExplainer() {
  const aWins = EXAMPLE.filter(m => m.winner === 'a').length
  const bWins = EXAMPLE.length - aWins

  return (
    <div className="overflow-hidden rounded-3xl border border-hairline bg-surface shadow-md">

      {/* Scoreboard header */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-hairline bg-surface-2/60 px-5 py-5 sm:px-8">
        <SquadName name="Escuadra A" won={aWins > bWins} align="left" />
        <div className="flex items-center gap-2.5">
          <Tally value={aWins} winning={aWins > bWins} />
          <span className="text-xs font-medium text-fg-subtle">—</span>
          <Tally value={bWins} winning={bWins > aWins} />
        </div>
        <SquadName name="Escuadra B" won={bWins > aWins} align="right" />
      </div>

      {/* The four matches */}
      <div className="divide-y divide-hairline">
        {EXAMPLE.map(match => (
          <div
            key={match.level}
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-4 sm:gap-4 sm:px-8"
          >
            <SidePair
              label={match.a}
              won={match.winner === 'a'}
              align="left"
            />

            <div className="flex flex-col items-center gap-1.5">
              <span className="rounded-md border border-hairline bg-surface-2 px-2 py-0.5 font-display text-[13px] leading-none text-fg-muted">
                {CATEGORY_META[match.level].short}
              </span>
              <span className="tabular whitespace-nowrap font-mono text-[11px] text-fg-subtle">
                {match.score}
              </span>
            </div>

            <SidePair
              label={match.b}
              won={match.winner === 'b'}
              align="right"
            />
          </div>
        ))}
      </div>

      {/* The point of the whole thing */}
      <div className="border-t border-hairline bg-accent-soft px-5 py-5 sm:px-8">
        <div className="flex gap-3.5">
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
            className="mt-0.5 shrink-0 text-accent"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9.2" />
            <path d="M12 16.5v-5M12 8h.01" />
          </svg>
          <p className="text-[13px] leading-relaxed text-fg-muted">
            <span className="font-medium text-fg">
              La Escuadra A gana {aWins}–{bWins} y pasa de ronda.
            </span>{' '}
            La pareja de {CATEGORY_META[2].name} perdió su partido, pero avanza
            igualmente porque sus compañeras ganaron los otros tres. En caso de
            empate a dos, decide el total de sets y después el total de juegos.
          </p>
        </div>
      </div>
    </div>
  )
}

function SquadName({ name, won, align }) {
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <p className={cn('font-display text-2xl sm:text-3xl', won ? 'text-fg' : 'text-fg-subtle')}>
        {name}
      </p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
        4 parejas
      </p>
    </div>
  )
}

function Tally({ value, winning }) {
  return (
    <span
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-xl font-mono text-xl font-medium tabular',
        winning
          ? 'bg-accent text-accent-fg shadow-sm'
          : 'border border-hairline bg-surface text-fg-subtle',
      )}
    >
      {value}
    </span>
  )
}

function SidePair({ label, won, align }) {
  return (
    <div className={cn('flex items-center gap-2 min-w-0', align === 'right' && 'flex-row-reverse')}>
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
          won ? 'bg-accent text-accent-fg' : 'border border-hairline',
        )}
        aria-label={won ? 'Ganado' : 'Perdido'}
      >
        {won && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      <span
        className={cn(
          'truncate text-[13px]',
          won ? 'font-medium text-fg' : 'text-fg-subtle line-through decoration-fg-subtle/30',
        )}
      >
        {label}
      </span>
    </div>
  )
}
