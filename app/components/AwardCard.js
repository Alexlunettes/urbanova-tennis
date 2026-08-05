import Badge from './ui/Badge'
import { cn } from '@/lib/cn'

/**
 * A single trophy. Deliberately reads as an award plaque rather than a data
 * row: the medal, the award name, and then the winner — or a clear "por
 * decidir" state, since most of these will be empty until the last Sunday.
 */
export default function AwardCard({ type, award, live, className, ...props }) {
  const decided = Boolean(award?.winner) || Boolean(live?.winner)
  const winner  = award?.winner ?? live?.winner ?? null
  const support = award?.players?.join(' · ') ?? live?.support ?? null
  const note    = award?.note ?? live?.note ?? null

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300',
        decided
          ? 'border-hairline-strong bg-surface shadow-sm hover:shadow-md'
          : 'border-dashed border-hairline-strong bg-surface-2/40',
        className,
      )}
      {...props}
    >
      {decided && (
        <span
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[0.07] blur-2xl"
          style={{ background: 'currentColor' }}
          aria-hidden="true"
        />
      )}

      <div className="flex items-start gap-3.5">
        <Medal icon={type.icon} tone={type.tone} decided={decided} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl text-fg">{type.label.toUpperCase()}</h3>
            {type.byPublicVote && (
              <Badge tone="neutral" size="xs">Voto del público</Badge>
            )}
          </div>
          <p className="mt-1 text-[11.5px] leading-relaxed text-fg-subtle">{type.blurb}</p>

          <div className="mt-3.5 border-t border-hairline pt-3">
            {decided ? (
              <>
                <p className="truncate text-[15px] font-medium text-fg">{winner}</p>
                {support && (
                  <p className="mt-0.5 truncate text-[11.5px] text-fg-muted">{support}</p>
                )}
                {note && (
                  <p className="mt-1.5 text-[12px] italic leading-relaxed text-fg-muted">{note}</p>
                )}
              </>
            ) : (
              <p className="text-[13px] italic text-fg-subtle">Por decidir</p>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

const TONE_CLASSES = {
  sand:    'bg-sand-50 text-sand-700 ring-sand-200 dark:bg-sand-400/12 dark:text-sand-300 dark:ring-sand-400/25',
  accent:  'bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/12 dark:text-brand-300 dark:ring-brand-500/25',
  court:   'bg-court-50 text-court-700 ring-court-200 dark:bg-court-400/12 dark:text-court-300 dark:ring-court-400/25',
  neutral: 'bg-surface-2 text-fg-muted ring-hairline',
}

function Medal({ icon, tone, decided }) {
  return (
    <span
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-300',
        decided ? 'group-hover:scale-105' : 'opacity-50',
        TONE_CLASSES[tone] ?? TONE_CLASSES.neutral,
      )}
      aria-hidden="true"
    >
      <AwardIcon name={icon} />
    </span>
  )
}

function AwardIcon({ name }) {
  const common = {
    width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
  }
  if (name === 'trophy') {
    return (
      <svg {...common}>
        <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
        <path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 4M17 6h2.5a2.5 2.5 0 0 1-2.5 4M9 20h6M12 14v6" />
      </svg>
    )
  }
  if (name === 'star') {
    return (
      <svg {...common}>
        <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9Z" />
      </svg>
    )
  }
  if (name === 'racket') {
    return (
      <svg {...common}>
        <ellipse cx="10" cy="9" rx="6" ry="7" transform="rotate(-38 10 9)" />
        <path d="M14 14.5 20 21" />
        <path d="M6.2 5.6 13.8 12.4M13 4.4 7.4 13.2" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      <circle cx="12" cy="12" r="3.4" />
    </svg>
  )
}
