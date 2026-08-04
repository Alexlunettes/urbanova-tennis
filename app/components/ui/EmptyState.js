import { cn } from '@/lib/cn'

/**
 * Shown wherever data has not arrived yet. The tournament spends weeks in this
 * state before it starts, so these are designed to look intentional rather
 * than broken.
 */
export default function EmptyState({ icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-dashed border-hairline-strong',
        'bg-surface-2/50 px-6 py-16 text-center',
        className,
      )}
    >
      <div className="absolute inset-0 bg-court-grid opacity-40 pointer-events-none" />
      <div className="relative animate-fade-in">
        {icon && (
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-surface border border-hairline text-fg-subtle shadow-xs">
            {icon}
          </div>
        )}
        <p className="font-display text-2xl text-fg-muted">{title}</p>
        {description && (
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-fg-subtle">
            {description}
          </p>
        )}
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  )
}
