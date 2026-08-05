import Image from 'next/image'
import { cn } from '@/lib/cn'

const SRC = '/logo_torneo/Logo_torneo.png'
const W = 1997
const H = 1619

/**
 * The official tournament logo, used as supplied — never redrawn.
 *
 * The artwork is the circular badge on its own; the wordmark was taken out so
 * it no longer doubles up with the "TORNEO TENIS URBANOVA" heading in the hero.
 * Two variants remain:
 *
 *   full — the badge with its own margins (hero, footer)
 *   mark — the badge cropped tight to its bounding box, for the navbar, where
 *          the surrounding transparent margin would otherwise waste most of
 *          the 40px available
 *
 * The crop is measured from the artwork rather than eyeballed: the badge spans
 * x 20.0–80.8% and y 17.5–95.9%, centred at (50.4%, 56.7%) and occupying 78.4%
 * of the image height. Scaling the image to 127.6% of the container height
 * therefore makes the badge fill it exactly, and the offsets below recentre it.
 * The vertical offset is large because the source has a wide margin above the
 * badge and almost none below.
 *
 * This artwork carries a real alpha channel (colour type 6, RGBA, fully
 * transparent corners), so it is drawn straight onto the page — no blend mode
 * and no backing plate. An earlier revision needed `mix-blend-multiply` to hide
 * a flattened white background; that is gone, which is what lets the badge sit
 * directly on the sand header.
 *
 * It reads cleanly in both themes without help: the darkest brand colour, the
 * teal at relative luminance 0.30, contrasts 6.3:1 against the dark canvas.
 */
export default function Logo({ variant = 'full', className, priority = false, alt = 'Torneo Tenis Urbanova' }) {
  if (variant === 'mark') {
    return (
      <span className={cn('relative block shrink-0 overflow-hidden', className)}>
        <Image
          src={SRC}
          alt={alt}
          width={W}
          height={H}
          priority={priority}
          className="absolute"
          style={{
            height: '127.6%',
            width: 'auto',
            maxWidth: 'none',
            left: '-29.6%',
            top: '-22.4%',
          }}
        />
      </span>
    )
  }

  return (
    <span className={cn('relative block', className)}>
      <Image
        src={SRC}
        alt={alt}
        width={W}
        height={H}
        priority={priority}
        sizes="(max-width: 640px) 45vw, 320px"
        className="h-auto w-full"
      />
    </span>
  )
}
