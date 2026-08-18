// lib/photos.js
//
// Tournament photos, read straight from the filesystem.
//
// There is no list to maintain: drop files into public/fotos/<edition>/ and
// they appear in the gallery. The 2026 edition alone runs to a few hundred
// images, so hand-listing them was never going to survive contact with reality.
//
// Server-only — it touches `fs`, so it must be imported from a server
// component (app/galeria/page.js) and never from a "use client" file.

import { readdirSync } from 'node:fs'
import { join } from 'node:path'

/** Editions to look for, newest first. Each is a folder under public/fotos/. */
export const EDITIONS = ['2026', '2025']

const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif)$/i

/**
 * Every photo of one edition, in a stable order.
 *
 * Filenames are used verbatim rather than URL-encoded: `next/image` encodes the
 * path itself when it builds the /_next/image URL, and pre-encoding here would
 * double-encode the spaces and brackets in the 2025 filenames.
 *
 * A missing folder is not an error — it just means that edition has no photos
 * yet, and the gallery already has an empty state for exactly that.
 *
 * @param {string|number} year
 * @returns {Array<{src: string}>}
 */
export function listPhotos(year) {
  let files
  try {
    files = readdirSync(join(process.cwd(), 'public', 'fotos', String(year)))
  } catch {
    return []
  }

  return files
    .filter(name => IMAGE_RE.test(name) && !name.startsWith('.'))
    .sort((a, b) => a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' }))
    .map(name => ({ src: `/fotos/${year}/${name}` }))
}

/** All editions at once, keyed by year — what the gallery page passes down. */
export function allPhotos() {
  return Object.fromEntries(EDITIONS.map(year => [year, listPhotos(year)]))
}
