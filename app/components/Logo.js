import { cn } from '@/lib/cn'

/**
 * The tournament emblem, redrawn as vector art so it stays crisp from the
 * 36px navbar mark up to the hero.
 *
 * Faithful to the printed badge: sage sky and sea over an orange clay half and
 * a teal hard-court half seen in perspective, palms either side, and the
 * cream disc with crossed rackets. `variant="mark"` drops the palms, the waves
 * and the arc of text, which turn to mud below about 48px.
 */
export default function Logo({ variant = 'full', className, title = 'Torneo Tenis Urbanova' }) {
  const isMark = variant === 'mark'

  return (
    <svg
      viewBox="0 0 200 200"
      className={cn('shrink-0', className)}
      role="img"
      aria-label={title}
    >
      <defs>
        <clipPath id="urb-disc">
          <circle cx="100" cy="100" r="86" />
        </clipPath>
        <linearGradient id="urb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#b9d3c1" />
          <stop offset="100%" stopColor="#a3c2ac" />
        </linearGradient>
        <linearGradient id="urb-clay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#e9a049" />
          <stop offset="100%" stopColor="#dd8a2f" />
        </linearGradient>
        <linearGradient id="urb-hard" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2b8d96" />
          <stop offset="100%" stopColor="#1f6f78" />
        </linearGradient>
      </defs>

      <g clipPath="url(#urb-disc)">
        {/* sky and sea */}
        <rect x="0" y="0" width="200" height="104" fill="url(#urb-sky)" />
        {/* clay surround */}
        <rect x="0" y="98" width="200" height="102" fill="url(#urb-clay)" />

        {!isMark && (
          <g stroke="#fdfaf0" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9">
            <path d="M22 92q7-5 14 0t14 0" />
            <path d="M58 88q7-5 14 0t14 0" />
            <path d="M116 88q7-5 14 0t14 0" />
            <path d="M152 92q7-5 14 0t14 0" />
          </g>
        )}

        {/* the court, in perspective: clay far half, teal near half */}
        <path d="M72 104 L128 104 L176 186 L24 186 Z" fill="url(#urb-clay)" />
        <path d="M60 138 L140 138 L176 186 L24 186 Z" fill="url(#urb-hard)" />

        {/* court lines */}
        <g stroke="#fdfaf0" strokeWidth="2.4" fill="none" strokeLinejoin="round">
          <path d="M72 104 L128 104 L176 186 L24 186 Z" />
          <path d="M60 138 L140 138" />
          <path d="M100 138 L100 186" />
          <path d="M84 121 L116 121" />
          <path d="M78.5 113 L121.5 113" />
        </g>

        {!isMark && <Palms />}
      </g>

      {/* outer ring */}
      <circle cx="100" cy="100" r="86" fill="none" stroke="#dd8a2f" strokeWidth="7" />
      <circle cx="100" cy="100" r="81" fill="none" stroke="#1f6f78" strokeWidth="2.5" opacity="0.55" />

      {/* ball disc with crossed rackets */}
      <circle cx="100" cy="58" r="30" fill="#fdf6e3" />
      <g stroke="#dd8a2f" strokeWidth="3.1" fill="none" strokeLinecap="round">
        <ellipse cx="88"  cy="52" rx="11" ry="15" transform="rotate(-33 88 52)" />
        <ellipse cx="112" cy="52" rx="11" ry="15" transform="rotate(33 112 52)" />
        <path d="M94 66 L86 82" />
        <path d="M106 66 L114 82" />
      </g>
      <circle cx="100" cy="40" r="6.2" fill="#fdf6e3" stroke="#c9962f" strokeWidth="1.3" />
      <path d="M96.4 35.6q3.6 4.4 0 8.8M103.6 35.6q-3.6 4.4 0 8.8" stroke="#c9962f" strokeWidth="1.1" fill="none" />
    </svg>
  )
}

/** Four fronds either side, echoing the palms flanking the printed badge. */
function Palms() {
  const frond = 'M0 0q-16-11-30-6 12-9 30 0M0 0q-18-4-27 7 5-14 27-7M0 0q-13-13-29-12 10-6 29 12M0 0q-8-16-2-28 8 12 2 28'
  return (
    <g fill="#1f6f78">
      <g transform="translate(34 86)">
        <path d={frond} />
        <path d="M-2 0q3 24 -1 44h5q-2-22 1-44z" />
      </g>
      <g transform="translate(166 86) scale(-1 1)">
        <path d={frond} />
        <path d="M-2 0q3 24 -1 44h5q-2-22 1-44z" />
      </g>
    </g>
  )
}
