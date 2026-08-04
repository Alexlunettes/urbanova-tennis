import Link from 'next/link'
import { LEVELS, CATEGORY_META, CATEGORY_RULES } from '@/lib/tournament'
import { cn } from '@/lib/cn'

/**
 * Category selector used by /grupos, /partidos and /estadisticas.
 *
 * Link-based rather than stateful, so each category is a real URL that can be
 * shared and that the server renders directly.
 */
export default function CategoryTabs({ basePath, active, showCounts = true }) {
  return (
    <div className="-mx-5 sm:mx-0 px-5 sm:px-0 overflow-x-auto no-scrollbar">
      <div
        role="tablist"
        aria-label="Categorías"
        className="inline-flex gap-1 p-1 rounded-2xl bg-surface-2 border border-hairline min-w-max"
      >
        {LEVELS.map(level => {
          const isActive = level === active
          return (
            <Link
              key={level}
              href={`${basePath}?cat=${level}`}
              role="tab"
              aria-selected={isActive}
              scroll={false}
              className={cn(
                'group relative flex items-center gap-2 rounded-xl px-4 py-2.5',
                'text-sm font-medium transition-all duration-200 ease-out whitespace-nowrap',
                isActive
                  ? 'bg-surface text-fg shadow-sm'
                  : 'text-fg-muted hover:text-fg hover:bg-surface/60',
              )}
            >
              <span
                className={cn(
                  'font-display text-base leading-none transition-colors',
                  isActive ? 'text-accent' : 'text-fg-subtle group-hover:text-fg-muted',
                )}
              >
                {CATEGORY_META[level].short}
              </span>
              <span>{CATEGORY_META[level].name}</span>
              {showCounts && (
                <span
                  className={cn(
                    'tabular text-[11px] rounded-md px-1.5 py-0.5 transition-colors',
                    isActive ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-fg-subtle',
                  )}
                >
                  {CATEGORY_RULES[level].teams}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/** Parses ?cat= / ?nivel= into a valid category, defaulting to 1. */
export function parseCategory(params) {
  const raw = Number(params?.cat ?? params?.nivel)
  return LEVELS.includes(raw) ? raw : 1
}
