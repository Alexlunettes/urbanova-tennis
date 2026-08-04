/**
 * lib/squads.js
 *
 * Resolves squad encounters — the heart of the 2026 knockout format.
 *
 * From the quarterfinals onward, pairs no longer compete alone. A SQUAD fields
 * one pair per category and meets another squad over four simultaneous matches,
 * one per category. The squad that wins the majority of those matches advances,
 * so a pair can lose its own match and still go through on its team-mates' backs.
 *
 * The winner is always DERIVED, never stored, so correcting any score
 * immediately and consistently updates the whole bracket.
 *
 * Tie-break, in order:
 *   1. matches won
 *   2. total sets won across the encounter
 *   3. total games won across the encounter
 * Still level after all three → undecided; the organisers settle it by hand.
 */

import { matchesInEncounter, tallyMatch } from './tournament.js'

const zero = () => ({ matches: 0, sets: 0, games: 0 })

/**
 * @param {object}  encounter  squad_encounters row (needs id, squad1_id, squad2_id, is_reduced)
 * @param {Array}   matches    matches belonging to this encounter, each with `sets`
 * @returns {{
 *   score:      {squad1: {matches,sets,games}, squad2: {matches,sets,games}},
 *   played:     number,
 *   total:      number,
 *   isComplete: boolean,
 *   winnerSquadId: string|null,
 *   decidedBy:  'matches'|'sets'|'games'|null,
 *   isTied:     boolean,
 * }}
 */
export function resolveEncounter(encounter, matches = []) {
  const total = matchesInEncounter(encounter?.is_reduced)
  const score = { squad1: zero(), squad2: zero() }
  let played = 0

  for (const match of matches) {
    if (!match?.completed) continue
    played++

    // Convention enforced when the encounter's matches are created:
    // team1 always belongs to squad1, team2 to squad2.
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
    for (const key of /** @type {const} */ (['matches', 'sets', 'games'])) {
      if (score.squad1[key] === score.squad2[key]) continue
      winnerSquadId = score.squad1[key] > score.squad2[key]
        ? encounter.squad1_id
        : encounter.squad2_id
      decidedBy = key
      break
    }
  }

  return {
    score,
    played,
    total,
    isComplete,
    winnerSquadId,
    decidedBy,
    isTied: isComplete && !winnerSquadId,
  }
}

/**
 * Human-readable explanation of a squad result, in Spanish, for the bracket UI.
 * Returns null while the tie is still being played.
 */
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

/**
 * Groups a flat list of matches by their squad_encounter_id.
 * @returns {Record<string, Array>}
 */
export function groupMatchesByEncounter(matches = []) {
  const byEncounter = {}
  for (const m of matches) {
    if (!m.squad_encounter_id) continue
    ;(byEncounter[m.squad_encounter_id] ??= []).push(m)
  }
  return byEncounter
}

/**
 * Builds the full bracket view model: every encounter with its resolution,
 * its matches indexed by category, and the squads on each side.
 *
 * @param {Array} encounters  squad_encounters rows, each with squad1/squad2 expanded
 * @param {Array} matches     all knockout matches, each with `sets` and team relations
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

/**
 * Which squad advances out of a bracket position, or null if undecided.
 * Used to pre-fill the next round.
 */
export function advancingSquad(bracketEntry) {
  const id = bracketEntry?.resolution?.winnerSquadId
  if (!id) return null
  return id === bracketEntry.squad1_id ? bracketEntry.squad1 : bracketEntry.squad2
}
