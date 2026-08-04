'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/**
 * Invisible client component.
 *
 * Subscribes to Supabase Realtime for the given tables and calls
 * `router.refresh()` on any change, so the server component re-renders with
 * fresh data and React patches only the DOM that actually differs — no full
 * page reload, no lost scroll position.
 *
 *   <RealtimeRefresher tables={['matches', 'sets']} />
 *
 * Note: the dependency list keys off a joined string rather than the array
 * itself. A fresh array literal on every render would tear down and rebuild
 * every channel each time; omitting it entirely (as this previously did) left
 * the effect closing over a stale table list.
 */
export default function RealtimeRefresher({ tables = ['sets'] }) {
  const router = useRouter()
  const key = tables.join(',')
  const list = useMemo(() => key.split(','), [key])

  useEffect(() => {
    const channels = list.map(table =>
      supabase
        .channel(`rt-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          router.refresh()
        })
        .subscribe(),
    )

    return () => { channels.forEach(ch => supabase.removeChannel(ch)) }
  }, [router, list])

  return null
}
