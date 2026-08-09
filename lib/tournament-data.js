/**
 * lib/tournament-data.js
 *
 * SOURCE OF TRUTH for the 2026 edition roster and group-stage fixtures.
 *
 * Taken from the four published schedule sheets, each marked DEFINITIVO:
 *   · Partidos Jueves
 *   · Partidos Viernes Mañana
 *   · Partidos Viernes Tarde
 *   · Partidos Sábado
 *
 * Those sheets supersede the earlier planning spreadsheet. Two pairs changed
 * partner between the two versions — see PAIR CHANGES below.
 *
 * Category membership was cross-validated two ways: the colour coding on the
 * sheets (cyan = 1ª, green = 2ª, yellow = 3ª, purple = 4ª) and the connected
 * components of the fixture graph, since pairs only ever meet opponents inside
 * their own category. Both agree: 7 / 7 / 12 / 14 = 40 pairs, 80 players.
 *
 * This file is consumed by `scripts/seed.mjs`. Editing it and re-seeding is
 * the supported way to correct data before play starts; once results are being
 * recorded, use the admin panel.
 *
 * ── PAIR CHANGES vs. the earlier planning sheet ──────────────────────────
 *   3ª  Mario Pérez:  Beatriz Martínez  →  Sergio Saura
 *   4ª  Javier Mateu: Damián Navarro    →  David Ibernón
 */

/** Tournament days. August 2026: the 6th is a Thursday. Europe/Madrid = UTC+2. */
export const TOURNAMENT_DAYS = {
  jue: '2026-08-06',
  vie: '2026-08-07',
  sab: '2026-08-08',
  dom: '2026-08-09',
}

const TZ_OFFSET = '+02:00'

/**
 * Builds an ISO timestamp from a day key and a "HH:MM" wall-clock time.
 * Slots between 00:00 and 06:00 belong to the following calendar day — the
 * tournament runs through the night, so "viernes 00:45" is Saturday morning.
 */
export function slotToISO(dayKey, time) {
  const [h] = time.split(':').map(Number)
  let date = TOURNAMENT_DAYS[dayKey]
  if (h < 6) {
    const d = new Date(`${date}T12:00:00Z`)
    d.setUTCDate(d.getUTCDate() + 1)
    date = d.toISOString().slice(0, 10)
  }
  return `${date}T${time}:00${TZ_OFFSET}`
}

/**
 * The four categories.
 * `key` is the stable slug used in URLs; `level` is the integer stored in the
 * database (the column is still called `level` for backwards compatibility).
 */
export const CATEGORIES = [
  { level: 1, key: 'cat-1', name: 'Primera División', short: '1ª', teamCount: 7  },
  { level: 2, key: 'cat-2', name: 'Segunda División', short: '2ª', teamCount: 7  },
  { level: 3, key: 'cat-3', name: 'Tercera División', short: '3ª', teamCount: 12 },
  { level: 4, key: 'cat-4', name: 'Cuarta División', short: '4ª', teamCount: 14 },
]

/**
 * The 40 pairs.
 *
 * `id`      — stable slug, used to reference the pair from FIXTURES below.
 * `name`    — short display label, matching how the pair is written on the
 *             official sheets (this is what people actually call them).
 * `players` — full names as given on the registration form.
 */
export const TEAMS = [
  // ─────────────────────────── CATEGORÍA 1 (7) ───────────────────────────
  { id: 'c1-romero-valero',    level: 1, name: 'Alejandro Romero / Raúl Valero',      players: ['Alejandro Romero López', 'Raúl Valero García'] },
  { id: 'c1-rosales-skarmeta', level: 1, name: 'Marthina Rosales / Claudio Skarmeta', players: ['Marthina Rosales', 'Claudio Skarmeta'] },
  { id: 'c1-guadalupe-garcia', level: 1, name: 'José Guadalupe / Aarón García',       players: ['José Ignacio Guadalupe Mellado', 'Aarón García Guerrero'] },
  { id: 'c1-garcia-soler',     level: 1, name: 'Eva García / Paco Soler',             players: ['Eva Mª García', 'Paco Soler'] },
  { id: 'c1-jaen-gil',         level: 1, name: 'Salva Jaén / José Manuel Gil',        players: ['Salvador Jaén Sánchez', 'José Manuel Gil Sabuco'] },
  { id: 'c1-roman-jaen',       level: 1, name: 'Javier Román / Irene Jaén',           players: ['Javier Román', 'Irene Jaén'] },
  { id: 'c1-rocio-carla',      level: 1, name: 'Rocío Navarro / Carla Verdú',         players: ['Rocío Navarro', 'Carla Verdú'] },

  // ─────────────────────────── CATEGORÍA 2 (7) ───────────────────────────
  { id: 'c2-jose-pau',         level: 2, name: 'José Martínez / Pau Lledó',           players: ['José Martínez', 'Pau Lledó'] },
  { id: 'c2-benito-roman',     level: 2, name: 'Miguel Ángel Benito / Álvaro Román',  players: ['Miguel Ángel Benito', 'Álvaro Román'] },
  { id: 'c2-cordero-melero',   level: 2, name: 'Valen Fraile / Mario Melero',         players: ['Valen Fraile', 'Mario Melero'] },
  { id: 'c2-marin-herrerias',  level: 2, name: 'Javi Marín / Christian Herrerías',    players: ['Javi Marín', 'Christian Herrerías'] },
  { id: 'c2-toro-martinez',    level: 2, name: 'Pedro Toro / Vicente Martínez',       players: ['Pedro Toro Belda', 'Vicente Martínez Gilabert'] },
  { id: 'c2-roig-dubois',      level: 2, name: 'Héctor Roig / Alexander Dubois',      players: ['Héctor Roig', 'Alexander Dubois'] },
  { id: 'c2-pascual-blanco',   level: 2, name: 'Pascual Blanco / Miguel Blanco',      players: ['Pascual Blanco', 'Miguel Blanco'] },

  // ─────────────────────────── CATEGORÍA 3 (12) ──────────────────────────
  { id: 'c3-dubois-deloro',    level: 3, name: 'Joaquín Dubois / Manu del Oro',       players: ['Joaquín Dubois', 'Manu del Oro'] },
  { id: 'c3-fayos-sanchez',    level: 3, name: 'José María Fayos / Mario Sánchez',    players: ['José María Fayos Mauricio', 'Mario Sánchez Puente'] },
  { id: 'c3-andujar-gonzalez', level: 3, name: 'José Andújar / Rubén González',       players: ['José Andújar Ballester', 'Rubén González Javaloyes'] },
  { id: 'c3-moreno-sirvent',   level: 3, name: 'David Moreno / Alejandra Sirvent',    players: ['David Moreno López', 'Alejandra Sirvent Gozálvez'] },
  { id: 'c3-lledo-roig',       level: 3, name: 'Juan Carlos Lledó / Carlos Roig',     players: ['Juan Carlos Lledó', 'Carlos Roig'] },
  { id: 'c3-lopez-martinez',   level: 3, name: 'Dani López / Pablo Martínez',         players: ['Daniel López Lozano', 'Pablo Martínez Piqueras'] },
  { id: 'c3-perez-saura',      level: 3, name: 'Mario Pérez / Sergio Saura',          players: ['Mario Pérez López', 'Sergio Saura'] },
  { id: 'c3-calvente-martin',  level: 3, name: 'Martín Calvente / Diego Martín',      players: ['Martín Calvente Zamora', 'Diego Martín Calvente'] },
  { id: 'c3-puente-abia',      level: 3, name: 'Isabel Puente / Mª Teresa Abia',      players: ['Isabel Puente', 'María Teresa Abia'] },
  { id: 'c3-romero-esteban',   level: 3, name: 'Juanjo Romero / Domingo Esteban',     players: ['Juanjo Romero Castillo', 'Domingo Esteban'] },
  { id: 'c3-roig-lledo',       level: 3, name: 'Rodrigo Roig / Simón Lledó',          players: ['Rodrigo Roig De Juan', 'Simón Lledó Rocamora'] },
  { id: 'c3-marti-marti',      level: 3, name: 'Iñaki Martí / Álvaro Martí',          players: ['Iñaki Martí Rodrigo', 'Álvaro Martí Sevillano'] },

  // ─────────────────────────── CATEGORÍA 4 (14) ──────────────────────────
  { id: 'c4-ubeda-ubeda',      level: 4, name: 'Nikola Úbeda / Francisco Úbeda',      players: ['Nikola Kardakaris Úbeda', 'Francisco Úbeda Touati'] },
  { id: 'c4-carracedo',        level: 4, name: 'Rubén Carracedo / Rubén Carracedo',   players: ['Rubén Carracedo Manzanares', 'Rubén Carracedo Morales'] },
  { id: 'c4-garrido-baron',    level: 4, name: 'Gonzalo Garrido / Daniel Barón',      players: ['Gonzalo Garrido Gómez', 'Daniel Barón Iglesias'] },
  { id: 'c4-manresa-ortiz',    level: 4, name: 'Fermín Manresa / Luis Ortiz',         players: ['Fermín Manresa', 'Luis Ortiz'] },
  { id: 'c4-conesa-benito',    level: 4, name: 'Pablo Conesa / Jaime Benito',         players: ['Pablo Conesa Morales', 'Jaime Benito Gutiérrez'] },
  { id: 'c4-jara-jara',        level: 4, name: 'Javier Jara / Santiago Jara',         players: ['Javier Jara Herrero', 'Santiago Jara Herrero'] },
  { id: 'c4-mateu-ibernon',    level: 4, name: 'Javier Mateu / David Ibernón',        players: ['Javier Mateu Muñoz', 'David Ibernón'] },
  { id: 'c4-pastor-pastor',    level: 4, name: 'Marco Pastor / Manuel Pastor',        players: ['Marco Pastor Ferrández', 'Manuel Pastor Magro'] },
  { id: 'c4-espana-sempere',   level: 4, name: 'Noel España / Miguel Sempere',        players: ['Noel España Romero', 'Miguel Sempere'] },
  { id: 'c4-cordoba-calafat',  level: 4, name: 'Sergio Córdoba / Izan Calafat',       players: ['Sergio Córdoba Espinosa', 'Izan Calafat Faraldos'] },
  { id: 'c4-lledo-lledo',      level: 4, name: 'Luis Lledó / Mateo Lledó',            players: ['Luis Lledó', 'Mateo Lledó'] },
  { id: 'c4-martinez-albaladejo', level: 4, name: 'Gonzalo Martínez / Adrián Albaladejo', players: ['Gonzalo Martínez', 'Adrián Albaladejo'] },
  { id: 'c4-garcia-serrano',   level: 4, name: 'Daniel García / Marcos Serrano',      players: ['Daniel García', 'Marcos Serrano'] },
  { id: 'c4-sala-aldea',       level: 4, name: 'Javier Sala / Lucía Aldea',           players: ['Javier Sala', 'Lucía Aldea'] },
]

/**
 * Group-stage fixtures, exactly as published on the DEFINITIVO sheets.
 *
 * A Champions-League style draw: pairs meet only a limited set of opponents
 * (3–5 each), not the whole category. Final table position decides who
 * qualifies.
 *
 * [dayKey, 'HH:MM', court, team1, team2]
 */
export const FIXTURES = [
  // ══════════════════ JUEVES 6 · PISTA 1 ══════════════════
  ['jue', '17:15', '1', 'c2-cordero-melero',      'c2-marin-herrerias'],
  ['jue', '18:00', '1', 'c4-martinez-albaladejo', 'c4-sala-aldea'],
  ['jue', '18:45', '1', 'c2-marin-herrerias',     'c2-toro-martinez'],
  ['jue', '19:30', '1', 'c3-lledo-roig',          'c3-lopez-martinez'],
  ['jue', '20:15', '1', 'c3-andujar-gonzalez',    'c3-moreno-sirvent'],
  ['jue', '21:00', '1', 'c1-romero-valero',       'c1-jaen-gil'],
  ['jue', '21:45', '1', 'c1-rosales-skarmeta',    'c1-roman-jaen'],
  ['jue', '22:30', '1', 'c1-garcia-soler',        'c1-romero-valero'],
  ['jue', '23:15', '1', 'c2-toro-martinez',       'c2-roig-dubois'],

  // ══════════════════ JUEVES 6 · PISTA 2 ══════════════════
  ['jue', '17:15', '2', 'c3-romero-esteban',      'c3-roig-lledo'],
  ['jue', '18:00', '2', 'c4-pastor-pastor',       'c4-lledo-lledo'],
  ['jue', '18:45', '2', 'c4-ubeda-ubeda',         'c4-garrido-baron'],
  ['jue', '19:30', '2', 'c4-pastor-pastor',       'c4-sala-aldea'],
  ['jue', '20:15', '2', 'c3-puente-abia',         'c3-romero-esteban'],
  ['jue', '21:00', '2', 'c3-lledo-roig',          'c3-marti-marti'],
  ['jue', '21:45', '2', 'c4-cordoba-calafat',     'c4-martinez-albaladejo'],
  ['jue', '22:30', '2', 'c3-lledo-roig',          'c3-perez-saura'],
  ['jue', '23:15', '2', 'c4-conesa-benito',       'c4-mateu-ibernon'],

  // ══════════════ VIERNES 7 MAÑANA · PISTA 1 ══════════════
  ['vie', '08:00', '1', 'c3-puente-abia',         'c3-roig-lledo'],
  ['vie', '08:45', '1', 'c2-roig-dubois',         'c2-pascual-blanco'],
  ['vie', '09:30', '1', 'c4-ubeda-ubeda',         'c4-garcia-serrano'],
  // The sheet reads "Javier Jara y Gonzalo Jara" here; every other line in the
  // category — and the registration form — has Javier Jara / Santiago Jara.
  ['vie', '10:15', '1', 'c4-conesa-benito',       'c4-jara-jara'],
  ['vie', '11:00', '1', 'c3-calvente-martin',     'c3-romero-esteban'],
  ['vie', '11:45', '1', 'c4-jara-jara',           'c4-espana-sempere'],
  ['vie', '12:30', '1', 'c2-pascual-blanco',      'c2-marin-herrerias'],

  // ══════════════ VIERNES 7 MAÑANA · PISTA 2 ══════════════
  ['vie', '08:00', '2', 'c4-ubeda-ubeda',         'c4-carracedo'],
  ['vie', '08:45', '2', 'c4-garrido-baron',       'c4-jara-jara'],
  ['vie', '09:30', '2', 'c3-dubois-deloro',       'c3-moreno-sirvent'],
  ['vie', '10:15', '2', 'c4-garcia-serrano',      'c4-sala-aldea'],
  ['vie', '11:00', '2', 'c4-pastor-pastor',       'c4-cordoba-calafat'],
  ['vie', '11:45', '2', 'c4-cordoba-calafat',     'c4-garcia-serrano'],
  ['vie', '12:30', '2', 'c3-fayos-sanchez',       'c3-moreno-sirvent'],

  // ══════════════ VIERNES 7 TARDE · PISTA 1 ═══════════════
  ['vie', '17:15', '1', 'c3-dubois-deloro',       'c3-andujar-gonzalez'],
  ['vie', '18:00', '1', 'c1-guadalupe-garcia',    'c1-rocio-carla'],
  ['vie', '18:45', '1', 'c2-benito-roman',        'c2-roig-dubois'],
  ['vie', '19:30', '1', 'c1-romero-valero',       'c1-guadalupe-garcia'],
  ['vie', '20:15', '1', 'c1-garcia-soler',        'c1-rocio-carla'],
  ['vie', '21:00', '1', 'c1-jaen-gil',            'c1-roman-jaen'],
  ['vie', '21:45', '1', 'c1-rosales-skarmeta',    'c1-garcia-soler'],
  ['vie', '22:30', '1', 'c1-rosales-skarmeta',    'c1-rocio-carla'],
  ['vie', '23:15', '1', 'c4-conesa-benito',       'c4-espana-sempere'],
  ['vie', '00:00', '1', 'c1-guadalupe-garcia',    'c1-roman-jaen'],
  ['vie', '00:45', '1', 'c2-cordero-melero',      'c2-roig-dubois'],
  ['vie', '01:15', '1', 'c1-jaen-gil',            'c1-rocio-carla'],

  // ══════════════ VIERNES 7 TARDE · PISTA 2 ═══════════════
  ['vie', '17:15', '2', 'c4-mateu-ibernon',       'c4-espana-sempere'],
  ['vie', '18:00', '2', 'c4-manresa-ortiz',       'c4-mateu-ibernon'],
  ['vie', '18:45', '2', 'c3-lopez-martinez',      'c3-marti-marti'],
  ['vie', '19:30', '2', 'c2-benito-roman',        'c2-cordero-melero'],
  ['vie', '20:15', '2', 'c3-perez-saura',         'c3-marti-marti'],
  // 21:00 on Pista 2 is empty on the definitive sheet — the Joaquín / Manu vs
  // David Moreno tie was brought forward to Friday morning.
  ['vie', '21:45', '2', 'c3-calvente-martin',     'c3-puente-abia'],
  ['vie', '22:30', '2', 'c4-lledo-lledo',         'c4-carracedo'],
  ['vie', '23:15', '2', 'c3-lopez-martinez',      'c3-perez-saura'],
  ['vie', '00:00', '2', 'c4-martinez-albaladejo', 'c4-lledo-lledo'],
  ['vie', '00:45', '2', 'c3-calvente-martin',     'c3-roig-lledo'],
  ['vie', '01:15', '2', 'c3-fayos-sanchez',       'c3-andujar-gonzalez'],

  // ══════════════════ SÁBADO 8 · PISTA 1 ══════════════════
  ['sab', '08:15', '1', 'c2-jose-pau',            'c2-benito-roman'],
  ['sab', '09:00', '1', 'c2-pascual-blanco',      'c2-jose-pau'],
  ['sab', '09:45', '1', 'c2-jose-pau',            'c2-toro-martinez'],

  // ══════════════════ SÁBADO 8 · PISTA 2 ══════════════════
  ['sab', '08:15', '2', 'c4-carracedo',           'c4-manresa-ortiz'],
  ['sab', '09:00', '2', 'c3-dubois-deloro',       'c3-fayos-sanchez'],
  ['sab', '09:45', '2', 'c4-garrido-baron',       'c4-manresa-ortiz'],
]

/**
 * Quarterfinal schedule, from the published "CUARTOS DE FINAL" sheet.
 *
 * Saturday evening running through into the early hours of Sunday, across
 * three courts — the two usual ones plus Urbanova 5-6 for the first two slots.
 *
 * Keyed by division, then by the slot number the draw assigns (see
 * QUARTERFINAL_SEEDING and DIVISION3_SEEDING in lib/tournament.js). Slots run
 * in seeding order, not in playing order, which is why the times below jump
 * around.
 */
export const QUARTERFINAL_SCHEDULE = {
  1: {
    1: { day: 'sab', time: '20:00', court: '1' },      // 2º vs 7º
    2: { day: 'sab', time: '21:30', court: '1' },      // 3º vs 6º
    3: { day: 'sab', time: '23:00', court: '1' },      // 4º vs 5º
  },
  2: {
    1: { day: 'sab', time: '18:30', court: '1' },      // 2º vs 7º
    2: { day: 'sab', time: '18:30', court: '2' },      // 3º vs 6º
    3: { day: 'sab', time: '20:00', court: '2' },      // 4º vs 5º
  },
  3: {
    1: { day: 'sab', time: '21:30', court: '2' },      // 1ºTOP2 vs 3ºTOP1
    2: { day: 'sab', time: '23:00', court: '2' },      // 3ºTOP2 vs 1ºTOP1
    3: { day: 'sab', time: '00:30', court: '1' },      // 2ºTOP1 vs 2ºTOP2
    4: { day: 'sab', time: '00:30', court: '2' },      // 1ºTOP3 vs 2ºTOP3
  },
  4: {
    1: { day: 'sab', time: '18:30', court: 'U5-6' },   // 1º vs 8º
    2: { day: 'sab', time: '17:00', court: '1' },      // 2º vs 7º
    // Slots 3 and 4 swapped courts on the day: the 3º-6º tie moved to
    // Urbanova 5-6 and the 4º-5º tie took Pista 2. Kick-off is unchanged.
    3: { day: 'sab', time: '17:00', court: 'U5-6' },   // 3º vs 6º
    4: { day: 'sab', time: '17:00', court: '2' },      // 4º vs 5º
  },
}

/** The scheduled slot for one quarterfinal, or null if it has no time yet. */
export function quarterfinalSlot(level, slot) {
  return QUARTERFINAL_SCHEDULE[level]?.[slot] ?? null
}

/**
 * Quarterfinals where the pair continuing to the semifinals is not the pair
 * that won the match.
 *
 * The organisers occasionally have to change who carries on after a tie is
 * already played. Rewriting the score would be the easy fix and the wrong one:
 * the match happened, and the table should keep saying so. So the result is
 * left exactly as it was recorded — winner included — and only the ONWARD
 * progression is redirected here.
 *
 * The pair named in `advances` takes over the winner's place in the division
 * COMPLETE, seeding included: they are ranked on the winner's performance in
 * that quarterfinal, not on their own, so the slot ends up wherever it would
 * have done and the rest of the division is unaffected.
 *
 * Both names are checked against the actual tie before the entry is applied
 * (see `advancingFromQuarterfinal` in lib/squads.js). If a re-draw ever moves
 * that slot to a different pair, the entry simply stops matching and the
 * ordinary winner advances, rather than a stale rule quietly promoting
 * somebody who is not even in the match.
 *
 * Nothing here is shown to the public: the bracket renders the recorded winner
 * in the quarterfinal and the continuing pair in the semifinal, with no label
 * or note attached to either.
 */
export const QUARTERFINAL_ADVANCEMENT = [
  {
    level:    1,
    slot:     2,
    winner:   'Rocío Navarro / Carla Verdú',
    advances: 'Salva Jaén / José Manuel Gil',
  },
]

/**
 * SEMIFINALS — Sunday morning.
 *
 * Both semifinals run in parallel, one per court: semifinal 1 (Equipo A v
 * Equipo D) on Pista 1 and semifinal 2 (Equipo B v Equipo C) on Pista 2. Within
 * each, the four divisions play one after another in the order below.
 *
 * Keyed by semifinal position (1 or 2), then by division.
 */
export const SEMIFINAL_SCHEDULE = {
  1: {   // Equipo A vs Equipo D — Pista 1
    4: { day: 'dom', time: '08:00', court: '1' },
    2: { day: 'dom', time: '09:30', court: '1' },
    1: { day: 'dom', time: '11:00', court: '1' },
    3: { day: 'dom', time: '12:30', court: '1' },
  },
  2: {   // Equipo B vs Equipo C — Pista 2
    4: { day: 'dom', time: '08:00', court: '2' },
    2: { day: 'dom', time: '09:30', court: '2' },
    1: { day: 'dom', time: '11:00', court: '2' },
    3: { day: 'dom', time: '12:30', court: '2' },
  },
}

/**
 * FINALS — Sunday evening, all four on Pista 1, one after another.
 * The 4ª opens, the 3ª closes the tournament.
 */
export const FINAL_SCHEDULE = {
  4: { day: 'dom', time: '17:00', court: '1' },
  2: { day: 'dom', time: '19:00', court: '1' },
  1: { day: 'dom', time: '21:00', court: '1' },
  3: { day: 'dom', time: '22:30', court: '1' },
}

/** The scheduled slot for one semifinal match (position 1|2, division). */
export function semifinalSlot(position, level) {
  return SEMIFINAL_SCHEDULE[position]?.[level] ?? null
}

/** The scheduled slot for one final match. */
export function finalSlot(level) {
  return FINAL_SCHEDULE[level] ?? null
}

/**
 * Group tables.
 *
 * Divisions 1, 2 and 4 play as a single table. Division 3's twelve pairs are
 * split into three groups of four, each a complete round robin — which is
 * exactly what the published fixtures describe, so these memberships are read
 * back out of the schedule rather than invented.
 */
export const GROUPS = [
  { id: 'g1',  level: 1, name: 'Primera División', teams: TEAMS.filter(t => t.level === 1).map(t => t.id) },
  { id: 'g2',  level: 2, name: 'Segunda División', teams: TEAMS.filter(t => t.level === 2).map(t => t.id) },

  { id: 'g3a', level: 3, name: 'Grupo A', teams: [
    'c3-dubois-deloro', 'c3-fayos-sanchez', 'c3-moreno-sirvent', 'c3-andujar-gonzalez',
  ] },
  { id: 'g3b', level: 3, name: 'Grupo B', teams: [
    'c3-lledo-roig', 'c3-perez-saura', 'c3-marti-marti', 'c3-lopez-martinez',
  ] },
  { id: 'g3c', level: 3, name: 'Grupo C', teams: [
    'c3-calvente-martin', 'c3-roig-lledo', 'c3-puente-abia', 'c3-romero-esteban',
  ] },

  { id: 'g4',  level: 4, name: 'Cuarta División', teams: TEAMS.filter(t => t.level === 4).map(t => t.id) },
]

/** Convenience lookup: pair slug → pair object. */
export const TEAMS_BY_ID = Object.fromEntries(TEAMS.map(t => [t.id, t]))

/** Convenience lookup: pair slug → the group it plays in. */
export const GROUP_BY_TEAM = Object.fromEntries(
  GROUPS.flatMap(g => g.teams.map(t => [t, g])),
)
