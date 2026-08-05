/**
 * lib/tournament.js
 *
 * The rules of the Torneo Tenis Urbanova 2026, in one place.
 * Pure functions only — imported by server components and the admin UI alike.
 *
 * ── SHAPE OF THE COMPETITION ─────────────────────────────────────────────
 *
 *  1. GROUP STAGE — each division separately, every match a single set.
 *
 *  2. QUARTERFINALS — still contested by INDIVIDUAL PAIRS, division by
 *     division. Best of 2 sets, super tiebreak if they split.
 *     Divisions 1 and 2 send their group winner straight through, so they
 *     play only three quarterfinals; divisions 3 and 4 play four.
 *     Either way each division ends up with FOUR surviving pairs.
 *
 *  3. SQUADS — formed only once the quarterfinals are done. The four
 *     survivors of each division are ranked, and the squads are built by
 *     rank: the best remaining pair of every division forms Escuadra 1, the
 *     second-best of every division forms Escuadra 2, and so on.
 *
 *  4. SEMIFINALS AND FINAL — squad versus squad, four matches per tie (one
 *     per division). The squad winning the majority advances.
 */

export const LEVELS = [1, 2, 3, 4]

/** Group-stage matches are a single set; everything from the quarterfinals on
 *  is best of two sets with a super tiebreak as decider. */
export const MATCH_FORMAT = {
  group_stage:  { sets: 1, superTiebreak: false, label: '1 set' },
  quarterfinal: { sets: 2, superTiebreak: true,  label: 'Al mejor de 2 sets · super tiebreak' },
  semifinal:    { sets: 2, superTiebreak: true,  label: 'Al mejor de 2 sets · super tiebreak' },
  final:        { sets: 2, superTiebreak: true,  label: 'Al mejor de 2 sets · super tiebreak' },
}

export function formatFor(stage) {
  return MATCH_FORMAT[stage] ?? MATCH_FORMAT.group_stage
}

/**
 * Per-division shape.
 *
 * `groups`         — how many group tables the division is split into
 * `qualifiers`     — pairs that reach the quarterfinal round
 * `byes`           — pairs that skip the quarterfinals (the group winner)
 * `quarterfinals`  — number of quarterfinal ties
 * `survivors`      — pairs left once the quarterfinals are done (always 4)
 * `fourMatchPair`  — the one pair that plays an extra group match, if any
 */
export const CATEGORY_RULES = {
  1: {
    teams: 7,  groups: 1, qualifiers: 6, byes: 1, quarterfinals: 3, survivors: 4,
    fourMatchPair: 'Rocío / Carla Verdú',
  },
  2: {
    teams: 7,  groups: 1, qualifiers: 6, byes: 1, quarterfinals: 3, survivors: 4,
    fourMatchPair: 'Héctor Roig / Alexander Dubois',
  },
  3: {
    teams: 12, groups: 3, qualifiers: 8, byes: 0, quarterfinals: 4, survivors: 4,
    fourMatchPair: null,
  },
  4: {
    teams: 14, groups: 1, qualifiers: 8, byes: 0, quarterfinals: 4, survivors: 4,
    fourMatchPair: null,
  },
}

export const CATEGORY_META = {
  1: { name: 'Primera División', short: '1ª', blurb: 'Siete parejas, un solo grupo' },
  2: { name: 'Segunda División', short: '2ª', blurb: 'Siete parejas, un solo grupo' },
  3: { name: 'Tercera División', short: '3ª', blurb: 'Doce parejas en tres grupos' },
  4: { name: 'Cuarta División',  short: '4ª', blurb: 'Catorce parejas, un solo grupo' },
}

/**
 * Division colours, matching the printed schedule sheets so the site and the
 * paper on the fence agree: 1ª cyan, 2ª green, 3ª yellow, 4ª purple.
 * Muted here to sit inside the site's palette rather than shout over it.
 */
export const CATEGORY_COLOR = {
  1: {
    dot:   'bg-cyan-500',
    chip:  'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-400/12 dark:text-cyan-300 dark:border-cyan-400/25',
    rail:  'bg-cyan-500',
  },
  2: {
    dot:   'bg-emerald-500',
    chip:  'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-400/12 dark:text-emerald-300 dark:border-emerald-400/25',
    rail:  'bg-emerald-500',
  },
  3: {
    dot:   'bg-amber-500',
    chip:  'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-400/12 dark:text-amber-300 dark:border-amber-400/25',
    rail:  'bg-amber-500',
  },
  4: {
    dot:   'bg-violet-500',
    chip:  'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-400/12 dark:text-violet-300 dark:border-violet-400/25',
    rail:  'bg-violet-500',
  },
}

export const ROUNDS = {
  quarterfinal: { label: 'Cuartos de final', short: 'Cuartos', order: 1, bySquad: false },
  semifinal:    { label: 'Semifinales',      short: 'Semis',   order: 2, bySquad: true  },
  final:        { label: 'Final',            short: 'Final',   order: 3, bySquad: true  },
}

/** Rounds contested by squads rather than by individual pairs. */
export const SQUAD_ROUNDS = ['semifinal', 'final']

/**
 * Where a pair finishing `rank` in its division's table ends up.
 * For division 3 `rank` is the position in the combined qualification order,
 * not the position inside its own group of four.
 * @returns {'semifinal'|'quarterfinal'|'eliminated'}
 */
export function qualificationFor(level, rank) {
  const rules = CATEGORY_RULES[level]
  if (!rules) return 'eliminated'
  if (rank <= rules.byes) return 'semifinal'
  if (rank <= rules.byes + rules.qualifiers) return 'quarterfinal'
  return 'eliminated'
}

/**
 * Quarterfinal pairings, expressed as qualification ranks.
 *
 * Divisions 1 and 2: the winner rests, the rest meet inside out — 2v7, 3v6,
 * 4v5. Division 4: the usual 1v8 … 4v5. Division 3 is seeded from its three
 * group tables instead, so it is handled by `division3Quarterfinals`.
 */
export const QUARTERFINAL_SEEDING = {
  1: [[2, 7], [3, 6], [4, 5]],
  2: [[2, 7], [3, 6], [4, 5]],
  4: [[1, 8], [2, 7], [3, 6], [4, 5]],
}

/**
 * Division 3's quarterfinal draw, from the three group tables.
 *
 * The published rule:
 *   · the two best group winners meet the two qualifying third-placed pairs
 *   · the remaining group winner meets the weakest runner-up
 *   · the two other runners-up meet each other
 *
 * @param {Array} winners  the three group winners, best first
 * @param {Array} runners  the three runners-up, best first
 * @param {Array} thirds   the two qualifying third-placed pairs, best first
 * @returns {Array<[any, any]>} four ties
 */
export function division3Quarterfinals(winners = [], runners = [], thirds = []) {
  const [w1, w2, w3] = winners
  const [r1, r2, r3] = runners      // r3 is the weakest runner-up
  const [t1, t2]     = thirds

  return [
    [w1, t2],   // best winner draws the weaker qualifying third
    [w2, t1],
    [w3, r3],   // remaining winner draws the weakest runner-up
    [r1, r2],   // the other two runners-up meet
  ]
}

/** Categories contested in a squad tie — always all four from the semis on. */
export function categoriesInEncounter() {
  return LEVELS
}

/** How many matches a squad tie contains. */
export function matchesInEncounter() {
  return LEVELS.length
}

/** Sets and games won by each side of a single match. */
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
