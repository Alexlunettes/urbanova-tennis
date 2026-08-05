/**
 * lib/awards.js
 *
 * The end-of-tournament awards ("Palmarés").
 *
 * Four awards per division. Everything is data here, so filling one in during
 * or after the tournament is a one-line edit and a redeploy — no schema
 * change, no admin screen.
 *
 * To award something, set `winner` (and optionally `players` and `note`):
 *
 *   3: {
 *     'mejor-pareja': {
 *       winner:  'Joaquín Dubois / Manu del Oro',
 *       players: ['Joaquín Dubois', 'Manu del Oro'],
 *       note:    'Invictas en la fase de grupos.',
 *     },
 *   }
 *
 * Leave an entry out and the card renders as "Por decidir", which is the right
 * state before the trophies are handed over.
 *
 * The MVP award is the exception: it is decided by public vote, so its card
 * reads live from the voting rather than from this file. Setting a `winner`
 * here overrides the vote once the organisers confirm the result.
 */

import { LEVELS } from './tournament'

export const AWARD_TYPES = [
  {
    key:   'mejor-pareja',
    label: 'Mejor Pareja',
    blurb: 'La pareja más sólida de la división de principio a fin.',
    icon:  'trophy',
    tone:  'sand',
  },
  {
    key:   'mvp',
    label: 'MVP',
    blurb: 'El jugador o jugadora más determinante. Lo elige el público.',
    icon:  'star',
    tone:  'accent',
    byPublicVote: true,
  },
  {
    key:   'mejor-jugador',
    label: 'Mejor Jugador/a',
    blurb: 'El mejor rendimiento individual de la división.',
    icon:  'racket',
    tone:  'court',
  },
  {
    key:   'duo-revelacion',
    label: 'Dúo Revelación',
    blurb: 'La sorpresa del torneo: la pareja que superó todas las expectativas.',
    icon:  'spark',
    tone:  'neutral',
  },
]

/**
 * Winners by division, then by award key.
 * All empty for now — the tournament has not been played.
 */
export const AWARDS = {
  1: {},
  2: {},
  3: {},
  4: {},
}

/** Has anything been awarded yet? Drives the page's overall empty state. */
export const AWARDS_ANNOUNCED = LEVELS.some(
  level => Object.keys(AWARDS[level] ?? {}).length > 0,
)

/** The award for one division and key, or null if still undecided. */
export function awardFor(level, key) {
  const entry = AWARDS[level]?.[key]
  if (!entry?.winner) return null
  return entry
}
