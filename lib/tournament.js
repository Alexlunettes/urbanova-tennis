/**
 * lib/tournament.js
 *
 * The rules of the 2026 tournament, in one place.
 * Pure functions only — imported by both server components and the admin UI.
 */

export const LEVELS = [1, 2, 3, 4]

/**
 * How each category qualifies for the knockout stage.
 *
 * Categories 1 and 2 have only 7 teams, so their winner skips the quarterfinals
 * and waits in the semifinals. Categories 3 and 4 send their top 8.
 */
export const CATEGORY_RULES = {
  1: { teams: 7,  directToSemis: 1, toQuarters: 6, qualifiers: 7 },
  2: { teams: 7,  directToSemis: 1, toQuarters: 6, qualifiers: 7 },
  3: { teams: 12, directToSemis: 0, toQuarters: 8, qualifiers: 8 },
  4: { teams: 14, directToSemis: 0, toQuarters: 8, qualifiers: 8 },
}

export const CATEGORY_META = {
  1: { name: 'Categoría 1', short: '1ª', blurb: 'El cuadro de honor' },
  2: { name: 'Categoría 2', short: '2ª', blurb: 'Nivel avanzado' },
  3: { name: 'Categoría 3', short: '3ª', blurb: 'Nivel intermedio' },
  4: { name: 'Categoría 4', short: '4ª', blurb: 'La categoría más numerosa' },
}

export const ROUNDS = {
  quarterfinal: { label: 'Cuartos de final', short: 'Cuartos', order: 1 },
  semifinal:    { label: 'Semifinales',      short: 'Semis',   order: 2 },
  final:        { label: 'Final',            short: 'Final',   order: 3 },
}

/**
 * Where a team finishing in `rank` (1-based) of `level` ends up.
 * @returns {'semifinal'|'quarterfinal'|'eliminated'}
 */
export function qualificationFor(level, rank) {
  const rules = CATEGORY_RULES[level]
  if (!rules) return 'eliminated'
  if (rank <= rules.directToSemis) return 'semifinal'
  if (rank <= rules.directToSemis + rules.toQuarters) return 'quarterfinal'
  return 'eliminated'
}

/** Categories contested in a given encounter. The reduced tie is Cat 3 + 4 only. */
export function categoriesInEncounter(isReduced) {
  return isReduced ? [3, 4] : [1, 2, 3, 4]
}

/** How many matches a squad encounter should contain. */
export function matchesInEncounter(isReduced) {
  return isReduced ? 2 : 4
}

/** Total games and sets won by each side of a single match. */
export function tallyMatch(sets = []) {
  let s1 = 0, s2 = 0, g1 = 0, g2 = 0
  for (const set of sets) {
    const a = set.team1_score ?? 0
    const b = set.team2_score ?? 0
    g1 += a
    g2 += b
    if (a > b) s1++
    else if (b > a) s2++
  }
  return { sets1: s1, sets2: s2, games1: g1, games2: g2 }
}
