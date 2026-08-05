import Image from 'next/image'
import { cn } from '@/lib/cn'

const SRC = '/logo_torneo/logo_torneo_urbanova.jpeg'
const W = 655
const H = 686

/**
 * The official tournament logo, used as supplied — never redrawn.
 *
 * The file is a JPEG on a white field containing the circular badge above the
 * "torneo tenis urbanova" wordmark. Two variants:
 *
 *   full — the whole logo, wordmark included (hero, footer)
 *   mark — the badge only, for the navbar, where the wordmark would be
 *          illegible at 40px and is anyway repeated as text beside it
 *
 * The crop is derived from the artwork rather than eyeballed: the badge sits
 * at x 19.9–80.6% and y 13.5–76.0%, centred at (50.3%, 44.8%). Scaling the
 * image to 160% of the container height makes the badge exactly fill it, and
 * the offsets below recentre it.
 *
 * Because the source has a white background, the image is multiplied into the
 * page in light mode so the white disappears against the sand canvas, and sits
 * on a white plate in dark mode so it stays legible instead of glaring.
 */
export default function Logo({ variant = 'full', className, priority = false, alt = 'Torneo Tenis Urbanova' }) {
  if (variant === 'mark') {
    return (
      <span
        className={cn(
          'relative block shrink-0 overflow-hidden rounded-xl',
          'dark:bg-white dark:ring-1 dark:ring-white/10',
          className,
        )}
      >
        <Image
          src={SRC}
          alt={alt}
          width={W}
          height={H}
          priority={priority}
          className="absolute mix-blend-multiply"
          style={{
            height: '160%',
            width: 'auto',
            maxWidth: 'none',
            left: '-26.9%',
            top: '-21.7%',
          }}
        />
      </span>
    )
  }

  return (
    <span
      className={cn(
        'relative block',
        'dark:rounded-2xl dark:bg-white dark:p-3 dark:ring-1 dark:ring-white/10',
        className,
      )}
    >
      <Image
        src={SRC}
        alt={alt}
        width={W}
        height={H}
        priority={priority}
        sizes="(max-width: 640px) 45vw, 320px"
        className="h-auto w-full mix-blend-multiply"
      />
    </span>
  )
}
