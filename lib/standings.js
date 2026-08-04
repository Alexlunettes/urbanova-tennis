/**
 * lib/standings.js
 *
 * Builds the league table for a category.
 *
 * The 2026 group stage is Champions-League style: every team plays only a
 * subset of the category (3–5 opponents), so teams can finish on a different
 * number of played matches. The ordering accounts for that by breaking ties on
 * losses before looking at sets — 3 wins from 3 outranks 3 wins from 4.
 *
 * Ordering:
 *   1. matches won      (desc)
 *   2. matches lost     (asc — fewer defeats wins the tie)
 *   3. set difference   (desc)
 *   4. game difference  (desc)
 *   5. name             (asc — keeps the table stable between renders)
 */

import { qualificationFor, tallyMatch } from './tournament.js'

function blankRow(team) {
  return {
    team_id:   team.team_id,
    team_name: team.team_name,
    players:   team.players ?? [],
    MP: 0, W: 0, L: 0,
    SW: 0, SL: 0,   // sets won / lost
    GW: 0, GL: 0,   // games won / lost
  }
}

export function compareStandings(a, b) {
  if (b.W !== a.W) return b.W - a.W
  if (a.L !== b.L) return a.L - b.L
  const setDiff = (b.SW - b.SL) - (a.SW - a.SL)
  if (setDiff !== 0) return setDiff
  const gameDiff = (b.GW - b.GL) - (a.GW - a.GL)
  if (gameDiff !== 0) return gameDiff
  return (a.team_name ?? '').localeCompare(b.team_name ?? '', 'es')
}

/**
 * @param {Array} teams   [{ team_id, team_name, players? }]
 * @param {Array} matches match rows, each with a `sets` array
 * @returns {Array} sorted standings rows
 */
export function calculateStandings(teams, matches) {
  const stats = {}
  for (const team of teams) stats[team.team_id] = blankRow(team)

  for (const match of matches) {
    if (!match.completed) continue

    const { sets1, sets2, games1, games2 } = tallyMatch(match.sets)
    const s1 = stats[match.team1_id]
    const s2 = stats[match.team2_id]

    if (s1) {
      s1.MP++
      s1.SW += sets1;  s1.SL += sets2
      s1.GW += games1; s1.GL += games2
      if (sets1 > sets2) s1.W++; else s1.L++
    }
    if (s2) {
      s2.MP++
      s2.SW += sets2;  s2.SL += sets1
      s2.GW += games2; s2.GL += games1
      if (sets2 > sets1) s2.W++; else s2.L++
    }
  }

  return Object.values(stats).sort(compareStandings)
}

/**
 * Standings for one category, annotated with rank and where each team ends up.
 * `qualification` is 'semifinal' | 'quarterfinal' | 'eliminated'.
 */
export function calculateCategoryStandings(level, teams, matches) {
  return calculateStandings(teams, matches).map((row, i) => ({
    ...row,
    rank:          i + 1,
    qualification: qualificationFor(level, i + 1),
  }))
}
