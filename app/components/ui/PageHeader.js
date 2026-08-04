import { cn } from '@/lib/cn'

/**
 * Consistent page masthead. Every route uses this, which is what makes the
 * site read as one product rather than a stack of separate pages.
 */
export default function PageHeader({ eyebrow, title, description, actions, className, children }) {
  return (
    <header className={cn('relative pt-14 pb-8 md:pt-20 md:pb-10', className)}>
      <div className="animate-fade-up">
        {eyebrow && (
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-accent mb-3">
            {eyebrow}
          </p>
        )}
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-fg">
            {title}
          </h1>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {description && (
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-fg-muted">
            {description}
          </p>
        )}
      </div>
      {children}
    </header>
  )
}

/** Standard page shell: max width, gutters, and room for the sticky navbar. */
export function PageShell({ className, children, width = 'default' }) {
  const widths = {
    narrow:  'max-w-3xl',
    default: 'max-w-5xl',
    wide:    'max-w-7xl',
  }
  return (
    <main className={cn('mx-auto px-5 sm:px-6 pb-24 min-h-screen', widths[width], className)}>
      {children}
    </main>
  )
}
