'use client'

import { useState } from 'react'
import ScoreEntry from './ScoreEntry'
import KnockoutManager from './KnockoutManager'
import { cn } from '@/lib/cn'

const TABS = [
  { key: 'scores',   label: 'Resultados' },
  { key: 'knockout', label: 'Eliminatorias' },
]

export default function AdminShell({ matches, divisions, squads, bracket, counts }) {
  const [tab, setTab] = useState('scores')

  const badge = { scores: counts.pending, knockout: counts.resolvedTies }

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

      {tab === 'scores'   && <ScoreEntry matches={matches} />}
      {tab === 'knockout' && (
        <KnockoutManager divisions={divisions} squads={squads} bracket={bracket} />
      )}
    </div>
  )
}
