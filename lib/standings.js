/**
 * lib/standings.js
 *
 * League tables for the group stage.
 *
 * Every group-stage match is a single set, so the ranking is:
 *   1. matches won      (desc)
 *   2. matches lost     (asc — fewer defeats breaks a tie on wins)
 *   3. game difference  (desc)
 *   4. games won        (desc)
 *   5. name             (asc — keeps the table stable between renders)
 *
 * ── THE FOUR-MATCH EXCEPTION ─────────────────────────────────────────────
 * Two pairs play a fourth group match: Rocío / Carla in the 1st division and
 * Héctor / Alexander in the 2nd. For them only THREE results count — their
 * best two and their worst. In other words the third-best result is dropped,
 * not the worst one. `countedResults` implements exactly that.
 */

import { qualificationFor, tallyMatch, CATEGORY_RULES } from './tournament.js'

/** A result is better the more sets it won, then the wider the game margin. */
function compareResults(a, b) {
  if (a.won !== b.won) return a.won ? -1 : 1
  const diff = (b.gw - b.gl) - (a.gw - a.gl)
  if (diff !== 0) return diff
  return b.gw - a.gw
}

/**
 * Picks which of a pair's results count towards the table.
 *
 * Three or fewer: all of them. Four: the best two plus the worst, dropping
 * the third-best. The rule is unusual — it deliberately keeps the bad day on
 * the record — so it is applied literally rather than "normalised" to
 * dropping the worst.
 */
export function countedResults(results) {
  if (results.length <= 3) return results
  const sorted = [...results].sort(compareResults)
  if (results.length === 4) return [sorted[0], sorted[1], sorted[3]]
  // Defensive: any further extra matches fall back to best-of-three.
  return [sorted[0], sorted[1], sorted[sorted.length - 1]]
}

export function compareStandings(a, b) {
  if (b.W !== a.W) return b.W - a.W
  if (a.L !== b.L) return a.L - b.L
  const diff = (b.GW - b.GL) - (a.GW - a.GL)
  if (diff !== 0) return diff
  if (b.GW !== a.GW) return b.GW - a.GW
  return (a.team_name ?? '').localeCompare(b.team_name ?? '', 'es')
}

/**
 * @param {Array} teams   [{ team_id, team_name, players? }]
 * @param {Array} matches match rows, each with a `sets` array
 * @returns {Array} sorted standings rows
 */
export function calculateStandings(teams, matches) {
  // Collect every result per pair first, so the four-match rule can choose.
  const results = {}
  for (const team of teams) results[team.team_id] = []

  for (const match of matches) {
    if (!match.completed) continue
    const { sets1, sets2, games1, games2 } = tallyMatch(match.sets)

    if (results[match.team1_id]) {
      results[match.team1_id].push({
        won: sets1 > sets2, gw: games1, gl: games2, match_id: match.id,
      })
    }
    if (results[match.team2_id]) {
      results[match.team2_id].push({
        won: sets2 > sets1, gw: games2, gl: games1, match_id: match.id,
      })
    }
  }

  const rows = teams.map(team => {
    const all     = results[team.team_id] ?? []
    const counted = countedResults(all)

    const row = {
      team_id:   team.team_id,
      team_name: team.team_name,
      players:   team.players ?? [],
      group_id:   team.group_id ?? null,
      group_name: team.group_name ?? null,
      MP: counted.length,
      played: all.length,          // includes any match that does not count
      dropped: all.length - counted.length,
      W: 0, L: 0, GW: 0, GL: 0,
    }

    for (const r of counted) {
      if (r.won) row.W++; else row.L++
      row.GW += r.gw
      row.GL += r.gl
    }
    return row
  })

  return rows.sort(compareStandings)
}

/**
 * Standings for a division that plays as one table (1, 2 and 4).
 * Rows carry their rank and where that rank leads.
 */
export function calculateCategoryStandings(level, teams, matches) {
  return calculateStandings(teams, matches).map((row, i) => ({
    ...row,
    rank:          i + 1,
    qualification: qualificationFor(level, i + 1),
  }))
}

/**
 * Standings for a division split into groups (division 3).
 *
 * Returns one table per group, plus the cross-group qualification picture:
 * the top two of every group go through, joined by the two best third-placed
 * pairs. Third places are compared on the same criteria as everything else.
 *
 * @param {Array} groups [{ id, name, teams: [...] }]
 */
export function calculateGroupedStandings(level, groups, matches) {
  const tables = groups.map(group => {
    const groupMatches = matches.filter(m => m.group_id === group.id)
    const rows = calculateStandings(group.teams, groupMatches).map((row, i) => ({
      ...row,
      groupRank:  i + 1,
      group_id:   group.id,
      group_name: group.name,
    }))
    return { ...group, standings: rows }
  })

  const all      = tables.flatMap(t => t.standings)
  const winners  = all.filter(r => r.groupRank === 1).sort(compareStandings)
  const runners  = all.filter(r => r.groupRank === 2).sort(compareStandings)
  const thirds   = all.filter(r => r.groupRank === 3).sort(compareStandings)

  const bestThirdsCount = Math.max(
    0,
    (CATEGORY_RULES[level]?.qualifiers ?? 8) - winners.length - runners.length,
  )
  const qualifiedThirds = thirds.slice(0, bestThirdsCount)
  const qualifiedIds    = new Set([...winners, ...runners, ...qualifiedThirds].map(r => r.team_id))

  // Annotate every row so the table can colour itself without extra lookups.
  for (const table of tables) {
    for (const row of table.standings) {
      row.qualification = qualifiedIds.has(row.team_id) ? 'quarterfinal' : 'eliminated'
      row.isBestThird   = qualifiedThirds.some(t => t.team_id === row.team_id)
    }
  }

  return { tables, winners, runners, thirds, qualifiedThirds, qualifiedIds }
}
