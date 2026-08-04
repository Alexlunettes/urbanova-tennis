/**
 * lib/tournament-data.js
 *
 * SOURCE OF TRUTH for the 2026 edition roster and group-stage fixtures.
 *
 * Extracted from the official planning spreadsheet
 * ("Torneo de tenis Urbanova III edición — Prueba Horarios").
 * Category membership was cross-validated two independent ways:
 *   1. the four roster columns of the sheet, and
 *   2. the connected components of the fixture graph (teams only ever play
 *      opponents inside their own category).
 * Both agree exactly: 7 / 7 / 12 / 14 teams = 40 teams, 80 players.
 *
 * This file is consumed by `scripts/seed.mjs`. Editing it and re-running the
 * seed is the supported way to correct a name or add a fixture before the
 * tournament starts. Once results are being entered, use the admin panel.
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
 * Slots from 00:00–06:00 belong to the following calendar day — the tournament
 * runs through the night, so "viernes 00:45" is really Saturday morning.
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
  { level: 1, key: 'cat-1', name: 'Categoría 1', short: '1ª', teamCount: 7 },
  { level: 2, key: 'cat-2', name: 'Categoría 2', short: '2ª', teamCount: 7 },
  { level: 3, key: 'cat-3', name: 'Categoría 3', short: '3ª', teamCount: 12 },
  { level: 4, key: 'cat-4', name: 'Categoría 4', short: '4ª', teamCount: 14 },
]

/**
 * The 40 teams.
 *
 * `id`      — stable slug, used to reference the team from FIXTURES below.
 * `name`    — short display label, matching how the pair is named on the
 *             official schedule (this is what people actually call them).
 * `players` — full names as written on the registration form.
 */
export const TEAMS = [
  // ─────────────────────────── CATEGORÍA 1 (7) ───────────────────────────
  { id: 'c1-romero-valero',    level: 1, name: 'Alejandro Romero / Raúl Valero',     players: ['Alejandro Romero López', 'Raúl Valero García'] },
  { id: 'c1-rosales-skarmeta', level: 1, name: 'Marthina Rosales / Claudio Skarmeta', players: ['Marthina Rosales', 'Claudio Skarmeta'] },
  { id: 'c1-guadalupe-garcia', level: 1, name: 'José Guadalupe / Aarón García',      players: ['José Ignacio Guadalupe Mellado', 'Aarón García Guerrero'] },
  { id: 'c1-garcia-soler',     level: 1, name: 'Eva García / Paco Soler',            players: ['Eva Mª García', 'Paco Soler'] },
  { id: 'c1-jaen-gil',         level: 1, name: 'Salva Jaén / José Manuel Gil',       players: ['Salvador Jaén Sánchez', 'José Manuel Gil Sabuco'] },
  { id: 'c1-roman-jaen',       level: 1, name: 'Javier Román / Irene Jaén',          players: ['Javier Román', 'Irene Jaén'] },
  { id: 'c1-rocio-carla',      level: 1, name: 'Rocío / Carla Verdú',                players: ['Rocío', 'Carla Verdú'] },

  // ─────────────────────────── CATEGORÍA 2 (7) ───────────────────────────
  { id: 'c2-jose-pau',         level: 2, name: 'José Martínez / Pau',                players: ['José Martínez', 'Pau'] },
  { id: 'c2-benito-roman',     level: 2, name: 'Miguel Ángel Benito / Álvaro Román', players: ['Miguel Ángel Benito', 'Álvaro Román'] },
  { id: 'c2-cordero-melero',   level: 2, name: 'Valen Cordero / Mario Melero',       players: ['Valentín Cordero Fraile', 'Mario Melero'] },
  { id: 'c2-marin-herrerias',  level: 2, name: 'Javi Marín / Christian Herrerías',   players: ['Javi Marín', 'Christian Herrerías'] },
  { id: 'c2-toro-martinez',    level: 2, name: 'Pedro Toro / Vicente Martínez',      players: ['Pedro Toro Belda', 'Vicente Martínez Gilabert'] },
  { id: 'c2-roig-dubois',      level: 2, name: 'Héctor Roig / Alexander Dubois',     players: ['Héctor Roig', 'Alexander Dubois'] },
  { id: 'c2-pascual-blanco',   level: 2, name: 'Pascual Blanco',                     players: ['Pascual Blanco', 'Pascual Blanco'] },

  // ─────────────────────────── CATEGORÍA 3 (12) ──────────────────────────
  { id: 'c3-dubois-deloro',    level: 3, name: 'Joaquín Dubois / Manu del Oro',      players: ['Joaquín Dubois', 'Manu del Oro'] },
  { id: 'c3-fayos-sanchez',    level: 3, name: 'José María Fayos / Mario Sánchez',   players: ['José María Fayos Mauricio', 'Mario Sánchez Puente'] },
  { id: 'c3-andujar-gonzalez', level: 3, name: 'José Andújar / Rubén González',      players: ['José Andújar Ballester', 'Rubén González Javaloyes'] },
  { id: 'c3-moreno-sirvent',   level: 3, name: 'David Moreno / Alejandra Sirvent',   players: ['David Moreno López', 'Alejandra Sirvent Gozálvez'] },
  { id: 'c3-lledo-roig',       level: 3, name: 'Juan Carlos Lledó / Carlos Roig',    players: ['Juan Carlos Lledó', 'Carlos Roig'] },
  { id: 'c3-lopez-martinez',   level: 3, name: 'Daniel López / Pablo Martínez',      players: ['Daniel López Lozano', 'Pablo Martínez Piqueras'] },
  { id: 'c3-perez-martinez',   level: 3, name: 'Mario Pérez / Bea Martínez',         players: ['Mario Pérez López', 'Beatriz Martínez Guilabert'] },
  { id: 'c3-calvente-martin',  level: 3, name: 'Martín Calvente / Diego Martín',     players: ['Martín Calvente Zamora', 'Diego Martín Calvente'] },
  { id: 'c3-puente-abia',      level: 3, name: 'Isabel Puente / Mª Teresa Abia',     players: ['Isabel Puente', 'María Teresa Abia'] },
  { id: 'c3-romero-esteban',   level: 3, name: 'Juanjo Romero / Domingo Esteban',    players: ['Juanjo Romero Castillo', 'Domingo Esteban'] },
  { id: 'c3-roig-lledo',       level: 3, name: 'Rodrigo Roig / Simón Lledó',         players: ['Rodrigo Roig De Juan', 'Simón Lledó Rocamora'] },
  { id: 'c3-marti-marti',      level: 3, name: 'Iñaki Martí / Álvaro Martí',         players: ['Iñaki Martí Rodrigo', 'Álvaro Martí Sevillano'] },

  // ─────────────────────────── CATEGORÍA 4 (14) ──────────────────────────
  { id: 'c4-kardakaris-ubeda', level: 4, name: 'Nikola Úbeda / Francisco Úbeda',     players: ['Nikola Kardakaris Úbeda', 'Francisco Úbeda Touati'] },
  { id: 'c4-carracedo',        level: 4, name: 'Rubén Carracedo / Rubén Carracedo',  players: ['Rubén Carracedo Manzanares', 'Rubén Carracedo Morales'] },
  { id: 'c4-garrido-baron',    level: 4, name: 'Gonzalo Garrido / Daniel Barón',     players: ['Gonzalo Garrido Gómez', 'Daniel Barón Iglesias'] },
  { id: 'c4-manresa-ortiz',    level: 4, name: 'Fermín Manresa / Luis Ortiz',        players: ['Fermín Manresa', 'Luis Ortiz'] },
  { id: 'c4-conesa-benito',    level: 4, name: 'Pablo Conesa / Jaime Benito',        players: ['Pablo Conesa Morales', 'Jaime Benito Gutiérrez'] },
  { id: 'c4-jara-jara',        level: 4, name: 'Javier Jara / Santiago Jara',        players: ['Javier Jara Herrero', 'Santiago Jara Herrero'] },
  { id: 'c4-mateu-navarro',    level: 4, name: 'Javier Mateu / Damián Navarro',      players: ['Javier Mateu Muñoz', 'Damián Navarro Manzano'] },
  { id: 'c4-pastor-pastor',    level: 4, name: 'Marco Pastor / Manuel Pastor',       players: ['Marco Pastor Ferrández', 'Manuel Pastor Magro'] },
  { id: 'c4-espana-orts',      level: 4, name: 'Noel España / Pablo Orts',           players: ['Noel España Romero', 'Pablo Orts'] },
  { id: 'c4-cordoba-calafat',  level: 4, name: 'Sergio Córdoba / Izan Calafat',      players: ['Sergio Córdoba Espinosa', 'Izan Calafat Faraldos'] },
  { id: 'c4-lledo-lledo',      level: 4, name: 'Luis Lledó / Mateo Lledó',           players: ['Luis Lledó', 'Mateo Lledó'] },
  { id: 'c4-martinez-albaladejo', level: 4, name: 'Gonzalo Martínez / Adrián Albaladejo', players: ['Gonzalo Martínez', 'Adrián Albaladejo'] },
  { id: 'c4-garcia-serrano',   level: 4, name: 'Daniel García / Marcos Serrano',     players: ['Daniel García', 'Marcos Serrano'] },
  { id: 'c4-sala-aldea',       level: 4, name: 'Javier Sala / Lucía Aldea',          players: ['Javier Sala', 'Lucía Aldea'] },
]

/**
 * Group-stage fixtures, exactly as drawn on the official schedule.
 *
 * This is a Champions-League style draw: teams play a limited set of opponents
 * (3–5 each), NOT a full round robin. Position in the category table is what
 * decides qualification.
 *
 * [dayKey, 'HH:MM', court, team1, team2]
 * `day: null` means the fixture is drawn but not yet scheduled.
 */
export const FIXTURES = [
  // ══════════════════ JUEVES 6 · PISTA 1 ══════════════════
  ['jue', '17:15', '1', 'c3-romero-esteban',      'c3-roig-lledo'],
  ['jue', '18:00', '1', 'c4-martinez-albaladejo', 'c4-sala-aldea'],
  ['jue', '18:45', '1', 'c2-marin-herrerias',     'c2-toro-martinez'],
  ['jue', '19:30', '1', 'c4-pastor-pastor',       'c4-sala-aldea'],
  ['jue', '20:15', '1', 'c2-cordero-melero',      'c2-marin-herrerias'],
  ['jue', '21:00', '1', 'c1-roman-jaen',          'c1-romero-valero'],
  ['jue', '21:45', '1', 'c1-rosales-skarmeta',    'c1-jaen-gil'],
  ['jue', '22:30', '1', 'c1-romero-valero',       'c1-garcia-soler'],
  ['jue', '23:15', '1', 'c2-toro-martinez',       'c2-roig-dubois'],

  // ══════════════════ JUEVES 6 · PISTA 2 ══════════════════
  ['jue', '18:00', '2', 'c4-pastor-pastor',       'c4-lledo-lledo'],
  ['jue', '18:45', '2', 'c4-kardakaris-ubeda',    'c4-garrido-baron'],
  ['jue', '19:30', '2', 'c3-lledo-roig',          'c3-lopez-martinez'],
  ['jue', '20:15', '2', 'c3-puente-abia',         'c3-romero-esteban'],
  ['jue', '21:00', '2', 'c3-lledo-roig',          'c3-marti-marti'],
  ['jue', '21:45', '2', 'c4-cordoba-calafat',     'c4-martinez-albaladejo'],
  ['jue', '22:30', '2', 'c3-lledo-roig',          'c3-perez-martinez'],
  ['jue', '23:15', '2', 'c4-conesa-benito',       'c4-mateu-navarro'],

  // ══════════════════ VIERNES 7 · PISTA 1 ══════════════════
  ['vie', '08:00', '1', 'c4-kardakaris-ubeda',    'c4-carracedo'],
  ['vie', '08:45', '1', 'c2-roig-dubois',         'c2-pascual-blanco'],
  ['vie', '09:30', '1', 'c3-andujar-gonzalez',    'c3-moreno-sirvent'],
  ['vie', '10:15', '1', 'c4-conesa-benito',       'c4-jara-jara'],
  ['vie', '11:00', '1', 'c4-pastor-pastor',       'c4-cordoba-calafat'],
  ['vie', '11:45', '1', 'c4-jara-jara',           'c4-espana-orts'],
  ['vie', '12:30', '1', 'c2-pascual-blanco',      'c2-marin-herrerias'],
  ['vie', '13:15', '1', 'c1-rosales-skarmeta',    'c1-rocio-carla'],
  ['vie', '17:15', '1', 'c3-dubois-deloro',       'c3-andujar-gonzalez'],
  ['vie', '18:00', '1', 'c1-guadalupe-garcia',    'c1-rocio-carla'],
  ['vie', '18:45', '1', 'c2-benito-roman',        'c2-roig-dubois'],
  ['vie', '19:30', '1', 'c1-romero-valero',       'c1-guadalupe-garcia'],
  ['vie', '20:15', '1', 'c1-garcia-soler',        'c1-rocio-carla'],
  ['vie', '21:00', '1', 'c1-jaen-gil',            'c1-roman-jaen'],
  ['vie', '21:45', '1', 'c1-rosales-skarmeta',    'c1-garcia-soler'],
  ['vie', '23:15', '1', 'c2-benito-roman',        'c2-cordero-melero'],
  ['vie', '00:00', '1', 'c1-guadalupe-garcia',    'c1-roman-jaen'],
  ['vie', '00:45', '1', 'c2-cordero-melero',      'c2-roig-dubois'],
  ['vie', '01:15', '1', 'c1-jaen-gil',            'c1-rocio-carla'],

  // ══════════════════ VIERNES 7 · PISTA 2 ══════════════════
  ['vie', '08:00', '2', 'c4-martinez-albaladejo', 'c4-lledo-lledo'],
  ['vie', '08:45', '2', 'c4-garrido-baron',       'c4-jara-jara'],
  ['vie', '09:30', '2', 'c4-kardakaris-ubeda',    'c4-garcia-serrano'],
  ['vie', '10:15', '2', 'c4-garcia-serrano',      'c4-sala-aldea'],
  ['vie', '11:45', '2', 'c4-cordoba-calafat',     'c4-garcia-serrano'],
  ['vie', '12:30', '2', 'c4-lledo-lledo',         'c4-carracedo'],
  ['vie', '17:15', '2', 'c4-mateu-navarro',       'c4-espana-orts'],
  ['vie', '18:00', '2', 'c3-lopez-martinez',      'c3-perez-martinez'],
  ['vie', '18:45', '2', 'c3-lopez-martinez',      'c3-marti-marti'],
  ['vie', '19:30', '2', 'c4-conesa-benito',       'c4-espana-orts'],
  ['vie', '20:15', '2', 'c3-perez-martinez',      'c3-marti-marti'],
  ['vie', '21:00', '2', 'c3-dubois-deloro',       'c3-moreno-sirvent'],
  ['vie', '21:45', '2', 'c3-calvente-martin',     'c3-puente-abia'],
  ['vie', '22:30', '2', 'c3-fayos-sanchez',       'c3-moreno-sirvent'],
  ['vie', '23:15', '2', 'c4-manresa-ortiz',       'c4-mateu-navarro'],
  ['vie', '00:00', '2', 'c3-puente-abia',         'c3-roig-lledo'],
  ['vie', '00:45', '2', 'c3-calvente-martin',     'c3-roig-lledo'],
  ['vie', '01:15', '2', 'c3-fayos-sanchez',       'c3-andujar-gonzalez'],

  // ══════════════════ SÁBADO 8 · PISTA 1 ══════════════════
  ['sab', '08:15', '1', 'c2-jose-pau',            'c2-benito-roman'],
  ['sab', '09:00', '1', 'c2-pascual-blanco',      'c2-jose-pau'],
  ['sab', '09:45', '1', 'c2-jose-pau',            'c2-toro-martinez'],

  // ══════════════════ SÁBADO 8 · PISTA 2 ══════════════════
  ['sab', '08:45', '2', 'c4-carracedo',           'c4-manresa-ortiz'],
  ['sab', '09:30', '2', 'c3-dubois-deloro',       'c3-fayos-sanchez'],
  ['sab', '09:45', '2', 'c4-garrido-baron',       'c4-manresa-ortiz'],

  // ══════════ DRAWN BUT NOT YET SCHEDULED ══════════
  // Listed in the "partidos pendientes" column of the sheet with no slot.
  [null, null, null, 'c3-calvente-martin',        'c3-romero-esteban'],
  [null, null, null, 'c4-sala-aldea',             'c4-carracedo'],
]

/** Convenience lookup: team slug → team object. */
export const TEAMS_BY_ID = Object.fromEntries(TEAMS.map(t => [t.id, t]))
