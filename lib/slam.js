/**
 * lib/slam.js
 *
 * The "1 Point Slam" — a separate INDIVIDUAL knockout for 16 players, played
 * on the Sunday evening. Nothing here touches the main tournament: it has its
 * own tables, its own page and its own bracket. The only thing it shares is
 * the `players` table, so an entrant is the same person record as in the main
 * draw rather than a duplicate.
 *
 * ── HOW THE BRACKET STAYS HONEST ─────────────────────────────────────────
 *
 * Only the round-of-16 line-up is stored. Every later round is DERIVED from
 * the winners of the round below it:
 *
 *   round-of-16 match 1 ┐
 *                       ├─ quarterfinal 1 ┐
 *   round-of-16 match 2 ┘                 ├─ semifinal 1 ┐
 *   round-of-16 match 3 ┐                 │              │
 *                       ├─ quarterfinal 2 ┘              ├─ final
 *   round-of-16 match 4 ┘                                │
 *                          …and the same again below     ┘
 *
 * So match `p` of a round feeds slot `p odd ? 1 : 2` of match `ceil(p/2)` in
 * the next one. Entering a result therefore advances the winner immediately,
 * and correcting one un-advances them just as immediately — the bracket cannot
 * drift out of step with its own results.
 *
 * A match stores `winner_slot` (1 = upper participant, 2 = lower) rather than
 * a player id, which is what lets a slot be occupied by a still-unknown player.
 */

export const SLAM_ROUNDS = [
  { key: 'round_of_16',  label: 'Octavos de final', short: 'Octavos', matches: 8 },
  { key: 'quarterfinal', label: 'Cuartos de final', short: 'Cuartos', matches: 4 },
  { key: 'semifinal',    label: 'Semifinales',      short: 'Semis',   matches: 2 },
  { key: 'final',        label: 'Final',            short: 'Final',   matches: 1 },
]

export const SLAM_ROUND_KEYS = SLAM_ROUNDS.map(r => r.key)

/**
 * The draw, as 16 seeded positions.
 *
 * Names are matched against `players.name` when seeding the database, so they
 * must be spelled exactly as the roster spells them — that is what stops a
 * second "Daniel García" being created. `null` is the entrant who is not known
 * yet; replacing that entry (or the row's `player_id`) is all it takes.
 *
 * The order was drawn at random subject to one constraint: Rocío and Carla sit
 * in opposite halves (seeds 1–8 and 9–16), so they can only meet in the final.
 */
export const SLAM_DRAW = [
  { seed:  1, name: 'Jaime Benito Gutiérrez' },
  { seed:  2, name: 'Carlos Roig' },
  { seed:  3, name: null, label: 'Por confirmar' },
  { seed:  4, name: 'Vicente Martínez Gilabert' },
  { seed:  5, name: 'Christian Herrerías' },
  { seed:  6, name: 'Salvador Jaén Sánchez' },
  { seed:  7, name: 'Rocío Navarro' },
  { seed:  8, name: 'Valen Fraile' },
  { seed:  9, name: 'José Andújar Ballester' },
  { seed: 10, name: 'Carla Verdú' },
  { seed: 11, name: 'Martín Calvente Zamora' },
  { seed: 12, name: 'Javi Marín' },
  { seed: 13, name: 'Mario Melero' },
  { seed: 14, name: 'Manu del Oro' },
  { seed: 15, name: 'Javier Román' },
  { seed: 16, name: 'Daniel García' },
]

/** Sunday's schedule. The whole thing is played in two blocks. */
export const SLAM_SCHEDULE = {
  round_of_16:  { day: 'dom', time: '18:30' },
  quarterfinal: { day: 'dom', time: '20:30' },
  semifinal:    { day: 'dom', time: '20:30' },
  final:        { day: 'dom', time: '20:30' },
}

/** Which half of the draw a seed belongs to — used to prove the Rocío/Carla split. */
export function halfOf(seed) {
  return seed <= 8 ? 'top' : 'bottom'
}

/** How a participant is displayed, whoever they turn out to be. */
export function participantLabel(participant) {
  if (!participant) return 'Por determinar'
  return participant.player?.name ?? participant.label ?? 'Por confirmar'
}

/**
 * Builds the whole bracket from the stored participants and results.
 *
 * @param {Array} participants rows of slam_participants, with `player` joined
 * @param {Array} matches      rows of slam_matches
 * @returns {{rounds: Array, champion: object|null}}
 *
 * Each returned match carries its two resolved participants (`p1`, `p2`, either
 * of which may be null while the feeding match is unplayed), its winner, and
 * the match it feeds into.
 */
export function buildSlamBracket(participants = [], matches = []) {
  const bySeed = Object.fromEntries(participants.map(p => [p.seed, p]))
  const byKey  = Object.fromEntries(matches.map(m => [`${m.round}:${m.position}`, m]))

  const rounds = []
  let previous = null

  for (const round of SLAM_ROUNDS) {
    const built = []

    for (let position = 1; position <= round.matches; position++) {
      const row = byKey[`${round.key}:${position}`] ?? null

      // The round of 16 reads its players from the draw; every later round
      // reads them from the winners of the two matches that feed it.
      let p1, p2
      if (round.key === 'round_of_16') {
        p1 = bySeed[position * 2 - 1] ?? null
        p2 = bySeed[position * 2] ?? null
      } else {
        p1 = previous[position * 2 - 2]?.winner ?? null
        p2 = previous[position * 2 - 1]?.winner ?? null
      }

      const winner =
        row?.completed && row.winner_slot === 1 ? p1
        : row?.completed && row.winner_slot === 2 ? p2
        : null

      built.push({
        round:        round.key,
        roundLabel:   round.label,
        position,
        id:           row?.id ?? null,
        p1, p2,
        winner,
        winnerSlot:   row?.winner_slot ?? null,
        score:        row?.score ?? null,
        completed:    Boolean(row?.completed),
        scheduled_at: row?.scheduled_at ?? null,
        court:        row?.court ?? null,
        // A match can be played as soon as both of its participants are known.
        ready:        Boolean(p1 && p2),
        half:         round.key === 'final'
          ? null
          : position <= round.matches / 2 ? 'top' : 'bottom',
      })
    }

    rounds.push({ ...round, matches: built })
    previous = built
  }

  const champion = rounds.at(-1).matches[0].winner ?? null
  return { rounds, champion }
}

/** Rows for seeding `slam_participants`, given a name → player id lookup. */
export function slamParticipantRows(playerIdByName = {}) {
  return SLAM_DRAW.map(entry => ({
    seed:      entry.seed,
    player_id: entry.name ? (playerIdByName[entry.name] ?? null) : null,
    label:     entry.name ? null : (entry.label ?? 'Por confirmar'),
  }))
}

/** Rows for seeding the 15 empty `slam_matches`. */
export function slamMatchRows(slotToISO) {
  const rows = []
  for (const round of SLAM_ROUNDS) {
    const slot = SLAM_SCHEDULE[round.key]
    for (let position = 1; position <= round.matches; position++) {
      rows.push({
        round:        round.key,
        position,
        completed:    false,
        winner_slot:  null,
        scheduled_at: slot ? slotToISO(slot.day, slot.time) : null,
        court:        null,
      })
    }
  }
  return rows
}
