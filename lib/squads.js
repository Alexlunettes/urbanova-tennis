/**
 * lib/squads.js
 *
 * The knockout stage.
 *
 * QUARTERFINALS are played by individual pairs, division by division — no
 * squads yet. Each division comes out of them with exactly four survivors:
 * divisions 1 and 2 contribute their group winner (who rested) plus three
 * quarterfinal winners; divisions 3 and 4 contribute four quarterfinal
 * winners.
 *
 * TEAMS ("equipos") are formed only at that point, and they are DRAWN BY HAND
 * by the organisers — see app/api/bracket/teams. The site deliberately does no
 * generating and no randomising of its own, because availability constraints
 * are known only offline. From the semifinals on it is team versus team over
 * four matches, one per division, and the majority advances.
 *
 * `survivorsForDivision` below still ranks the survivors, but only so the
 * admin's picker can list them in a sensible order — the ranking no longer
 * decides anything.
 *
 * Squad results are always DERIVED from the match rows, never stored, so
 * correcting a score immediately and consistently updates the whole bracket.
 *
 * Tie-break inside a tie, in order:
 *   1. matches won
 *   2. total sets won across the tie
 *   3. total games won across the tie
 * Still level after all three → undecided; the organisers settle it by hand.
 */

import { matchesInEncounter, tallyMatch, CATEGORY_RULES } from './tournament.js'
import { compareStandings } from './standings.js'

const zero = () => ({ matches: 0, sets: 0, games: 0 })

/**
 * @param {object} encounter  squad_encounters row (id, squad1_id, squad2_id)
 * @param {Array}  matches    matches belonging to this tie, each with `sets`
 */
export function resolveEncounter(encounter, matches = []) {
  const total = matchesInEncounter()
  const score = { squad1: zero(), squad2: zero() }
  let played = 0

  for (const match of matches) {
    if (!match?.completed) continue
    played++

    // Convention enforced when a tie's matches are created: team1 always
    // belongs to squad1 and team2 to squad2.
    const { sets1, sets2, games1, games2 } = tallyMatch(match.sets)
    score.squad1.sets  += sets1
    score.squad1.games += games1
    score.squad2.sets  += sets2
    score.squad2.games += games2

    if (match.winner_id && match.winner_id === match.team1_id) score.squad1.matches++
    else if (match.winner_id && match.winner_id === match.team2_id) score.squad2.matches++
  }

  const isComplete = played >= total && total > 0
  let winnerSquadId = null
  let decidedBy = null

  if (isComplete) {
    for (const key of ['matches', 'sets', 'games']) {
      if (score.squad1[key] === score.squad2[key]) continue
      winnerSquadId = score.squad1[key] > score.squad2[key]
        ? encounter.squad1_id
        : encounter.squad2_id
      decidedBy = key
      break
    }
  }

  return {
    score, played, total, isComplete, winnerSquadId, decidedBy,
    isTied: isComplete && !winnerSquadId,
  }
}

/** Human-readable outcome, in Spanish, for the bracket UI. */
export function explainResult(resolution) {
  if (!resolution.isComplete) return null
  const { score, decidedBy } = resolution
  const a = score.squad1, b = score.squad2
  const hi = Math.max(a.matches, b.matches)
  const lo = Math.min(a.matches, b.matches)

  if (decidedBy === 'matches') return `Gana ${hi}–${lo} en partidos`
  if (decidedBy === 'sets')    return `Empate ${hi}–${lo} · desempate por sets (${Math.max(a.sets, b.sets)}–${Math.min(a.sets, b.sets)})`
  if (decidedBy === 'games')   return `Empate ${hi}–${lo} · desempate por juegos (${Math.max(a.games, b.games)}–${Math.min(a.games, b.games)})`
  return 'Empate total — pendiente de resolución'
}

/** Groups a flat list of matches by their squad_encounter_id. */
export function groupMatchesByEncounter(matches = []) {
  const byEncounter = {}
  for (const m of matches) {
    if (!m.squad_encounter_id) continue
    ;(byEncounter[m.squad_encounter_id] ??= []).push(m)
  }
  return byEncounter
}

/**
 * Builds the squad half of the bracket: every semifinal and the final, with
 * its resolution, its matches indexed by division, and both squads.
 */
export function buildBracket(encounters = [], matches = []) {
  const byEncounter = groupMatchesByEncounter(matches)

  return encounters
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(encounter => {
      const encMatches = byEncounter[encounter.id] ?? []
      const resolution = resolveEncounter(encounter, encMatches)
      const matchesByCategory = {}
      for (const m of encMatches) matchesByCategory[m.level] = m

      return {
        ...encounter,
        matches: encMatches,
        matchesByCategory,
        resolution,
        explanation: explainResult(resolution),
      }
    })
}

/** Which squad advances from a tie, or null while it is undecided. */
export function advancingSquad(bracketEntry) {
  const id = bracketEntry?.resolution?.winnerSquadId
  if (!id) return null
  return id === bracketEntry.squad1_id ? bracketEntry.squad1 : bracketEntry.squad2
}

/* ════════════════════════════════════════════════════════════════════════
   SQUAD FORMATION
   ════════════════════════════════════════════════════════════════════════ */

/**
 * The pairs still alive in one division once its quarterfinals are done.
 *
 * @param {number} level
 * @param {Array}  quarterfinals  the division's quarterfinal matches
 * @param {Array}  standings      its group-stage table, best first, each row
 *                                carrying team_id / team_name / rank
 * @returns {{ survivors: Array, complete: boolean, expected: number }}
 *          `survivors` is ordered best-ranked first — the order squads are
 *          built from.
 */
export function survivorsForDivision(level, quarterfinals = [], standings = []) {
  const rules    = CATEGORY_RULES[level] ?? {}
  const expected = rules.survivors ?? 4
  const byId     = Object.fromEntries(standings.map(r => [r.team_id, r]))

  // Division 1 and 2 send their group winner straight to the squad stage.
  const byes = standings.slice(0, rules.byes ?? 0)

  const winners = []
  for (const qf of quarterfinals) {
    if (!qf.completed || !qf.winner_id) continue
    const row = byId[qf.winner_id]
    winners.push(row ?? { team_id: qf.winner_id, team_name: qf.winner?.name ?? '—' })
  }

  // Ranked on the group-stage record. For divisions 1, 2 and 4 that is simply
  // the overall table; for division 3, whose pairs come from three separate
  // groups, the same comparison is applied across them.
  const survivors = [...byes, ...winners].sort((a, b) => {
    if (a.W === undefined || b.W === undefined) {
      return (a.rank ?? 99) - (b.rank ?? 99)
    }
    return compareStandings(a, b)
  })

  return {
    survivors,
    expected,
    complete: survivors.length === expected,
    playedQuarterfinals: quarterfinals.filter(q => q.completed).length,
    totalQuarterfinals:  rules.quarterfinals ?? quarterfinals.length,
  }
}

/**
 * Standard semifinal pairing for four seeded squads: 1 v 4 and 2 v 3.
 * @returns {Array<[number, number]>} pairs of seeds
 */
export const SEMIFINAL_SEEDING = [[1, 4], [2, 3]]
