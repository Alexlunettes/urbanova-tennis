'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Reports a page view on every route change.
 *
 * Uses `sendBeacon` where available so the request survives the visitor
 * navigating away, and falls back to a keepalive fetch. Failures are ignored
 * on purpose — analytics must never be able to break a page.
 */
export default function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    const body = JSON.stringify({ path: pathname })
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/track', new Blob([body], { type: 'application/json' }))
      } else {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {})
      }
    } catch { /* ignore */ }
  }, [pathname])

  return null
}
