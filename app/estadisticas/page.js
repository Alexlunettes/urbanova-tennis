import { getPlayerStats } from '@/lib/player-stats'

export const revalidate = 60 // ISR: re-fetch at most every 60 seconds

const LEVEL_LABELS = {
  1: 'NIVEL 1 — Semiprofesional',
  2: 'NIVEL 2 — Amateur Avanzado',
  3: 'NIVEL 3 — Amateur',
}

function StatsTable({ players }) {
  if (players.length === 0) {
    return (
      <p className="text-gray-400 font-lato italic text-sm py-4">
        Las estadísticas aparecen cuando se registran los primeros resultados.
      </p>
    )
  }

  return (
    // overflow-x-auto + min-w makes this table scroll horizontally on small phones
    <div className="overflow-x-auto rounded-xl border border-sage/20">
      <table className="w-full text-sm font-lato min-w-[520px]">
        <thead className="bg-sage text-white">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Jugador</th>
            <th className="px-3 py-3 text-center font-medium" title="Partidos Jugados">PJ</th>
            <th className="px-3 py-3 text-center font-medium" title="Partidos Ganados">PG</th>
            <th className="px-3 py-3 text-center font-medium" title="Partidos Perdidos">PP</th>
            <th className="px-3 py-3 text-center font-medium">Sets G/P</th>
            <th className="px-3 py-3 text-center font-medium">Games G/P</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr
              key={p.id}
              className={`${i % 2 === 0 ? 'bg-white' : 'bg-sage/5'} hover:bg-gold/5 transition-colors`}
            >
              <td className="px-4 py-3 font-medium text-gray-800">
                {i === 0 && <span className="mr-1">🏆</span>}
                {p.name}
              </td>
              <td className="px-3 py-3 text-center text-gray-600">{p.matchesPlayed}</td>
              <td className="px-3 py-3 text-center font-bold text-sage">{p.matchesWon}</td>
              <td className="px-3 py-3 text-center text-gray-500">{p.matchesPlayed - p.matchesWon}</td>
              <td className="px-3 py-3 text-center text-gray-600">{p.setsWon}/{p.setsLost}</td>
              <td className="px-3 py-3 text-center text-gray-600">{p.gamesWon}/{p.gamesLost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function Estadisticas() {
  const statsByLevel = await getPlayerStats()
  const hasData = [1, 2, 3].some(l => statsByLevel[l].length > 0)

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="font-bebas text-5xl text-sage tracking-widest mb-2">ESTADÍSTICAS</h1>
      <p className="font-lato text-gray-500 mb-10">
        Rendimiento individual durante el torneo. PJ = partidos jugados, PG = ganados, PP = perdidos.
      </p>

      {!hasData ? (
        <div className="text-center py-16 border border-sage/20 rounded-xl">
          <p className="font-bebas text-2xl text-sage tracking-wide mb-2">TORNEO AÚN NO COMENZADO</p>
          <p className="font-lato text-sm text-gray-400">
            Las estadísticas aparecen automáticamente al registrar los primeros partidos.
          </p>
        </div>
      ) : (
        [1, 2, 3].map(level => (
          <div key={level} className="mb-12">
            <h2 className="font-bebas text-3xl text-gold tracking-widest mb-4">
              {LEVEL_LABELS[level]}
            </h2>
            <StatsTable players={statsByLevel[level]} />
          </div>
        ))
      )}
    </div>
  )
}