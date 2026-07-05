import { supabase } from '@/lib/supabase'
import Link         from 'next/link'
import RealtimeRefresher from '@/app/components/RealtimeRefresher'

export const revalidate = 0

function formatDay(isoStr) {
  if (!isoStr) return 'Sin fecha asignada'
  const d = new Date(isoStr)
  return d.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

export default async function PartidosPage({ searchParams }) {
  const params = await searchParams
  const nivel  = parseInt(params.nivel) || 1

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, completed, scheduled_at, court,
      team1:team1_id(id, name),
      team2:team2_id(id, name),
      winner:winner_id(id, name),
      tournament_groups(id, name),
      sets(set_number, team1_score, team2_score, is_super_tiebreak)
    `)
    .eq('stage', 'group_stage')
    .eq('level', nivel)
    .order('scheduled_at', { ascending: true, nullsFirst: false })

  // Group by calendar day
  const byDay = {}
  for (const match of (matches || [])) {
    const key   = match.scheduled_at
      ? new Date(match.scheduled_at).toDateString()
      : 'SIN_FECHA'
    const label = formatDay(match.scheduled_at)
    if (!byDay[key]) byDay[key] = { label, matches: [] }
    byDay[key].matches.push(match)
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 min-h-screen">
      <h1 className="font-bebas text-5xl text-gray-900 tracking-wide mb-1">PARTIDOS</h1>
      <p className="font-lato text-gray-500 text-sm mb-8">
        Fase de grupos · programa y resultados
      </p>

      {/* Level tabs */}
      <div className="flex gap-2 mb-10">
        {[1, 2, 3].map(n => (
          <Link
            key={n}
            href={`/partidos?nivel=${n}`}
            className={`px-5 py-2 rounded-full font-lato font-bold text-sm transition-colors ${
              nivel === n ? 'bg-sage text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Nivel {n}
          </Link>
        ))}
      </div>

      {Object.keys(byDay).length === 0 ? (
        <div className="bg-sage/10 rounded-2xl border border-sage/20 p-12 text-center">
          <p className="font-lato text-gray-500">
            Los partidos del Nivel {nivel} todavía no están disponibles.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(byDay).map(([key, { label, matches: dayMatches }]) => (
            <div key={key}>
              <h2 className="font-bebas text-2xl tracking-wide mb-4 capitalize text-gold">
                {label}
              </h2>
              <div className="space-y-3">
                {dayMatches.map(m => <MatchCard key={m.id} match={m} />)}
              </div>
            </div>
          ))}
        </div>
      )}
      <RealtimeRefresher tables={['sets', 'matches']} />
    </main>
  )
}

function MatchCard({ match }) {
  const sets   = (match.sets || []).sort((a, b) => a.set_number - b.set_number)
  const t1Wins = match.winner?.id === match.team1?.id
  const t2Wins = match.winner?.id === match.team2?.id

  return (
    <div className={`rounded-2xl border p-4 ${
      match.completed ? 'bg-white border-gray-200' : 'bg-sage/5 border-sage/20'
    }`}>
      <div className="flex items-center gap-3">
        {/* Team 1 */}
        <div className="flex-1 min-w-0">
          <p className={`font-lato font-bold text-sm truncate ${
            t1Wins ? 'text-gray-900'
            : match.completed ? 'text-gray-400' : 'text-gray-700'
          }`}>
            {match.team1?.name ?? '—'}
          </p>
        </div>

        {/* Centre: score or time */}
        <div className="shrink-0">
          {match.completed ? (
            <div className="flex gap-1">
              {sets.map(s => (
                <span key={s.set_number}
                  className="font-lato text-xs bg-gray-100 rounded px-1.5 py-0.5 tabular-nums"
                >
                  {s.team1_score}–{s.team2_score}
                </span>
              ))}
            </div>
          ) : (
            <span className="font-lato text-xs font-bold text-sage bg-sage/10 rounded-full px-3 py-1">
              {match.scheduled_at
                ? new Date(match.scheduled_at).toLocaleTimeString('es-ES', {
                    hour: '2-digit', minute: '2-digit',
                  })
                : 'Pendiente'}
            </span>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex-1 min-w-0 text-right">
          <p className={`font-lato font-bold text-sm truncate ${
            t2Wins ? 'text-gray-900'
            : match.completed ? 'text-gray-400' : 'text-gray-700'
          }`}>
            {match.team2?.name ?? '—'}
          </p>
        </div>
      </div>

      {(match.tournament_groups?.name || match.court) && (
        <p className="font-lato text-xs text-gray-400 mt-2 text-center">
          {[match.tournament_groups?.name, match.court ? `Pista ${match.court}` : null]
            .filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  )
}