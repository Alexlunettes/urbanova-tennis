import { participantLabel } from '@/lib/slam'
import { courtLabel } from '@/lib/tournament'
import Badge from './ui/Badge'
import { cn } from '@/lib/cn'

/**
 * The 1 Point Slam bracket: sixteen individuals, four rounds, one champion.
 *
 * Laid out as four columns that grow apart the way a knockout does, and it
 * scrolls horizontally on narrow screens rather than reflowing, so the shape of
 * the draw survives on a phone. Every later round shows "Ganador de Octavos 3"
 * until that match is played, which is what makes the progression legible
 * before anyone has hit a ball.
 */
export default function SlamBracket({ rounds, champion }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-4 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-4 lg:gap-6">
        {rounds.map((round, i) => (
          <section key={round.key} className={cn('shrink-0', i === 0 ? 'w-68' : 'w-64')}>
            <div className="mb-4">
              <h3 className="font-display text-lg text-fg">{round.label.toUpperCase()}</h3>
              <p className="mt-0.5 text-[11px] text-fg-subtle">
                {round.matches.length} {round.matches.length === 1 ? 'partido' : 'partidos'}
                {round.matches[0]?.scheduled_at && ` · ${timeOf(round.matches[0].scheduled_at)}`}
              </p>
            </div>

            <div
              className={cn(
                'flex h-full flex-col',
                i === 0 ? 'gap-2.5' : i === 1 ? 'gap-14' : i === 2 ? 'gap-38' : 'justify-center',
              )}
            >
              {round.matches.map(match => (
                <SlamMatch
                  key={`${match.round}:${match.position}`}
                  match={match}
                  roundIndex={i}
                  isFinal={round.key === 'final'}
                />
              ))}
            </div>
          </section>
        ))}

        {/* ── The champion ── */}
        <section className="w-56 shrink-0 self-center">
          <div className="mb-4">
            <h3 className="font-display text-lg text-fg">CAMPEÓN</h3>
            <p className="mt-0.5 text-[11px] text-fg-subtle">1 Point Slam 2026</p>
          </div>
          <div
            className={cn(
              'rounded-2xl border p-5 text-center',
              champion
                ? 'border-sand-300/70 bg-sand-50/70 shadow-lg ring-1 ring-sand-300/30 dark:border-sand-400/30 dark:bg-sand-400/[0.07]'
                : 'border-dashed border-hairline-strong bg-surface-2/40',
            )}
          >
            <p className="text-2xl" aria-hidden="true">{champion ? '🏆' : '—'}</p>
            <p
              className={cn(
                'mt-2 font-display text-lg leading-tight',
                champion ? 'text-fg' : 'italic text-fg-subtle',
              )}
            >
              {champion ? participantLabel(champion) : 'Por decidir'}
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

function SlamMatch({ match, roundIndex, isFinal }) {
  const { p1, p2, winnerSlot, completed } = match

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border bg-surface',
        isFinal
          ? 'border-sand-300/70 shadow-md ring-1 ring-sand-300/25 dark:border-sand-400/30'
          : 'border-hairline shadow-xs',
      )}
    >
      <SlamSide
        participant={p1}
        won={completed && winnerSlot === 1}
        lost={completed && winnerSlot === 2}
        fallback={feederLabel(roundIndex, match.position, 1)}
      />
      <div className="h-px bg-hairline" />
      <SlamSide
        participant={p2}
        won={completed && winnerSlot === 2}
        lost={completed && winnerSlot === 1}
        fallback={feederLabel(roundIndex, match.position, 2)}
      />

      {(match.score || match.scheduled_at) && (
        <div className="flex items-center gap-2 border-t border-hairline bg-surface-2/40 px-3 py-1">
          <span className="tabular font-mono text-[9.5px] text-fg-subtle">
            {completed && match.score
              ? match.score
              : `${timeOf(match.scheduled_at)}${match.court ? ` · ${courtLabel(match.court)}` : ''}`}
          </span>
        </div>
      )}
    </article>
  )
}

function SlamSide({ participant, won, lost, fallback }) {
  const known = Boolean(participant)
  const name  = known ? participantLabel(participant) : fallback

  return (
    <div className={cn('flex items-center gap-2 px-3 py-2', won && 'bg-accent-soft')}>
      {won && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="shrink-0 text-accent" aria-label="Ganador">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {known && participant.seed != null && (
        <span className="tabular w-4 shrink-0 font-mono text-[9.5px] text-fg-subtle">
          {participant.seed}
        </span>
      )}
      <span
        className={cn(
          'truncate text-[12px]',
          !known ? 'italic text-fg-subtle'
          : won  ? 'font-medium text-fg'
          : lost ? 'text-fg-subtle line-through decoration-fg-subtle/30'
          : 'text-fg-muted',
        )}
      >
        {name}
      </span>
    </div>
  )
}

/** "Ganador de Octavos 3" — what fills a slot until the feeding match is played. */
function feederLabel(roundIndex, position, slot) {
  if (roundIndex === 0) return 'Por confirmar'
  const previous = ['Octavos', 'Cuartos', 'Semifinal'][roundIndex - 1]
  return `Ganador de ${previous} ${position * 2 - (slot === 1 ? 1 : 0)}`
}

function timeOf(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid',
  })
}

/** A compact summary for the top of the page. */
export function SlamSummary({ rounds, champion }) {
  const all    = rounds.flatMap(r => r.matches)
  const played = all.filter(m => m.completed).length

  return (
    <div className="flex flex-wrap gap-2">
      <Badge tone="neutral" size="md">16 participantes</Badge>
      <Badge tone={played === all.length ? 'accent' : 'neutral'} size="md">
        {played}/{all.length} partidos
      </Badge>
      {champion && <Badge tone="sand" size="md">🏆 {participantLabel(champion)}</Badge>}
    </div>
  )
}
