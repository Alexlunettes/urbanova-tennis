import Image from 'next/image'
import { SPONSORS, SPONSORS_ARE_PLACEHOLDERS } from '@/lib/sponsors'
import { cn } from '@/lib/cn'

/**
 * Sponsor wall.
 *
 * The artwork is already black and white, so the logos are shown at full
 * opacity and stay legible everywhere — no greyscale filter waiting on a hover
 * that never arrives on a phone. Desktop still gets a small lift and a faint
 * ring on hover, which is decoration rather than a legibility mechanism.
 *
 * Two tiers: the principal sponsors sit alone in a larger row above the
 * collaborators, which are all identically sized and centred.
 */
export default function Sponsors({ className, title = 'Con el apoyo de' }) {
  if (SPONSORS.length === 0) return null

  const principal = SPONSORS.filter(s => s.tier === 'principal')
  const standard  = SPONSORS.filter(s => s.tier !== 'principal')

  return (
    <section
      className={cn('border-t border-hairline bg-sand-wash py-14 md:py-20', className)}
      aria-labelledby="sponsors-heading"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="mb-9 text-center">
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
          <>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {principal.map(s => (
                <SponsorTile key={s.name} sponsor={s} principal />
              ))}
            </div>
            {standard.length > 0 && (
              <div className="mx-auto my-8 flex max-w-xs items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-hairline" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle/70">
                  Colaboradores
                </span>
                <span className="h-px flex-1 bg-hairline" />
              </div>
            )}
          </>
        )}

        {standard.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {standard.map(s => (
              <SponsorTile key={s.name} sponsor={s} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function SponsorTile({ sponsor, principal = false }) {
  const { name, logo, url } = sponsor

  const inner = logo ? (
    <Image
      src={logo}
      alt={name}
      fill
      sizes={principal ? '(max-width: 640px) 80vw, 320px' : '(max-width: 640px) 42vw, 190px'}
      className={cn('object-contain', principal ? 'p-5 sm:p-6' : 'p-4')}
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
  )

  const classes = cn(
    'group relative flex items-center justify-center overflow-hidden rounded-2xl',
    'border border-hairline bg-surface shadow-xs',
    'transition-all duration-300 ease-out',
    // Hover is a flourish, not a way to make the logo readable.
    'hover:-translate-y-0.5 hover:border-hairline-strong hover:shadow-md',
    principal
      ? 'h-28 w-full sm:h-32 sm:w-72'
      : 'h-22 w-[calc(50%-0.375rem)] sm:h-24 sm:w-[calc(33.333%-0.667rem)] lg:w-44',
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
