import { cn } from '@/lib/cn'

/**
 * The surface primitive. Everything boxed on the site is a Card, so elevation
 * and radius stay consistent across standings, fixtures, brackets and admin.
 *
 * `interactive` adds the lift-on-hover treatment — only use it when the whole
 * card is genuinely clickable.
 */
export default function Card({
  as: Tag = 'div',
  interactive = false,
  accent = false,
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(
        'bg-surface border border-hairline rounded-2xl',
        'transition-all duration-300 ease-out',
        interactive && 'hover:-translate-y-0.5 hover:shadow-lg hover:border-hairline-strong cursor-pointer',
        !interactive && 'shadow-xs',
        accent && 'ring-1 ring-accent/25 border-accent/30',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 py-4 border-b border-hairline', className)}>
      <div className="min-w-0">
        <h3 className="font-display text-xl text-fg">{title}</h3>
        {subtitle && <p className="text-xs text-fg-subtle mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
