import Image from 'next/image'
import { SPONSORS, SPONSORS_ARE_PLACEHOLDERS } from '@/lib/sponsors'
import { cn } from '@/lib/cn'

/**
 * Sponsor wall.
 *
 * Logos render in greyscale at reduced opacity and come to full colour on
 * hover, which keeps a row of mismatched brand marks visually calm.
 * The grid is evenly spaced at every breakpoint: 2 columns on phones, 3 on
 * tablets, 4 (or 6 for long rosters) on desktop.
 *
 * Sponsors without artwork yet fall back to a typographic placeholder, so the
 * section is already correctly laid out before any PNG is delivered.
 */
export default function Sponsors({ className, title = 'Con el apoyo de', compact = false }) {
  if (SPONSORS.length === 0) return null

  const principal = SPONSORS.filter(s => s.tier === 'principal')
  const standard  = SPONSORS.filter(s => s.tier !== 'principal')

  return (
    <section
      className={cn('border-t border-hairline py-14 md:py-20', className)}
      aria-labelledby="sponsors-heading"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="text-center mb-10">
          <h2
            id="sponsors-heading"
            className="text-[11px] font-medium uppercase tracking-[0.24em] text-fg-subtle"
          >
            {title}
          </h2>
          {SPONSORS_ARE_PLACEHOLDERS && (
            <p className="mt-2 text-xs text-fg-subtle/70">
              Espacios disponibles · escríbenos para patrocinar la próxima edición
            </p>
          )}
        </div>

        {principal.length > 0 && (
          <div className="mb-8 flex flex-wrap justify-center gap-4">
            {principal.map((s, i) => (
              <SponsorTile key={`p-${i}`} sponsor={s} principal />
            ))}
          </div>
        )}

        {standard.length > 0 && (
          <div
            className={cn(
              'grid gap-3 sm:gap-4',
              'grid-cols-2 sm:grid-cols-3',
              standard.length > 4 ? 'lg:grid-cols-6' : 'lg:grid-cols-4',
            )}
          >
            {standard.map((s, i) => (
              <SponsorTile key={`s-${i}`} sponsor={s} compact={compact} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function SponsorTile({ sponsor, principal = false, compact = false }) {
  const { name, logo, url } = sponsor

  const inner = (
    <>
      {logo ? (
        <Image
          src={logo}
          alt={name}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
          className="object-contain p-4"
        />
      ) : (
        <span className="flex flex-col items-center gap-1.5 text-fg-subtle/60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2.5" />
            <path d="m3 15 5-4 4 3 3-2 6 4" />
            <circle cx="9" cy="9" r="1.4" />
          </svg>
          <span className="text-[10px] font-medium uppercase tracking-wider">{name}</span>
        </span>
      )}
    </>
  )

  const classes = cn(
    'group relative flex items-center justify-center overflow-hidden',
    'rounded-2xl border border-hairline bg-surface',
    'transition-all duration-300 ease-out',
    'hover:border-hairline-strong hover:shadow-md hover:-translate-y-0.5',
    // Greyscale by default, full colour on hover.
    logo && 'grayscale opacity-65 hover:grayscale-0 hover:opacity-100',
    principal ? 'h-28 w-56 sm:h-32 sm:w-72' : compact ? 'h-20' : 'h-24 sm:h-28',
  )

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={classes} title={name}>
        {inner}
      </a>
    )
  }
  return <div className={classes} title={name}>{inner}</div>
}
