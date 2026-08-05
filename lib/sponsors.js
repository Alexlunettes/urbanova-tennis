/**
 * lib/sponsors.js
 *
 * The sponsor roster. Add one entry per sponsor — the section in the footer
 * picks them up automatically and needs no further changes.
 *
 *   name  — alt text and hover tooltip (required)
 *   logo  — path under public/. Leave undefined and the component falls back
 *           to a typographic placeholder, so the layout stays correct while
 *           artwork is still being collected.
 *   url   — optional link to the sponsor's site
 *   tier  — 'principal' renders larger and first; anything else is standard
 *
 * Recommended artwork: PNG or SVG on a transparent background, roughly
 * 400×160, mark centred with a little breathing room. Logos are shown in
 * greyscale and come to full colour on hover, which keeps a row of mismatched
 * brand marks visually calm.
 */
export const SPONSORS = [
  { name: 'Abrazo Beach',                logo: '/logos_sponsors/abrazo-beach-logo.png' },
  { name: 'Dvizio',                      logo: '/logos_sponsors/dvizio-logo.png' },
  { name: 'El Pilón',                    logo: '/logos_sponsors/elpilon-nv.png' },
  { name: 'La Jijonenca',                logo: '/logos_sponsors/jijonenca-logo.jpeg' },
  { name: 'Moments Bar',                 logo: '/logos_sponsors/logo-moments-bar.png' },
  { name: 'Restaurante La Tartana',      logo: '/logos_sponsors/logo-restaurante-la-tartana-el-altet-alicante.png' },
  { name: 'Magnanni',                    logo: '/logos_sponsors/magnanni-logo.png' },
  { name: 'Nook',                        logo: '/logos_sponsors/nook-logo.png' },
  { name: 'Capricho de Raquel',          logo: '/logos_sponsors/restaurante-capricho-de-raquel-logo-retina.png' },
]

/** Drives the "espacio disponible" caption; false once real logos exist. */
export const SPONSORS_ARE_PLACEHOLDERS = SPONSORS.every(s => !s.logo)
