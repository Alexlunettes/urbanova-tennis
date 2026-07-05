'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase }  from '@/lib/supabase'

/**
 * Invisible Client Component.
 * Watches one or more Supabase tables for any change (INSERT, UPDATE, DELETE).
 * On any change, calls router.refresh() which re-runs the nearest Server Component
 * and re-fetches its data — patching only the changed DOM nodes, no full reload.
 *
 * Usage: <RealtimeRefresher tables={['matches', 'sets']} />
 */
export default function RealtimeRefresher({ tables = ['sets'] }) {
  const router = useRouter()

  useEffect(() => {
    const channels = tables.map((table, i) =>
      supabase
        .channel(`rt-${table}-${i}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          router.refresh()
        })
        .subscribe()
    )

    return () => channels.forEach(ch => supabase.removeChannel(ch))
  }, [router])

  return null
}