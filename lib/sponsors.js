/**
 * lib/sponsors.js
 *
 * The sponsor roster. Add an entry and the footer section picks it up.
 *
 *   name  — alt text and hover tooltip (required)
 *   logo  — path under public/
 *   url   — official site; the tile becomes a link opening in a new tab
 *   tier  — 'principal' renders larger and in its own row above the rest
 *
 * The supplied artwork is already black and white, so it is shown at full
 * opacity with no greyscale filter. The old filter looked good on desktop but
 * left the logos permanently dimmed on touch devices, where there is no hover
 * to restore them.
 */
export const SPONSORS = [
  // ── Principal — shown larger, above the rest ──
  {
    name: 'Magnanni',
    logo: '/logos_sponsors/magnanni.png',
    url:  'https://magnanni.com/',
    tier: 'principal',
  },
  {
    name: 'RS Abogados',
    logo: '/logos_sponsors/rs_abogados.png',
    url:  'https://abogados-rs.es/',
    tier: 'principal',
  },

  // ── Collaborators — all the same size ──
  {
    name: 'Urbanova',
    logo: '/logos_sponsors/urvanova.png',
    url:  'https://www.instagram.com/urbanovaalicante/',
  },
  {
    name: 'El Abrazo Beach',
    logo: '/logos_sponsors/abrazo_beach.png',
    url:  'https://www.instagram.com/abrazo.beach/',
  },
  {
    name: 'Dvizio',
    logo: '/logos_sponsors/dvizio.png',
    url:  'https://dvizio-urbanova.eatbu.com/?lang=en#',
  },
  {
    name: 'Nook',
    logo: '/logos_sponsors/nook.png',
    url:  'https://www.instagram.com/nook.elaltet/',
  },
  {
    name: 'Moments',
    logo: '/logos_sponsors/moments.png',
    url:  'https://momentsbar.es/',
  },
  {
    name: 'Capricho de Raquel',
    logo: '/logos_sponsors/capricho_de_raquel.png',
    url:  'https://elcaprichoderaquel.es/',
  },
  {
    name: 'El Mar',
    logo: '/logos_sponsors/el_mar.png',
    url:  'https://www.instagram.com/elmar_urbanova/',
  },
  {
    name: 'Nou Vora Mar',
    logo: '/logos_sponsors/nou_vora_mar.png',
    url:  'https://www.instagram.com/nouvoramar/',
  },
  {
    name: 'La Jijonenca',
    logo: '/logos_sponsors/jijonenca.png',
    url:  'https://jijonencaurbanova.makro.rest/?lang=en#',
  },
  {
    name: 'La Tartana',
    logo: '/logos_sponsors/tartana.png',
    url:  'https://www.restaurantelatartana.com/',
  },
  {
    name: 'Pilón de la Negra',
    logo: '/logos_sponsors/pilon_de_la_negra.png',
    url:  'https://elpilondelanegra.es/',
  },
  {
    name: 'Serpis',
    logo: '/logos_sponsors/serpis.png',
    url:  'https://www.serpis.com/',
  },
  {
    name: '226ERS',
    logo: '/logos_sponsors/226ers.png',
    url:  'https://www.226ers.com/',
  },
]

/** Drives the "espacio disponible" caption; false once real logos exist. */
export const SPONSORS_ARE_PLACEHOLDERS = SPONSORS.every(s => !s.logo)
