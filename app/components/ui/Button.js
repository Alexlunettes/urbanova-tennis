import Link from 'next/link'
import { cn } from '@/lib/cn'

const VARIANTS = {
  primary:
    'bg-accent text-accent-fg shadow-sm hover:shadow-md hover:brightness-110 active:brightness-95',
  secondary:
    'bg-surface text-fg border border-hairline-strong shadow-xs hover:bg-surface-2 hover:border-fg-subtle',
  ghost:
    'text-fg-muted hover:text-fg hover:bg-surface-2',
  sand:
    'bg-sand-400 text-sand-950 shadow-sm hover:shadow-md hover:brightness-105 active:brightness-95',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
  outline:
    'border border-hairline-strong text-fg hover:bg-surface-2 hover:border-accent',
}

const SIZES = {
  sm: 'h-8  px-3   text-xs  gap-1.5 rounded-lg',
  md: 'h-10 px-4.5 text-sm  gap-2   rounded-xl',
  lg: 'h-12 px-6   text-sm  gap-2.5 rounded-xl',
}

/**
 * The single button in the app. Renders an <a> when `href` is set, otherwise
 * a <button>. Has no hooks, so it works inside both server and client trees.
 */
export default function Button({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  external = false,
  ...props
}) {
  const classes = cn(
    'inline-flex items-center justify-center font-medium tracking-tight',
    'transition-all duration-200 ease-out',
    'disabled:opacity-40 disabled:pointer-events-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    className,
  )

  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...props}>
          {children}
        </a>
      )
    }
    return <Link href={href} className={classes} {...props}>{children}</Link>
  }

  return <button className={classes} {...props}>{children}</button>
}
