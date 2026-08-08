'use client'

import { participantLabel } from '@/lib/slam'
import { useAdminApi, Flash } from './useAdminApi'
import Badge from '../ui/Badge'
import { cn } from '@/lib/cn'

/**
 * Results for the 1 Point Slam.
 *
 * A match is won, not scored — pick the winner and they advance. Later rounds
 * stay locked until the matches feeding them are decided, because their
 * participants literally do not exist until then.
 */
export default function SlamManager({ rounds, champion, ready }) {
  const { send, busy, flash, setFlash } = useAdminApi()

  return (
    <div>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-surface p-4">
        <div className="mr-auto">
          <p className="font-display text-lg text-fg">1 POINT SLAM</p>
          <p className="mt-0.5 text-[11.5px] text-fg-subtle">
            Competición individual, independiente del torneo por parejas.
          </p>
        </div>
        {champion && <Badge tone="sand" size="md">🏆 {participantLabel(champion)}</Badge>}
        <button
          onClick={() => send('/api/slam/setup', { key: 'slam-setup' })}
          disabled={busy === 'slam-setup'}
          className="h-9 rounded-lg bg-accent px-4 text-xs font-medium text-accent-fg transition-all hover:brightness-110 disabled:opacity-40"
        >
          {busy === 'slam-setup'
            ? 'Preparando…'
            : ready ? 'Rehacer el cuadro' : 'Preparar el cuadro'}
        </button>
      </div>

      {!ready ? (
        <p className="rounded-xl border border-dashed border-hairline-strong bg-surface-2/40 px-4 py-8 text-center text-[12.5px] text-fg-subtle">
          Pulsa «Preparar el cuadro» para crear los 16 participantes y los 15 partidos.
        </p>
      ) : (
        <div className="space-y-6">
          {rounds.map(round => (
            <section key={round.key}>
              <h3 className="mb-2.5 font-display text-lg text-fg">
                {round.label.toUpperCase()}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {round.matches.map(match => (
                  <SlamRow
                    key={`${match.round}:${match.position}`}
                    match={match}
                    busy={busy}
                    onPick={slot => send('/api/slam/match', {
                      body: { round: match.round, position: match.position, winner_slot: slot },
                      key:  `${match.round}:${match.position}`,
                    })}
                    onReset={() => send(
                      `/api/slam/match?round=${match.round}&position=${match.position}`,
                      { method: 'DELETE', key: `reset-${match.round}:${match.position}` },
                    )}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function SlamRow({ match, busy, onPick, onReset }) {
  const key     = `${match.round}:${match.position}`
  const locked  = !match.ready
  const working = busy === key

  return (
    <div
      className={cn(
        'rounded-xl border p-3',
        locked ? 'border-dashed border-hairline-strong bg-surface-2/30' : 'border-hairline bg-surface',
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="tabular font-mono text-[10px] text-fg-subtle">
          #{match.position}
        </span>
        {locked && <span className="text-[10px] text-fg-subtle">Falta la ronda anterior</span>}
        {match.completed && (
          <button
            onClick={onReset}
            className="ml-auto text-[10px] text-red-600 transition-colors hover:underline"
          >
            Resetear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {[1, 2].map(slot => {
          const participant = slot === 1 ? match.p1 : match.p2
          const won = match.completed && match.winnerSlot === slot
          return (
            <button
              key={slot}
              onClick={() => onPick(slot)}
              disabled={locked || working}
              className={cn(
                'truncate rounded-lg border px-2.5 py-2 text-left text-[11.5px] transition-all disabled:opacity-40',
                won
                  ? 'border-accent bg-accent-soft font-medium text-accent'
                  : 'border-hairline text-fg-muted hover:border-hairline-strong hover:text-fg',
              )}
            >
              {won && '✓ '}
              {participant ? participantLabel(participant) : '—'}
            </button>
          )
        })}
      </div>
    </div>
  )
}
