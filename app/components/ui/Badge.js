import { cn } from '@/lib/cn'

const TONES = {
  neutral: 'bg-surface-2 text-fg-muted border-hairline',
  accent:  'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/12 dark:text-brand-300 dark:border-brand-500/25',
  sand:    'bg-sand-50 text-sand-800 border-sand-200 dark:bg-sand-400/12 dark:text-sand-300 dark:border-sand-400/25',
  court:   'bg-court-50 text-court-700 border-court-200 dark:bg-court-400/12 dark:text-court-300 dark:border-court-400/25',
  danger:  'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/12 dark:text-red-300 dark:border-red-500/25',
  live:    'bg-court-500 text-white border-court-600',
}

const SIZES = {
  xs: 'h-5 px-1.5 text-[10px] gap-1',
  sm: 'h-6 px-2   text-[11px] gap-1',
  md: 'h-7 px-2.5 text-xs     gap-1.5',
}

export default function Badge({ tone = 'neutral', size = 'sm', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        'uppercase tracking-wider whitespace-nowrap',
        TONES[tone] ?? TONES.neutral,
        SIZES[size] ?? SIZES.sm,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

/** A small pulsing dot for anything happening right now. */
export function LiveDot({ className }) {
  return (
    <span className={cn('relative flex h-1.5 w-1.5', className)}>
      <span className="absolute inline-flex h-full w-full rounded-full bg-court-400 opacity-75 animate-ping" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-court-500" />
    </span>
  )
}
