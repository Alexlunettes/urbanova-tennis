'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { FEEDBACK, FEEDBACK_FORM_URL } from '@/lib/feedback'
import { cn } from '@/lib/cn'

/**
 * A small feedback invitation that follows the visitor around the site.
 *
 * Most people arriving from the announcement will land straight on the gallery
 * and never see the homepage, so the hero call-to-action alone would miss them.
 *
 * Deliberate choices:
 *
 *  · BOTTOM right, not top. The header is sticky and the top-right corner is
 *    where the theme toggle and the mobile menu button live — a card there
 *    would sit on top of the navigation, which is the one place it must not be.
 *  · It waits a few seconds. Appearing on load reads as an ad; appearing once
 *    someone has started looking reads as an invitation.
 *  · Dismissal is remembered in sessionStorage, so it stays gone while the
 *    visitor browses but is not a permanent opt-out on the next visit.
 *  · Never on /admin — the organisers are not the audience for this.
 *
 * It sits at z-50, below the gallery lightbox (z-100), so opening a photo
 * covers it rather than fighting with it.
 */

const DISMISSED_KEY = 'feedback_prompt_dismissed'
const APPEAR_AFTER  = 6000

export default function FeedbackPrompt() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  const hidden = pathname?.startsWith('/admin') ?? false

  useEffect(() => {
    if (hidden) return

    let dismissed = false
    try {
      dismissed = sessionStorage.getItem(DISMISSED_KEY) === '1'
    } catch {
      /* private mode — just show it */
    }
    if (dismissed) return

    const id = setTimeout(() => setVisible(true), APPEAR_AFTER)
    return () => clearTimeout(id)
  }, [hidden])

  function dismiss() {
    setVisible(false)
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      /* nothing to do — it will reappear next navigation, which is acceptable */
    }
  }

  if (hidden || !visible) return null

  return (
    <div
      role="complementary"
      aria-label="Petición de opinión"
      className={cn(
        'fixed z-50 animate-fade-up',
        // Full width on a phone, a card on desktop. `inset-x-4` keeps it clear
        // of the screen edges without ever exceeding the viewport.
        'inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-88',
      )}
    >
      <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface p-4 pr-10 shadow-lg ring-1 ring-ink-950/5 dark:ring-white/5">
        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 21l1.9-4.1A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="font-display text-base leading-tight text-fg">
              {FEEDBACK.title.toUpperCase()}
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-fg-muted">
              {FEEDBACK.short}
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-accent-fg transition-all hover:brightness-110"
          >
            {FEEDBACK.cta}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </a>
          <button
            onClick={dismiss}
            className="h-9 shrink-0 rounded-lg px-3 text-xs text-fg-subtle transition-colors hover:text-fg"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  )
}
