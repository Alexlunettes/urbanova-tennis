/**
 * Calculates standings for a single group.
 *
 * @param {Array} teams   — [{ team_id, team_name }]
 * @param {Array} matches — matches rows, each with a `sets` array
 * @returns {Array}       — sorted standings
 */
export function calculateStandings(teams, matches) {
  const stats = {}

  for (const team of teams) {
    stats[team.team_id] = {
      team_id:   team.team_id,
      team_name: team.team_name,
      MP: 0, W: 0, L: 0,
      SW: 0, SL: 0,   // sets won / lost
      GW: 0, GL: 0,   // games won / lost
    }
  }

  for (const match of matches) {
    if (!match.completed) continue

    let t1Sets = 0, t2Sets = 0
    let t1Games = 0, t2Games = 0

    for (const s of (match.sets || [])) {
      if (s.team1_score > s.team2_score) t1Sets++
      else t2Sets++
      t1Games += s.team1_score
      t2Games += s.team2_score
    }

    const s1 = stats[match.team1_id]
    const s2 = stats[match.team2_id]

    if (s1) {
      s1.MP++
      s1.SW += t1Sets;  s1.SL += t2Sets
      s1.GW += t1Games; s1.GL += t2Games
      if (t1Sets > t2Sets) s1.W++; else s1.L++
    }
    if (s2) {
      s2.MP++
      s2.SW += t2Sets;  s2.SL += t1Sets
      s2.GW += t2Games; s2.GL += t1Games
      if (t2Sets > t1Sets) s2.W++; else s2.L++
    }
  }

  return Object.values(stats).sort((a, b) => {
    // 1. Most wins
    if (b.W !== a.W) return b.W - a.W
    // 2. Best set ratio
    const aS = (a.SW + a.SL) > 0 ? a.SW / (a.SW + a.SL) : 0
    const bS = (b.SW + b.SL) > 0 ? b.SW / (b.SW + b.SL) : 0
    if (bS !== aS) return bS - aS
    // 3. Best game ratio
    const aG = (a.GW + a.GL) > 0 ? a.GW / (a.GW + a.GL) : 0
    const bG = (b.GW + b.GL) > 0 ? b.GW / (b.GW + b.GL) : 0
    return bG - aG
  })
}