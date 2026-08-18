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

/**
 * The awards actually given out.
 *
 * The 2026 edition ended with only the MVP decided: the organisers chose not to
 * award Mejor Pareja, Mejor Jugador/a or Dúo Revelación, so those are gone from
 * here rather than left on the page as permanently empty cards. Adding one back
 * is just another entry in this list.
 */
export const AWARD_TYPES = [
  {
    key:   'mvp',
    label: 'MVP',
    blurb: 'El jugador o jugadora más determinante. Lo eligió el público.',
    icon:  'star',
    tone:  'accent',
    byPublicVote: true,
  },
]

/** The public vote is over; the site reports results, it no longer collects them. */
export const VOTING_CLOSED = true

/**
 * Winner of the public MVP vote in each division: whoever collected most votes.
 *
 * Pure so it can be tested on its own — the page does the querying and passes
 * the rows in. Ties are broken by name only to keep the output stable; a real
 * tie is flagged on the returned object so the page can say so rather than
 * silently crowning the alphabetically luckier player.
 *
 * @param {Array<{player_id: string, level: number}>} votes
 * @param {Record<string, {name: string, pair: string}>} playerIndex
 * @returns {Record<number, {winner, support, votes, total, share, tied}>}
 */
export function mvpWinnersFromVotes(votes = [], playerIndex = {}) {
  const byLevel = {}
  for (const v of votes) {
    if (v.level == null) continue
    ;(byLevel[v.level] ??= {})[v.player_id] = (byLevel[v.level][v.player_id] ?? 0) + 1
  }

  const result = {}
  for (const [level, counts] of Object.entries(byLevel)) {
    const ranked = Object.entries(counts)
      .map(([id, n]) => ({ id, n, ...(playerIndex[id] ?? {}) }))
      .sort((a, b) => b.n - a.n || (a.name ?? '').localeCompare(b.name ?? '', 'es'))

    const top   = ranked[0]
    if (!top) continue
    const total = ranked.reduce((sum, r) => sum + r.n, 0)

    result[Number(level)] = {
      winner:  top.name ?? null,
      support: top.pair ?? null,
      votes:   top.n,
      total,
      share:   total > 0 ? Math.round((top.n / total) * 100) : 0,
      tied:    ranked.length > 1 && ranked[1].n === top.n,
    }
  }
  return result
}

/**
 * Manually recorded winners by division, then by award key.
 *
 * Empty: the only award given in 2026 is the MVP, and that comes from the vote
 * rather than from here. An entry added here still overrides the vote.
 */
export const AWARDS = {
  1: {},
  2: {},
  3: {},
  4: {},
}

/** The award for one division and key, or null if still undecided. */
export function awardFor(level, key) {
  const entry = AWARDS[level]?.[key]
  if (!entry?.winner) return null
  return entry
}
