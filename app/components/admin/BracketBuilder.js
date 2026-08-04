'use client'

import { ROUNDS, CATEGORY_META, categoriesInEncounter } from '@/lib/tournament'
import { useAdminApi, Flash } from './useAdminApi'
import Badge from '../ui/Badge'
import { cn } from '@/lib/cn'

const ROUND_ORDER = ['quarterfinal', 'semifinal', 'final']

/**
 * Assigns squads to bracket slots and generates each tie's matches.
 *
 * Generating is always safe to repeat: played matches are never touched, so
 * when a squad picks up a late pair — the reduced-quarterfinal winner getting
 * its Category 1 and 2 pairs for the semifinal — regenerating just fills in
 * the missing lines.
 */
export default function BracketBuilder({ encounters, squads, bracket }) {
  const { send, busy, flash, setFlash } = useAdminApi()

  const resolutionById = Object.fromEntries(bracket.map(b => [b.id, b]))

  return (
    <div>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      {squads.length < 2 && (
        <div className="mb-6 rounded-xl border border-sand-200 bg-sand-50/70 px-4 py-3 text-[13px] text-sand-900 dark:border-sand-400/25 dark:bg-sand-400/10 dark:text-sand-200">
          Crea primero las escuadras en la pestaña «Escuadras».
        </div>
      )}

      <div className="space-y-10">
        {ROUND_ORDER.map(round => {
          const ties = encounters.filter(e => e.round === round)
          if (ties.length === 0) return null

          return (
            <section key={round}>
              <h3 className="mb-4 flex items-center gap-3 border-b border-hairline pb-3 font-display text-2xl text-fg">
                {ROUNDS[round].label.toUpperCase()}
                <Badge tone="neutral" size="xs">{ties.length}</Badge>
              </h3>

              <div className="grid gap-3 lg:grid-cols-2">
                {ties.map(encounter => (
                  <EncounterRow
                    key={encounter.id}
                    encounter={encounter}
                    squads={squads}
                    entry={resolutionById[encounter.id]}
                    send={send}
                    busy={busy}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function EncounterRow({ encounter, squads, entry, send, busy }) {
  const label      = `${ROUNDS[encounter.round].short} ${encounter.position}`
  const categories = categoriesInEncounter(encounter.is_reduced)
  const resolution = entry?.resolution
  const generateKey = `gen-${encounter.id}`

  async function assign(slot, squadId) {
    await send(`/api/bracket/encounters/${encounter.id}`, {
      method: 'PATCH',
      body: { [slot]: squadId || null },
      key: `${encounter.id}-${slot}`,
      okMessage: 'Escuadra asignada',
    })
  }

  async function generate() {
    await send(`/api/bracket/encounters/${encounter.id}`, {
      method: 'POST',
      key: generateKey,
    })
  }

  const bothAssigned = encounter.squad1_id && encounter.squad2_id
  const generated    = entry?.matches?.length ?? 0

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xs">
      <div className="flex flex-wrap items-center gap-2 border-b border-hairline bg-surface-2/50 px-4 py-2.5">
        <span className="font-display text-lg text-fg">{label}</span>
        {encounter.is_reduced && (
          <Badge tone="court" size="xs" title="Solo Categorías 3 y 4">Reducida · 3ª+4ª</Badge>
        )}
        <span className="ml-auto text-[11px] text-fg-subtle">
          {generated}/{categories.length} partidos
        </span>
        {resolution?.isComplete && !resolution.isTied && (
          <Badge tone="accent" size="xs">Resuelta</Badge>
        )}
        {resolution?.isTied && <Badge tone="danger" size="xs">Empate</Badge>}
      </div>

      <div className="space-y-2 p-4">
        {['squad1_id', 'squad2_id'].map((slot, i) => (
          <div key={slot} className="flex items-center gap-2.5">
            <span className="w-4 shrink-0 text-center font-mono text-[11px] text-fg-subtle">
              {i + 1}
            </span>
            <select
              value={encounter[slot] ?? ''}
              onChange={e => assign(slot, e.target.value)}
              disabled={busy === `${encounter.id}-${slot}`}
              aria-label={`Escuadra ${i + 1} de ${label}`}
              className={cn(
                'h-9 min-w-0 flex-1 rounded-lg border bg-surface px-2.5 text-[13px] text-fg',
                'focus:border-accent focus:outline-none disabled:opacity-50',
                encounter[slot] ? 'border-hairline' : 'border-dashed border-hairline-strong text-fg-subtle',
              )}
            >
              <option value="">— Por determinar —</option>
              {squads.map(s => (
                <option
                  key={s.id}
                  value={s.id}
                  disabled={encounter[slot === 'squad1_id' ? 'squad2_id' : 'squad1_id'] === s.id}
                >
                  {s.name} ({(s.squad_members ?? []).length}/4)
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={generate}
            disabled={!bothAssigned || busy === generateKey}
            className="h-9 rounded-lg bg-accent px-3.5 text-xs font-medium text-accent-fg transition-all hover:brightness-110 disabled:opacity-40"
            title={bothAssigned ? undefined : 'Asigna las dos escuadras primero'}
          >
            {busy === generateKey ? 'Generando…' : generated > 0 ? 'Regenerar partidos' : 'Generar partidos'}
          </button>
          <span className="text-[11px] text-fg-subtle">
            Categorías: {categories.map(c => CATEGORY_META[c].short).join(' · ')}
          </span>
        </div>

        {resolution?.isComplete && (
          <p className="border-t border-hairline pt-2.5 text-[11.5px] text-fg-muted">
            {entry.explanation}
          </p>
        )}
      </div>
    </div>
  )
}
