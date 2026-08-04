/**
 * lib/auth.js — admin session handling. Server-only.
 *
 * The previous implementation stored the literal string "authenticated" in the
 * cookie and checked for that exact value. `httpOnly` stops page scripts from
 * reading the cookie, but it does not stop anyone from *setting* it: pasting
 * one line into devtools, or a single curl call, granted full write access to
 * every admin route.
 *
 * Sessions are now HMAC-signed and carry an expiry, so a cookie cannot be
 * forged without the server secret, and comparison is constant-time.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const COOKIE_NAME = 'admin_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

/**
 * Prefers a dedicated secret; falls back to ADMIN_PASSWORD so existing
 * deployments keep working without a new environment variable. Rotating
 * ADMIN_PASSWORD then also invalidates every live session, which is the
 * behaviour you want anyway.
 */
function secret() {
  const value = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD
  if (!value) throw new Error('ADMIN_PASSWORD (o ADMIN_SESSION_SECRET) no está configurado')
  return value
}

function sign(payload) {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

/** Builds a `<expiresAt>.<signature>` token. */
export function createSessionToken() {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000
  return `${expiresAt}.${sign(String(expiresAt))}`
}

export function verifySessionToken(token) {
  if (typeof token !== 'string') return false

  const dot = token.indexOf('.')
  if (dot < 1) return false

  const expiresAt = token.slice(0, dot)
  const signature = token.slice(dot + 1)

  const expiry = Number(expiresAt)
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false

  let expected
  try { expected = sign(expiresAt) } catch { return false }

  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Constant-time password check, so the response time leaks nothing. */
export function passwordMatches(candidate) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || typeof candidate !== 'string') return false
  const a = Buffer.from(candidate)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   MAX_AGE_SECONDS,
    path:     '/',
  }
}

/** True when the current request carries a valid admin session. */
export async function isAdmin() {
  const store = await cookies()
  return verifySessionToken(store.get(COOKIE_NAME)?.value)
}

/**
 * Guard for route handlers.
 * @returns {Response|null} a 401 to return immediately, or null to continue.
 */
export async function requireAdmin() {
  if (await isAdmin()) return null
  return Response.json({ error: 'No autorizado' }, { status: 401 })
}
