/**
 * lib/analytics-queries.js
 *
 * Aggregations behind the admin analytics tab.
 *
 * The volumes here are tiny — a club tournament over four days — so the whole
 * window is pulled once and reduced in JS. That keeps everything in one place
 * and avoids adding database functions for what is a few thousand rows at
 * most. If this ever outgrew that, the reductions below map cleanly onto SQL
 * `group by`s.
 */

import { supabaseAdmin } from './supabase-admin'

const PAGE_NAMES = {
  '/':             'Inicio',
  '/equipos':      'Parejas',
  '/grupos':       'Clasificación',
  '/partidos':     'Partidos',
  '/estadisticas': 'Estadísticas',
  '/premios':      'Palmarés',
  '/galeria':      'Galería',
  '/reglas':       'Reglamento',
  '/cuadro':       'Cuadro (redirección)',
  '/mvp':          'MVP (redirección)',
}

export function pageName(path) {
  return PAGE_NAMES[path] ?? path
}

function tally(rows, key, { limit = 8, fallback = 'Desconocido' } = {}) {
  const counts = new Map()
  for (const r of rows) {
    const k = r[key] || fallback
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  const total = rows.length || 1
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }))
}

/**
 * @param {number} days how far back to look
 * @returns {Promise<object|null>} null when the table does not exist yet
 */
export async function getAnalytics(days = 30) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString()

  const { data, error } = await supabaseAdmin
    .from('page_views')
    .select('path, referrer, device, browser, os, country, visitor_hash, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(50_000)

  // Migration 0004 not run yet — the admin tab shows a setup note instead.
  if (error) return null

  const rows = data ?? []
  const now  = Date.now()
  const dayMs = 86_400_000

  const inWindow = ms => rows.filter(r => now - new Date(r.created_at).getTime() <= ms)
  const uniques  = list => new Set(list.map(r => r.visitor_hash)).size

  const last24h = inWindow(dayMs)
  const last7d  = inWindow(7 * dayMs)

  // Views per day, oldest first, for the sparkline.
  const perDay = new Map()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * dayMs).toISOString().slice(0, 10)
    perDay.set(d, { date: d, views: 0, visitors: new Set() })
  }
  for (const r of rows) {
    const d = r.created_at.slice(0, 10)
    const bucket = perDay.get(d)
    if (!bucket) continue
    bucket.views++
    bucket.visitors.add(r.visitor_hash)
  }
  const timeline = [...perDay.values()].map(b => ({
    date: b.date, views: b.views, visitors: b.visitors.size,
  }))

  // Busiest hour of the day, in local (Madrid) terms.
  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, views: 0 }))
  for (const r of rows) {
    const h = Number(
      new Date(r.created_at).toLocaleString('en-GB', {
        hour: '2-digit', hour12: false, timeZone: 'Europe/Madrid',
      }),
    )
    if (Number.isInteger(h) && byHour[h]) byHour[h].views++
  }
  const peak = byHour.reduce((a, b) => (b.views > a.views ? b : a), byHour[0])

  return {
    days,
    totals: {
      views:        rows.length,
      visitors:     uniques(rows),
      views24h:     last24h.length,
      visitors24h:  uniques(last24h),
      views7d:      last7d.length,
      visitors7d:   uniques(last7d),
      viewsPerVisitor: uniques(rows) ? +(rows.length / uniques(rows)).toFixed(1) : 0,
    },
    timeline,
    byHour,
    peak,
    pages:     tally(rows, 'path',     { limit: 10 }).map(p => ({ ...p, name: pageName(p.label) })),
    devices:   tally(rows, 'device',   { limit: 3 }),
    browsers:  tally(rows, 'browser',  { limit: 6 }),
    os:        tally(rows, 'os',       { limit: 6 }),
    countries: tally(rows, 'country',  { limit: 8, fallback: '—' }),
    referrers: tally(rows.filter(r => r.referrer), 'referrer', { limit: 8 }),
    directShare: rows.length
      ? Math.round((rows.filter(r => !r.referrer).length / rows.length) * 100)
      : 0,
  }
}
