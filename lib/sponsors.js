/**
 * lib/sponsors.js
 *
 * The sponsor roster. Add an entry and the footer section picks it up.
 *
 *   name  — alt text and hover tooltip (required)
 *   logo  — path under public/
 *   url   — optional link to the sponsor's site
 *   tier  — 'principal' renders larger and in its own row above the rest
 *
 * The supplied artwork is already black and white, so it is shown at full
 * opacity with no greyscale filter. The old filter looked good on desktop but
 * left the logos permanently dimmed on touch devices, where there is no hover
 * to restore them.
 */
export const SPONSORS = [
  // ── Principal — shown larger, above the rest ──
  { name: 'Magnanni',            logo: '/logos_sponsors/magnanni.png',          tier: 'principal' },
  { name: 'RS Abogados',         logo: '/logos_sponsors/rs_abogados.png',       tier: 'principal' },

  // ── Collaborators — all the same size ──
  { name: 'Urvanova',            logo: '/logos_sponsors/urvanova.png' },
  { name: 'Abrazo Beach',        logo: '/logos_sponsors/abrazo_beach.png' },
  { name: 'Dvizio',              logo: '/logos_sponsors/dvizio.png' },
  { name: 'Nook',                logo: '/logos_sponsors/nook.png' },
  { name: 'Moments',             logo: '/logos_sponsors/moments.png' },
  { name: 'El Mar',              logo: '/logos_sponsors/el_mar.png' },
  { name: 'Nou Vora Mar',        logo: '/logos_sponsors/nou_vora_mar.png' },
  { name: 'La Jijonenca',        logo: '/logos_sponsors/jijonenca.png' },
  { name: 'La Tartana',          logo: '/logos_sponsors/tartana.png' },
  { name: 'Pilón de la Negra',   logo: '/logos_sponsors/pilon_de_la_negra.png' },
]

/** Drives the "espacio disponible" caption; false once real logos exist. */
export const SPONSORS_ARE_PLACEHOLDERS = SPONSORS.every(s => !s.logo)
