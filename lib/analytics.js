/**
 * lib/analytics.js — server-side helpers for the first-party page-view log.
 *
 * Everything here is deliberately coarse. The goal is to tell the organisers
 * how the site is being used during the tournament, not to identify anyone:
 * user agents are reduced to a browser/OS/device bucket, referrers to a bare
 * host, and the visitor identifier is a salted hash that changes every day.
 */

import { createHash } from 'node:crypto'

/** Paths that are noise rather than signal. */
const IGNORED_PREFIXES = ['/admin', '/api', '/_next']

export function shouldTrack(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) return false
  return !IGNORED_PREFIXES.some(p => path === p || path.startsWith(`${p}/`))
}

/** Crawlers would otherwise dominate a small site's numbers. */
const BOT = /bot|crawler|spider|crawling|facebookexternalhit|slurp|bingpreview|headless|lighthouse|pingdom|monitor|preview|curl|wget|python-requests|axios|node-fetch/i

export function isBot(userAgent = '') {
  return BOT.test(userAgent)
}

/**
 * A per-day, per-visitor identifier that cannot be reversed or linked across
 * days. The date is inside the hash on purpose — see migration 0004.
 */
export function visitorHash(ip = '', userAgent = '', salt = '') {
  const day = new Date().toISOString().slice(0, 10)
  return createHash('sha256')
    .update(`${ip}|${userAgent}|${day}|${salt}`)
    .digest('hex')
    .slice(0, 32)
}

export function parseDevice(userAgent = '') {
  if (/ipad|tablet|playbook|silk/i.test(userAgent)) return 'tablet'
  if (/mobi|iphone|ipod|android.*mobile|windows phone/i.test(userAgent)) return 'mobile'
  return 'desktop'
}

export function parseBrowser(userAgent = '') {
  // Order matters: several browsers impersonate Chrome and Safari.
  if (/edg\//i.test(userAgent))                       return 'Edge'
  if (/opr\/|opera/i.test(userAgent))                 return 'Opera'
  if (/samsungbrowser/i.test(userAgent))              return 'Samsung Internet'
  if (/firefox|fxios/i.test(userAgent))               return 'Firefox'
  if (/chrome|crios/i.test(userAgent))                return 'Chrome'
  if (/safari/i.test(userAgent))                      return 'Safari'
  return 'Otro'
}

export function parseOS(userAgent = '') {
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS'
  if (/android/i.test(userAgent))          return 'Android'
  if (/mac os x/i.test(userAgent))         return 'macOS'
  if (/windows/i.test(userAgent))          return 'Windows'
  if (/linux/i.test(userAgent))            return 'Linux'
  return 'Otro'
}

/** Referrers are stored as a bare host, and self-referrals are dropped. */
export function parseReferrer(referrer, selfHost) {
  if (!referrer) return null
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    if (!host || (selfHost && host === selfHost.replace(/^www\./, ''))) return null
    return host
  } catch {
    return null
  }
}

/** First client IP from the usual proxy headers. Used only to build the hash. */
export function clientIp(headers) {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip') ?? ''
}
