import { cn } from '@/lib/cn'

/**
 * Section divider shaped like a shoreline.
 *
 * Two offset crests rather than one, which reads as water rather than as a
 * decorative blob. `flip` points it upward for the top edge of a section.
 * Purely decorative — hidden from assistive tech.
 */
export default function Wave({ className, flip = false, tone = 'surface' }) {
  const fill = {
    surface:  'fill-surface',
    canvas:   'fill-canvas',
    surface2: 'fill-surface-2',
  }[tone] ?? 'fill-surface'

  return (
    <div
      className={cn('pointer-events-none w-full overflow-hidden leading-none', flip && 'rotate-180', className)}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className="block h-10 w-full sm:h-14"
      >
        <path
          className={cn(fill, 'opacity-40')}
          d="M0 42c120 22 240 30 360 22s240-32 360-32 240 24 360 32 240 0 360-22v90H0Z"
        />
        <path
          className={fill}
          d="M0 60c140 18 260 22 380 12s250-30 360-30 230 22 350 30 230 4 350-14v32H0Z"
        />
      </svg>
    </div>
  )
}

/** A thin ripple rule, for places where a full wave would be too much. */
export function Ripple({ className }) {
  return (
    <svg
      viewBox="0 0 240 12"
      preserveAspectRatio="none"
      className={cn('h-3 w-full text-hairline-strong', className)}
      aria-hidden="true"
    >
      <path
        d="M0 6q15-6 30 0t30 0 30 0 30 0 30 0 30 0 30 0 30 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
