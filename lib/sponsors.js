/**
 * lib/sponsors.js
 *
 * The sponsor roster. Add one entry per sponsor — the section on every page
 * picks them up automatically and needs no further changes.
 *
 *   name  — used for the alt text and the hover tooltip (required)
 *   logo  — path under public/, e.g. '/sponsors/acme.png'. Leave undefined and
 *           the component falls back to a typographic placeholder, so the
 *           layout is already correct before the artwork arrives.
 *   url   — optional link to the sponsor's site
 *   tier  — 'principal' renders larger and first; anything else is standard
 *
 * Recommended artwork: PNG or SVG with a transparent background, roughly
 * 400×160, with the mark centred and a little breathing room.
 */
export const SPONSORS = [
  { name: 'Patrocinador principal', tier: 'principal' },
  { name: 'Patrocinador' },
  { name: 'Patrocinador' },
  { name: 'Patrocinador' },
  { name: 'Patrocinador' },
  { name: 'Patrocinador' },
]

/** Set false once real logos exist, to drop the "espacio disponible" caption. */
export const SPONSORS_ARE_PLACEHOLDERS = SPONSORS.every(s => !s.logo)
