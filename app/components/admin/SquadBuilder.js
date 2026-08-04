'use client'

import { useState } from 'react'
import { LEVELS, CATEGORY_META, qualificationFor } from '@/lib/tournament'
import { useAdminApi, Flash } from './useAdminApi'
import Badge from '../ui/Badge'
import { cn } from '@/lib/cn'

/**
 * Manual squad composition.
 *
 * Squads are built by hand, but the pair pickers are ordered by final group
 * position and annotated with it, so the organisers can follow the seeding
 * without being forced into it. A pair already placed in another squad is
 * shown as taken.
 */
export default function SquadBuilder({ squads, standingsByCategory }) {
  const { send, busy, flash, setFlash } = useAdminApi()
  const [newName, setNewName] = useState('')

  // team_id → squad name, for the "already taken" hint.
  const taken = {}
  for (const squad of squads) {
    for (const m of squad.squad_members ?? []) {
      if (m.teams) taken[m.teams.id] = squad.name
    }
  }

  async function createSquad(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    const r = await send('/api/squads', { body: { name }, key: 'create', okMessage: `Escuadra «${name}» creada` })
    if (r.ok) setNewName('')
  }

  function suggestName() {
    const letter = String.fromCharCode(65 + squads.length) // A, B, C…
    return `Escuadra ${letter}`
  }

  return (
    <div>
      <Flash flash={flash} onDismiss={() => setFlash(null)} />

      <div className="mb-6 rounded-2xl border border-hairline bg-surface-2/50 p-5">
        <p className="text-[13px] font-medium text-fg">Cómo funciona</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-fg-muted">
          Crea ocho escuadras y asigna a cada una una pareja por categoría. Las
          listas están ordenadas por posición final en la fase de grupos. Dos
          escuadras se quedarán sin pareja de Categoría 1 y 2 — son las que
          disputan la eliminatoria reducida de cuartos y recibirán esas parejas
          al llegar a semifinales.
        </p>
      </div>

      <form onSubmit={createSquad} className="mb-6 flex flex-wrap gap-2">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder={suggestName()}
          maxLength={60}
          aria-label="Nombre de la escuadra"
          className="h-10 flex-1 min-w-50 rounded-xl border border-hairline bg-surface px-3.5 text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy === 'create' || !newName.trim()}
          className="h-10 rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg transition-all hover:brightness-110 disabled:opacity-40"
        >
          {busy === 'create' ? 'Creando…' : 'Crear escuadra'}
        </button>
        <button
          type="button"
          onClick={() => setNewName(suggestName())}
          className="h-10 rounded-xl border border-hairline px-3 text-xs text-fg-muted transition-colors hover:bg-surface-2"
        >
          Sugerir nombre
        </button>
      </form>

      {squads.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hairline-strong px-4 py-12 text-center text-sm text-fg-subtle">
          Todavía no hay escuadras. Crea la primera arriba.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {squads.map(squad => (
            <SquadCard
              key={squad.id}
              squad={squad}
              standingsByCategory={standingsByCategory}
              taken={taken}
              send={send}
              busy={busy}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SquadCard({ squad, standingsByCategory, taken, send, busy }) {
  const members = {}
  for (const m of squad.squad_members ?? []) {
    if (m.teams) members[m.category] = m.teams
  }
  const filled = Object.keys(members).length

  async function setMember(category, teamId) {
    if (!teamId) {
      await send(`/api/squads/${squad.id}/members?category=${category}`, {
        method: 'DELETE',
        key: `${squad.id}-${category}`,
        okMessage: 'Pareja retirada',
      })
      return
    }
    await send(`/api/squads/${squad.id}/members`, {
      method: 'PUT',
      body: { team_id: teamId, category },
      key: `${squad.id}-${category}`,
      okMessage: 'Pareja asignada',
    })
  }

  async function remove() {
    if (!confirm(`¿Eliminar «${squad.name}»? Se borrarán sus partidos no jugados.`)) return
    await send(`/api/squads/${squad.id}`, {
      method: 'DELETE',
      key: `del-${squad.id}`,
      okMessage: 'Escuadra eliminada',
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xs">
      <div className="flex items-center gap-3 border-b border-hairline bg-surface-2/50 px-4 py-3">
        <p className="mr-auto truncate font-display text-xl text-fg">{squad.name}</p>
        <Badge tone={filled === 4 ? 'accent' : filled === 2 ? 'court' : 'neutral'} size="xs">
          {filled}/4
        </Badge>
        <button
          onClick={remove}
          disabled={busy === `del-${squad.id}`}
          className="rounded-lg px-2 py-1 text-[11px] text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-500/10"
        >
          Eliminar
        </button>
      </div>

      <div className="divide-y divide-hairline">
        {LEVELS.map(category => {
          const current   = members[category]
          const standings = standingsByCategory[category] ?? []
          const key       = `${squad.id}-${category}`

          return (
            <div key={category} className="flex items-center gap-3 px-4 py-3">
              <span
                className="w-8 shrink-0 font-display text-base text-fg-subtle"
                title={CATEGORY_META[category].name}
              >
                {CATEGORY_META[category].short}
              </span>

              <select
                value={current?.id ?? ''}
                onChange={e => setMember(category, e.target.value)}
                disabled={busy === key}
                aria-label={`Pareja de ${CATEGORY_META[category].name}`}
                className={cn(
                  'h-9 min-w-0 flex-1 rounded-lg border bg-surface px-2.5 text-[13px] text-fg',
                  'focus:border-accent focus:outline-none disabled:opacity-50',
                  current ? 'border-hairline' : 'border-dashed border-hairline-strong text-fg-subtle',
                )}
              >
                <option value="">— Sin asignar —</option>
                {standings.map(row => {
                  const owner = taken[row.team_id]
                  const mine  = current?.id === row.team_id
                  const q     = qualificationFor(category, row.rank)
                  return (
                    <option key={row.team_id} value={row.team_id} disabled={!!owner && !mine}>
                      {row.rank}. {row.team_name}
                      {q === 'semifinal' ? ' · pasa a semis' : q === 'eliminated' ? ' · eliminada' : ''}
                      {owner && !mine ? ` — ya en ${owner}` : ''}
                    </option>
                  )
                })}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
