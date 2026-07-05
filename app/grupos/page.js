import { supabase }           from '@/lib/supabase'
import { calculateStandings } from '@/lib/standings'
import Link                   from 'next/link'

export const revalidate = 0  // Never serve a cached copy — always fetch fresh data

export default async function GruposPage({ searchParams }) {
  const params = await searchParams           // Next.js 15
  const nivel  = parseInt(params.nivel) || 1

  const [{ data: groups }, { data: matches }] = await Promise.all([
    supabase
      .from('tournament_groups')
      .select(`
        id, name, level,
        group_entries(
          team_id,
          teams(id, name)
        )
      `)
      .eq('level', nivel)
      .order('name'),

    supabase
      .from('matches')
      .select(`
        id, team1_id, team2_id, group_id, completed,
        sets(set_number, team1_score, team2_score)
      `)
      .eq('stage', 'group_stage')
      .eq('level', nivel),
  ])

  const groupsWithStandings = (groups || []).map(group => {
    const groupMatches = (matches || []).filter(m => m.group_id === group.id)
    const teams = (group.group_entries || []).map(e => ({
      team_id:   e.team_id,
      team_name: e.teams?.name ?? '—',
    }))
    return { ...group, standings: calculateStandings(teams, groupMatches) }
  })

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 min-h-screen">
      <h1 className="font-bebas text-5xl text-gray-900 tracking-wide mb-1">
        GRUPOS
      </h1>
      <p className="font-lato text-gray-500 text-sm mb-8">
        Clasificación de la fase de grupos
      </p>

      {/* Level tabs */}
      <div className="flex gap-2 mb-10">
        {[1, 2, 3].map(n => (
          <Link
            key={n}
            href={`/grupos?nivel=${n}`}
            className={`px-5 py-2 rounded-full font-lato font-bold text-sm transition-colors ${
              nivel === n
                ? 'bg-sage text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Nivel {n}
          </Link>
        ))}
      </div>

      {groupsWithStandings.length === 0 ? (
        <div className="bg-sage/10 rounded-2xl border border-sage/20 p-12 text-center">
          <p className="font-lato text-gray-500">
            Los grupos del Nivel {nivel} todavía no están disponibles.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {groupsWithStandings.map(group => (
            <GroupTable key={group.id} group={group} />
          ))}
        </div>
      )}
    </main>
  )
}

function GroupTable({ group }) {
  return (
    <section>
      <h2 className="font-bebas text-2xl tracking-wide mb-3 text-gold">
        {group.name.toUpperCase()}
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-8 px-4 py-3 text-left font-lato text-xs text-gray-400 uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left font-lato text-xs text-gray-400 uppercase tracking-wider">Equipo</th>
              <th className="px-3 py-3 text-center font-lato text-xs text-gray-400 uppercase tracking-wider">J</th>
              <th className="px-3 py-3 text-center font-lato text-xs text-gray-400 uppercase tracking-wider">G</th>
              <th className="px-3 py-3 text-center font-lato text-xs text-gray-400 uppercase tracking-wider">P</th>
              <th className="px-3 py-3 text-center font-lato text-xs text-gray-400 uppercase tracking-wider">Sets</th>
              <th className="px-3 py-3 text-center font-lato text-xs text-gray-400 uppercase tracking-wider">Juegos</th>
            </tr>
          </thead>
          <tbody>
            {group.standings.map((team, idx) => (
              <tr
                key={team.team_id}
                className={`border-b border-gray-100 last:border-0 ${
                  idx === 0 ? 'bg-sage/5' : 'bg-white'
                }`}
              >
                <td className="px-4 py-3 font-lato text-xs text-gray-400">
                  {idx === 0
                    ? <span className="font-bold text-sage">1º</span>
                    : `${idx + 1}º`}
                </td>
                <td className="px-4 py-3 font-lato font-bold text-gray-900">{team.team_name}</td>
                <td className="px-3 py-3 text-center font-lato text-gray-500">{team.MP}</td>
                <td className="px-3 py-3 text-center font-lato font-bold text-gray-900">{team.W}</td>
                <td className="px-3 py-3 text-center font-lato text-gray-500">{team.L}</td>
                <td className="px-3 py-3 text-center font-lato text-gray-500">{team.SW}–{team.SL}</td>
                <td className="px-3 py-3 text-center font-lato text-gray-500">{team.GW}–{team.GL}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}