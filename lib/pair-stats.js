// lib/pair-stats.js
import { supabase } from './supabase'
import { LEVELS, tallyMatch } from './tournament'

/**
 * Tournament statistics, computed PER PAIR.
 *
 * Pairs never change during the tournament, so the pair — not the individual
 * player — is the unit that actually accumulates a record. (This previously
 * counted per player, which just duplicated each pair's numbers across its two
 * members and made every table twice as long for no extra information.)
 *
 * Covers every round, group stage and knockout, and is grouped by division.
 *
 * Each entry:
 *   { id, name, level, players[], MP, W, L, winRate,
 *     SW, SL, GW, GL, diff, streak, bestWin }
 */
export async function getPairStats() {
  const empty = Object.fromEntries(LEVELS.map(l => [l, []]))

  const [{ data: teams, error: teamError }, { data: matches, error: matchError }] = await Promise.all([
    supabase
      .from('teams')
      .select('id, name, level, player1:player1_id(id, name), player2:player2_id(id, name)')
      .order('level'),
    supabase
      .from('matches')
      .select(`
        id, level, stage, completed, winner_id, team1_id, team2_id, completed_at,
        sets(set_number, team1_score, team2_score, is_super_tiebreak)
      `)
      .eq('completed', true),
  ])

  if (teamError || matchError || !teams) return empty

  const byId = new Map(
    teams.map(t => [t.id, {
      id:      t.id,
      name:    t.name,
      level:   t.level,
      players: [t.player1?.name, t.player2?.name].filter(Boolean),
      MP: 0, W: 0, L: 0,
      SW: 0, SL: 0,
      GW: 0, GL: 0,
      results: [],          // chronological, for the form streak
    }]),
  )

  for (const match of matches ?? []) {
    if (!match.sets?.length) continue
    const { sets1, sets2, games1, games2 } = tallyMatch(match.sets)

    const sides = [
      { id: match.team1_id, sw: sets1, sl: sets2, gw: games1, gl: games2, opponent: match.team2_id },
      { id: match.team2_id, sw: sets2, sl: sets1, gw: games2, gl: games1, opponent: match.team1_id },
    ]

    for (const side of sides) {
      const row = byId.get(side.id)
      if (!row) continue
      const won = match.winner_id === side.id
      row.MP++
      row.SW += side.sw; row.SL += side.sl
      row.GW += side.gw; row.GL += side.gl
      if (won) row.W++; else row.L++
      row.results.push({ won, at: match.completed_at, stage: match.stage, margin: side.gw - side.gl })
    }
  }

  const result = { ...empty }
  for (const row of byId.values()) {
    row.diff    = row.GW - row.GL
    row.winRate = row.MP > 0 ? row.W / row.MP : 0

    // Most recent five results, newest first — rendered as form dots.
    row.streak = [...row.results]
      .sort((a, b) => new Date(b.at ?? 0) - new Date(a.at ?? 0))
      .slice(0, 5)
      .map(r => r.won)

    row.bestWin = row.results
      .filter(r => r.won)
      .reduce((best, r) => (best === null || r.margin > best ? r.margin : best), null)

    delete row.results
    if (result[row.level]) result[row.level].push(row)
  }

  for (const level of LEVELS) {
    result[level].sort((a, b) =>
      b.W - a.W ||
      a.L - b.L ||
      b.diff - a.diff ||
      b.GW - a.GW ||
      a.name.localeCompare(b.name, 'es'),
    )
  }

  return result
}
