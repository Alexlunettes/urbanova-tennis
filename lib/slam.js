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
 * second "Daniel García" being created.
 *
 * `external: true` marks someone who plays ONLY the slam and is therefore not
 * in the doubles roster. Those are created on first setup, because there is no
 * existing record to reuse; everyone else must already exist or setup refuses
 * to run rather than quietly inventing a duplicate.
 *
 * The order was drawn at random. Seeds 13–16 were then fixed by request so
 * that Valen Fraile v Martín Calvente and Germán Valdés v David Gentil sit
 * side by side and their winners meet in the quarterfinal above them.
 * `KEPT_APART` below can force two entrants into opposite halves; it is empty
 * at the moment.
 *
 * `display` shortens a name for the slam only — first surname, no second. The
 * `name` above it still has to match the roster exactly, because that is the
 * lookup key; the shortened form is stored per participant and is what the
 * bracket and the admin panel render. Doing it this way keeps the doubles
 * tournament's player records (and so the statistics and the MVP vote)
 * untouched.
 *
 * To rename someone, edit the entry and re-run "Preparar el cuadro" — the
 * participant row is matched by seed, so their place in the draw and any
 * results they already have are kept.
 */
export const SLAM_DRAW = [
  { seed:  1, name: 'Javi Marín' },
  { seed:  2, name: 'Mario Melero' },
  { seed:  3, name: 'Héctor Roig' },
  { seed:  4, name: 'José Andújar Ballester',    display: 'José Andújar' },
  { seed:  5, name: 'Christian Herrerías' },
  { seed:  6, name: 'Daniel García' },
  { seed:  7, name: 'Vicente Martínez Gilabert', display: 'Vicente Martínez' },
  { seed:  8, name: 'Carlos Roig' },
  { seed:  9, name: 'Salvador Jaén Sánchez',     display: 'Salvador Jaén' },
  { seed: 10, name: 'Jampi', external: true },
  { seed: 11, name: 'Manu del Oro' },
  { seed: 12, name: 'Javier Román' },
  // Seeds 13–16 are fixed by request: these two ties sit side by side so their
  // winners meet in the quarterfinal above them (matches 7 and 8 both feed
  // quarterfinal 4).
  { seed: 13, name: 'Valen Fraile' },
  { seed: 14, name: 'Martín Calvente Zamora',    display: 'Martín Calvente' },
  { seed: 15, name: 'Germán Valdés', external: true },
  { seed: 16, name: 'David Gentil',  external: true },
]

/**
 * Entrants who must not meet before the final, as a list of names.
 *
 * Currently empty: it held Rocío and Carla, who have both left the draw. The
 * check below is kept because it is the cheap way to stop a bad draw reaching
 * the site, and it costs nothing while the list is empty.
 */
export const KEPT_APART = []

/**
 * Throws if the two names in KEPT_APART could meet before the final.
 *
 * Cheap enough to run on every render, and it turns a silently wrong draw —
 * the kind nobody notices until the two of them are drawn together in the
 * quarterfinals — into an immediate, obvious failure.
 */
export function assertOppositeHalves(draw = SLAM_DRAW) {
  if (KEPT_APART.length < 2) return                 // nothing to keep apart

  const halves = KEPT_APART.map(name => {
    const entry = draw.find(d => d.name === name)
    return entry ? halfOf(entry.seed) : null
  })
  if (halves.some(h => h === null)) return          // not in this draw at all
  if (halves[0] === halves[1]) {
    throw new Error(
      `El sorteo del 1 Point Slam es inválido: ${KEPT_APART.join(' y ')} están en la misma mitad ` +
      'del cuadro y podrían cruzarse antes de la final.',
    )
  }
}

/**
 * Sunday's schedule. The whole competition runs in ONE block at 19:30 —
 * sixteen players, one point per match, so the four rounds follow each other
 * without a break. Every round therefore carries the same time, and the UI
 * shows it once rather than repeating it per round.
 */
export const SLAM_TIME = { day: 'dom', time: '19:30' }

export const SLAM_SCHEDULE = {
  round_of_16:  SLAM_TIME,
  quarterfinal: SLAM_TIME,
  semifinal:    SLAM_TIME,
  final:        SLAM_TIME,
}

/**
 * Every match downstream of the given one, in order.
 *
 * Match `p` feeds match `ceil(p/2)` of the next round, and so on up to the
 * final. Used to invalidate results when a result below them changes: the
 * winner of a quarterfinal beat whoever came out of the round of 16, so if
 * that changes, the quarterfinal was never played by those two people and its
 * stored outcome has to go.
 *
 * @returns {Array<{round: string, position: number}>}
 */
export function descendantsOf(round, position) {
  const start = SLAM_ROUNDS.findIndex(r => r.key === round)
  if (start < 0) return []

  const chain = []
  let pos = position
  for (let i = start + 1; i < SLAM_ROUNDS.length; i++) {
    pos = Math.ceil(pos / 2)
    chain.push({ round: SLAM_ROUNDS[i].key, position: pos })
  }
  return chain
}

/** Which half of the draw a seed belongs to — two halves only meet in the final. */
export function halfOf(seed) {
  return seed <= 8 ? 'top' : 'bottom'
}

/**
 * How a participant is displayed, whoever they turn out to be.
 *
 * `label` wins over the roster name: it carries the slam's shortened form
 * (first surname only), and for an entrant who is not yet known it carries the
 * placeholder instead.
 */
export function participantLabel(participant) {
  if (!participant) return 'Por determinar'
  return participant.label ?? participant.player?.name ?? 'Por confirmar'
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

  // Verified against what is actually stored, not just against SLAM_DRAW, so a
  // hand-edited row in the database cannot quietly break the guarantee.
  const halves = KEPT_APART.map(name => {
    const p = participants.find(x => x.player?.name === name)
    return p ? halfOf(p.seed) : null
  })
  const keptApart =
    KEPT_APART.length < 2 ||
    halves.some(h => h === null) ||
    halves[0] !== halves[1]

  return { rounds, champion, keptApart }
}

/** Rows for seeding `slam_participants`, given a name → player id lookup. */
export function slamParticipantRows(playerIdByName = {}) {
  return SLAM_DRAW.map(entry => ({
    seed:      entry.seed,
    player_id: entry.name ? (playerIdByName[entry.name] ?? null) : null,
    // The shortened slam name, or the placeholder for an entrant with no
    // roster name at all. Null means "just use the roster name".
    label:     entry.display ?? (entry.name ? null : (entry.label ?? 'Por confirmar')),
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
