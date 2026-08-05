import Image from 'next/image'
import { cn } from '@/lib/cn'

const SRC = '/logo_torneo/Logo_torneo.png'
const W = 488
const H = 511

/**
 * The official tournament logo, used as supplied — never redrawn.
 *
 * The file holds the circular badge above the "torneo tenis urbanova"
 * wordmark. Two variants:
 *
 *   full — the whole logo, wordmark included (hero, footer)
 *   mark — the badge only, for the navbar, where the wordmark would be
 *          illegible at 40px and is anyway repeated as text beside it
 *
 * The crop is measured from the artwork rather than eyeballed: the badge sits
 * at x 20.1–80.9% and y 13.7–76.1%, centred at (50.5%, 44.9%) and occupying
 * 62.4% of the image height. Scaling the image to 160% of the container height
 * therefore makes the badge fill it exactly, and the offsets below recentre it.
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
            height: '160.2%',
            width: 'auto',
            maxWidth: 'none',
            left: '-27.3%',
            top: '-21.9%',
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
