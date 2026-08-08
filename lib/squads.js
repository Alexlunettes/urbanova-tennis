/**
 * lib/squads.js
 *
 * The knockout stage.
 *
 * QUARTERFINALS are played by individual pairs, division by division — no
 * teams yet. Each division comes out of them with exactly four survivors:
 * divisions 1 and 2 contribute their group winner (who rested) plus three
 * quarterfinal winners; divisions 3 and 4 contribute four quarterfinal
 * winners.
 *
 * TEAMS ("equipos") are then derived automatically, and — this is the part
 * that changed — they are built from QUARTERFINAL performance only, never
 * from the group tables:
 *
 *   · each division ranks its four survivors #1…#4
 *   · in divisions 1 and 2 the pair that skipped the quarterfinals is #1 by
 *     right, and the three quarterfinal winners fill #2…#4
 *   · in divisions 3 and 4 the four quarterfinal winners fill #1…#4
 *   · quarterfinal winners are ranked on how convincingly they won: set
 *     difference first (2–0 beats 2–1), then game difference
 *
 * The four teams are then assembled by TEAM_COMPOSITION below, which
 * deliberately mixes ranks so no team collects all the strongest pairs.
 *
 * From the semifinals on it is team versus team over four matches, one per
 * division, and the majority advances. Crucially the TEAM advances, not the
 * individual winners: a pair can win its own semifinal match and still be out
 * because its team lost 3–1.
 *
 * Team results are always DERIVED from the match rows, never stored, so
 * correcting a score immediately and consistently updates the whole bracket.
 *
 * Tie-break inside a tie, in order:
 *   1. matches won
 *   2. total sets won across the tie
 *   3. total games won across the tie
 * Still level after all three → undecided; the organisers settle it by hand.
 */

import { matchesInEncounter, tallyMatch, LEVELS, CATEGORY_RULES } from './tournament.js'

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
 * Builds the team half of the bracket: every semifinal and the final, with
 * its resolution, its matches indexed by division, and both teams.
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

/** Which team advances from a tie, or null while it is undecided. */
export function advancingSquad(bracketEntry) {
  const id = bracketEntry?.resolution?.winnerSquadId
  if (!id) return null
  return id === bracketEntry.squad1_id ? bracketEntry.squad1 : bracketEntry.squad2
}

/* ════════════════════════════════════════════════════════════════════════
   RANKING THE SURVIVORS — FROM THE QUARTERFINALS ONLY
   ════════════════════════════════════════════════════════════════════════ */

/**
 * How convincingly a pair won its quarterfinal.
 *
 * `setDiff` is what separates a 2–0 from a 2–1; `gameDiff` breaks the tie
 * between two equally clean wins. A bye carries no performance at all, which
 * is fine because a bye is placed at #1 before any of this is consulted.
 */
export function quarterfinalPerformance(match, teamId) {
  if (!match?.completed) return null
  const isTeam1 = match.team1_id === teamId
  const { sets1, sets2, games1, games2 } = tallyMatch(match.sets)
  return {
    setsWon:   isTeam1 ? sets1 : sets2,
    setsLost:  isTeam1 ? sets2 : sets1,
    gamesWon:  isTeam1 ? games1 : games2,
    gamesLost: isTeam1 ? games2 : games1,
    get setDiff()  { return this.setsWon - this.setsLost },
    get gameDiff() { return this.gamesWon - this.gamesLost },
  }
}

/** Best performance first: set difference, then game difference. */
export function comparePerformance(a, b) {
  const pa = a.performance, pb = b.performance
  if (!pa && !pb) return 0
  if (!pa) return 1
  if (!pb) return -1
  if (pb.setDiff !== pa.setDiff)   return pb.setDiff - pa.setDiff
  if (pb.gameDiff !== pa.gameDiff) return pb.gameDiff - pa.gameDiff
  if (pb.gamesWon !== pa.gamesWon) return pb.gamesWon - pa.gamesWon
  return (a.team_name ?? '').localeCompare(b.team_name ?? '', 'es')
}

/**
 * Ranks one division's four survivors #1…#4.
 *
 * @param {number} level
 * @param {Array}  quarterfinals  that division's quarterfinal matches
 * @param {Array}  groupStandings its group table, only to identify the bye
 * @returns {{ ranked: Array, complete: boolean, expected: number,
 *             played: number, total: number }}
 *          Each ranked entry: { team_id, team_name, rank, viaBye, performance }
 */
export function rankSurvivorsForDivision(level, quarterfinals = [], groupStandings = []) {
  const rules    = CATEGORY_RULES[level] ?? {}
  const expected = rules.survivors ?? 4
  const total    = rules.quarterfinals ?? quarterfinals.length
  const played   = quarterfinals.filter(q => q.completed).length

  // Divisions 1 and 2: the group winner rested and is #1 by right.
  const byes = groupStandings.slice(0, rules.byes ?? 0).map(row => ({
    team_id:     row.team_id,
    team_name:   row.team_name,
    viaBye:      true,
    performance: null,
  }))

  const winners = []
  for (const qf of quarterfinals) {
    if (!qf.completed || !qf.winner_id) continue
    const name = qf.winner_id === qf.team1_id ? qf.team1?.name : qf.team2?.name
    winners.push({
      team_id:     qf.winner_id,
      team_name:   name ?? '—',
      viaBye:      false,
      performance: quarterfinalPerformance(qf, qf.winner_id),
      slot:        qf.slot ?? null,
    })
  }

  winners.sort(comparePerformance)

  const ranked = [...byes, ...winners].map((entry, i) => ({ ...entry, rank: i + 1 }))

  return {
    ranked,
    expected,
    complete: ranked.length === expected && played === total,
    played,
    total,
  }
}

/* ════════════════════════════════════════════════════════════════════════
   TEAM COMPOSITION
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Which rank each team takes from each division.
 *
 * Deliberately staggered so no team sweeps the top seeds: the division-1
 * leader is paired with the division-2 runner-up, and so on.
 *
 *   Team A — 1ª #1 · 2ª #2 · 3ª #1 · 4ª #2
 *   Team B — 1ª #2 · 2ª #1 · 3ª #2 · 4ª #1
 *   Team C — 1ª #3 · 2ª #4 · 3ª #3 · 4ª #4
 *   Team D — 1ª #4 · 2ª #3 · 3ª #4 · 4ª #3
 */
export const TEAM_COMPOSITION = [
  { key: 'A', seed: 1, name: 'Equipo A', ranks: { 1: 1, 2: 2, 3: 1, 4: 2 } },
  { key: 'B', seed: 2, name: 'Equipo B', ranks: { 1: 2, 2: 1, 3: 2, 4: 1 } },
  { key: 'C', seed: 3, name: 'Equipo C', ranks: { 1: 3, 2: 4, 3: 3, 4: 4 } },
  { key: 'D', seed: 4, name: 'Equipo D', ranks: { 1: 4, 2: 3, 3: 4, 4: 3 } },
]

/** Semifinal draw: A v D and B v C. */
export const SEMIFINAL_SEEDING = [[1, 4], [2, 3]]

/**
 * Derives the four teams from the per-division rankings.
 *
 * Always returns four slots so the bracket can show the shape before every
 * quarterfinal is in; `ready` says whether the composition is final.
 *
 * @param {Record<number, {ranked: Array, complete: boolean}>} byDivision
 */
export function deriveTeams(byDivision = {}) {
  const ready = LEVELS.every(l => byDivision[l]?.complete)

  const teams = TEAM_COMPOSITION.map(spec => {
    const members = {}
    for (const level of LEVELS) {
      const wanted = spec.ranks[level]
      members[level] = byDivision[level]?.ranked?.find(r => r.rank === wanted) ?? null
    }
    return {
      ...spec,
      members,
      complete: LEVELS.every(l => members[l]),
    }
  })

  return { teams, ready }
}
