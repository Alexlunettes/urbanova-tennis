const RULES = [
  {
    title: 'Modalidad',
    body: 'Torneo de dobles. Todos los partidos se juegan al mejor de 3 sets. El tercer set, si se llega a él, se disputa como super tiebreak — primero en llegar a 10 puntos con diferencia de 2.',
  },
  {
    title: 'Fase de grupos',
    body: 'Cada nivel tiene su propia fase de grupos. Los equipos juegan todos contra todos dentro de su grupo. La clasificación se determina por victorias, diferencia de sets y diferencia de juegos.',
  },
  {
    title: 'Fase eliminatoria',
    body: 'Los clasificados de cada nivel forman súper-grupos (un equipo de nivel 1, uno de nivel 2, uno de nivel 3). Un súper-grupo se enfrenta a otro disputando tres partidos simultáneos. Gana el súper-grupo que conquiste al menos 2 de los 3.',
  },
  {
    title: 'Puntualidad',
    body: 'Es obligatorio estar listo para jugar en el horario asignado. Un retraso de más de 15 minutos sin aviso previo se considera derrota por incomparecencia.',
  },
  {
    title: 'Material',
    body: 'La organización proporciona las pelotas. Cada jugador debe traer su propia raqueta.',
  },
  {
    title: 'Fair play',
    body: 'Los jugadores marcan sus propios puntos con honestidad. En caso de duda sobre un punto, se repite. El buen ambiente es parte del torneo.',
  },
]

export default function ReglasPage() {
  return (
    <div className="py-12 px-4 max-w-3xl mx-auto">
      <h1 className="font-bebas text-7xl text-sage tracking-wide mb-1">REGLAMENTO</h1>
      <p className="font-lato text-gray-400 text-xs uppercase tracking-widest mb-10">
        Torneo Urbanova 2026
      </p>

      <div className="space-y-4">
        {RULES.map((rule, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="font-bebas text-2xl text-sage/30 leading-none min-w-7 mt-0.5 tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h2 className="font-bebas text-xl text-forest tracking-wide mb-1.5">
                  {rule.title.toUpperCase()}
                </h2>
                <p className="font-lato text-gray-600 leading-relaxed text-sm">{rule.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 bg-sage/10 rounded-xl p-6 border border-sage/20">
        <p className="font-bebas text-xl text-sage tracking-wide mb-1">¿DUDAS O CONSULTAS?</p>
        <p className="font-lato text-gray-600 text-sm">
          Escribe a la organización:{' '}
          <a href="mailto:torneourbanova@gmail.com" className="text-sage font-bold hover:underline">
            torneourbanova@gmail.com
          </a>
        </p>
      </div>
    </div>
  )
}