'use client'

import { useState, useEffect } from 'react'

const TOURNAMENT_START = new Date('2026-08-06T09:00:00+02:00')

function pad(n) { return String(n).padStart(2, '0') }

export default function Countdown() {
  const [left, setLeft] = useState(null)

  useEffect(() => {
    function tick() {
      const diff = TOURNAMENT_START - new Date()
      if (diff <= 0) {
        setLeft({ done: true })
      } else {
        setLeft({
          days:    Math.floor(diff / 86_400_000),
          hours:   Math.floor(diff / 3_600_000) % 24,
          minutes: Math.floor(diff / 60_000)    % 60,
          seconds: Math.floor(diff / 1_000)     % 60,
        })
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!left) return null  // Don't render during server-side pass

  if (left.done) {
    return (
      <p className="font-bebas text-3xl text-gold tracking-[0.2em]">
        ¡EL TORNEO HA COMENZADO!
      </p>
    )
  }

  const units = [
    { v: pad(left.days),    l: 'DÍAS'  },
    { v: pad(left.hours),   l: 'HORAS' },
    { v: pad(left.minutes), l: 'MIN'   },
    { v: pad(left.seconds), l: 'SEG'   },
  ]

  return (
    <div className="flex items-end gap-1 md:gap-3">
      {units.map(({ v, l }, i) => (
        <div key={l} className="flex items-end gap-1 md:gap-3">
          {i > 0 && (
            <span className="font-bebas text-4xl md:text-6xl text-cream/40 mb-5 select-none">:</span>
          )}
          <div className="text-center">
            <div className="bg-forest/30 border border-cream/10 rounded-lg px-3 py-2 min-w-15 md:min-w-20">
              <span className="font-bebas text-5xl md:text-7xl text-cream leading-none tabular-nums">
                {v}
              </span>
            </div>
            <span className="font-lato text-[9px] md:text-[10px] text-cream/50 tracking-[0.25em] mt-1.5 block uppercase">
              {l}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}