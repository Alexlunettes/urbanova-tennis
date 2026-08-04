'use client'

import { useState } from 'react'
import ScoreEntry from './ScoreEntry'
import SquadBuilder from './SquadBuilder'
import BracketBuilder from './BracketBuilder'
import { cn } from '@/lib/cn'

const TABS = [
  { key: 'scores',  label: 'Resultados' },
  { key: 'squads',  label: 'Escuadras'  },
  { key: 'bracket', label: 'Cuadro'     },
]

export default function AdminShell({
  groupMatches,
  knockoutMatches,
  squads,
  encounters,
  bracket,
  standingsByCategory,
  counts,
}) {
  const [tab, setTab] = useState('scores')

  const badge = {
    scores:  counts.pending,
    squads:  squads.length,
    bracket: counts.resolvedTies,
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-1 rounded-2xl border border-hairline bg-surface-2 p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
              tab === t.key ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
            )}
          >
            {t.label}
            {badge[t.key] > 0 && (
              <span
                className={cn(
                  'tabular rounded-md px-1.5 py-0.5 font-mono text-[10px]',
                  tab === t.key ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-fg-subtle',
                )}
              >
                {badge[t.key]}
              </span>
            )}
          </button>
        ))}

        <button
          onClick={async () => {
            await fetch('/api/admin-login', { method: 'DELETE' })
            window.location.href = '/'
          }}
          className="ml-auto rounded-xl px-3.5 py-2.5 text-xs text-fg-subtle transition-colors hover:text-fg"
        >
          Cerrar sesión
        </button>
      </div>

      {tab === 'scores' && (
        <ScoreEntry matches={[...knockoutMatches, ...groupMatches]} />
      )}
      {tab === 'squads' && (
        <SquadBuilder squads={squads} standingsByCategory={standingsByCategory} />
      )}
      {tab === 'bracket' && (
        <BracketBuilder encounters={encounters} squads={squads} bracket={bracket} />
      )}
    </div>
  )
}
