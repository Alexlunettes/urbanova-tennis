'use client'

import { useState, useEffect } from 'react'

/** First serve: Thursday 6 August, 17:15 on Pista 1. */
const TOURNAMENT_START = new Date('2026-08-06T17:15:00+02:00')

const pad = n => String(n).padStart(2, '0')

export default function Countdown() {
  const [left, setLeft] = useState(null)

  useEffect(() => {
    function tick() {
      const diff = TOURNAMENT_START - new Date()
      setLeft(
        diff <= 0
          ? { done: true }
          : {
              days:    Math.floor(diff / 86_400_000),
              hours:   Math.floor(diff / 3_600_000) % 24,
              minutes: Math.floor(diff / 60_000)    % 60,
              seconds: Math.floor(diff / 1_000)     % 60,
            },
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Reserve the final height so the hero does not shift when the clock appears
  // after hydration.
  if (!left) return <div className="h-26 md:h-31" aria-hidden="true" />

  if (left.done) {
    return (
      <div className="flex h-26 items-center justify-center md:h-31">
        <span className="inline-flex items-center gap-2.5 rounded-full border border-court-500/30 bg-court-500/10 px-5 py-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-court-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-court-500" />
          </span>
          <span className="font-display text-2xl tracking-wide text-court-700 dark:text-court-300">
            EL TORNEO ESTÁ EN JUEGO
          </span>
        </span>
      </div>
    )
  }

  const units = [
    { v: left.days,    l: 'días'  },
    { v: left.hours,   l: 'horas' },
    { v: left.minutes, l: 'min'   },
    { v: left.seconds, l: 'seg'   },
  ]

  return (
    <div className="flex items-start justify-center gap-2 md:gap-3" role="timer" aria-label="Cuenta atrás para el inicio del torneo">
      {units.map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center">
          <div className="flex h-16 min-w-16 items-center justify-center rounded-2xl border border-hairline bg-surface px-3 shadow-sm md:h-20 md:min-w-20 md:px-4">
            <span className="tabular font-mono text-3xl font-medium text-fg md:text-4xl">
              {pad(v)}
            </span>
          </div>
          <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-fg-subtle md:text-[11px]">
            {l}
          </span>
        </div>
      ))}
    </div>
  )
}
