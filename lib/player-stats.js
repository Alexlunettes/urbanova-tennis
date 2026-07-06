// lib/player-stats.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * Returns player stats grouped by level: { 1: [...], 2: [...], 3: [...] }
 * Each player object: { id, name, level, matchesPlayed, matchesWon, setsWon, setsLost, gamesWon, gamesLost }
 */
export async function getPlayerStats() {
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id, level, completed_at,
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
    .not('completed_at', 'is', null)

  if (error || !matches) return { 1: [], 2: [], 3: [] }

  const statsMap = {} // player_id → stats object

  function ensure(player, level) {
    if (!player) return
    if (!statsMap[player.id]) {
      statsMap[player.id] = {
        id: player.id,
        name: player.name,
        level,
        matchesPlayed: 0,
        matchesWon: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
      }
    }
  }

  for (const match of matches) {
    const { team1, team2, sets, level } = match
    if (!team1 || !team2 || !sets || sets.length === 0) continue

    const t1players = [team1.player1, team1.player2].filter(Boolean)
    const t2players = [team2.player1, team2.player2].filter(Boolean)

    t1players.forEach(p => ensure(p, level))
    t2players.forEach(p => ensure(p, level))

    let t1Sets = 0, t2Sets = 0

    for (const set of sets) {
      const s1 = set.team1_score
      const s2 = set.team2_score
      if (s1 > s2) t1Sets++
      else if (s2 > s1) t2Sets++

      // Accumulate game scores for each player on each side
      t1players.forEach(p => {
        statsMap[p.id].gamesWon  += s1
        statsMap[p.id].gamesLost += s2
      })
      t2players.forEach(p => {
        statsMap[p.id].gamesWon  += s2
        statsMap[p.id].gamesLost += s1
      })
    }

    const matchWon1 = t1Sets > t2Sets
    const matchWon2 = t2Sets > t1Sets

    t1players.forEach(p => {
      statsMap[p.id].matchesPlayed++
      statsMap[p.id].setsWon  += t1Sets
      statsMap[p.id].setsLost += t2Sets
      if (matchWon1) statsMap[p.id].matchesWon++
    })
    t2players.forEach(p => {
      statsMap[p.id].matchesPlayed++
      statsMap[p.id].setsWon  += t2Sets
      statsMap[p.id].setsLost += t1Sets
      if (matchWon2) statsMap[p.id].matchesWon++
    })
  }

  // Group by level, sort by matches won (then games won as tiebreaker)
  const result = { 1: [], 2: [], 3: [] }
  for (const p of Object.values(statsMap)) {
    if (result[p.level]) result[p.level].push(p)
  }
  ;[1, 2, 3].forEach(l => {
    result[l].sort((a, b) =>
      b.matchesWon - a.matchesWon ||
      b.gamesWon   - a.gamesWon
    )
  })

  return result
}