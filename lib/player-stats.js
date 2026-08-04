// lib/player-stats.js
import { supabase } from './supabase'
import { LEVELS, tallyMatch } from './tournament'

/**
 * Individual player statistics, grouped by category: { 1: [...], …, 4: [...] }.
 *
 * Each entry: { id, name, level, matchesPlayed, matchesWon, setsWon, setsLost,
 *               gamesWon, gamesLost, winRate }
 *
 * Note: this previously filtered on `matches.completed_at`, a column that did
 * not exist in the database. Every request errored and the page silently
 * rendered as empty. It now keys off `completed`, the flag the score route
 * actually sets.
 */
export async function getPlayerStats() {
  const empty = Object.fromEntries(LEVELS.map(l => [l, []]))

  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id, level,
      team1:teams!matches_team1_id_fkey(
        id, name,
        player1:players!teams_player1_id_fkey(id, name),
        player2:players!teams_player2_id_fkey(id, name)
      ),
      team2:teams!matches_team2_id_fkey(
        id, name,
        player1:players!teams_player1_id_fkey(id, name),
        player2:players!teams_player2_id_fkey(id, name)
      ),
      sets(set_number, team1_score, team2_score, is_super_tiebreak)
    `)
    .eq('completed', true)

  if (error || !matches) return empty

  const byPlayer = new Map()

  function ensure(player, level) {
    if (!player) return null
    if (!byPlayer.has(player.id)) {
      byPlayer.set(player.id, {
        id:   player.id,
        name: player.name,
        level,
        matchesPlayed: 0,
        matchesWon:    0,
        setsWon:  0, setsLost:  0,
        gamesWon: 0, gamesLost: 0,
      })
    }
    return byPlayer.get(player.id)
  }

  for (const match of matches) {
    const { team1, team2, sets, level } = match
    if (!team1 || !team2 || !sets?.length) continue

    const { sets1, sets2, games1, games2 } = tallyMatch(sets)

    const sides = [
      { players: [team1.player1, team1.player2], won: sets1 > sets2, sw: sets1, sl: sets2, gw: games1, gl: games2 },
      { players: [team2.player1, team2.player2], won: sets2 > sets1, sw: sets2, sl: sets1, gw: games2, gl: games1 },
    ]

    for (const side of sides) {
      for (const player of side.players) {
        const stats = ensure(player, level)
        if (!stats) continue
        stats.matchesPlayed++
        stats.setsWon   += side.sw
        stats.setsLost  += side.sl
        stats.gamesWon  += side.gw
        stats.gamesLost += side.gl
        if (side.won) stats.matchesWon++
      }
    }
  }

  const result = { ...empty }
  for (const p of byPlayer.values()) {
    p.winRate = p.matchesPlayed > 0 ? p.matchesWon / p.matchesPlayed : 0
    if (result[p.level]) result[p.level].push(p)
  }

  for (const level of LEVELS) {
    result[level].sort((a, b) =>
      b.matchesWon - a.matchesWon ||
      (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost) ||
      b.gamesWon - a.gamesWon ||
      a.name.localeCompare(b.name, 'es'),
    )
  }

  return result
}
