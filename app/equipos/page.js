import { supabase } from '@/lib/supabase'

export const revalidate = 60

const LEVEL_INFO = {
  1: { label: 'Nivel 1 — Semi-profesional',  color: 'bg-gold/10 text-gold border-gold/30'       },
  2: { label: 'Nivel 2 — Amateur avanzado',  color: 'bg-sage/10 text-sage-dark border-sage/30'   },
  3: { label: 'Nivel 3 — Amateur',           color: 'bg-court/10 text-court border-court/30'     },
}

export default async function EquiposPage() {
  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, name, level, player1:player1_id(id, name), player2:player2_id(id, name)')
    .order('level')
    .order('name')

  return (
    <div className="py-12 px-4 max-w-5xl mx-auto">
      <h1 className="font-bebas text-7xl text-sage tracking-wide mb-1">EQUIPOS</h1>
      <p className="font-lato text-gray-400 text-xs uppercase tracking-widest mb-10">
        Torneo Urbanova 2026
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm mb-8">
          Error al cargar equipos: {error.message}
        </div>
      )}

      {(!teams || teams.length === 0) && !error && (
          <div className="text-center py-24 bg-cream-dark rounded-2xl border border-sage/10">
          <p className="font-bebas text-4xl text-sage/40 tracking-widest">EQUIPOS PRÓXIMAMENTE</p>
          <p className="font-lato text-gray-400 mt-3 text-sm">Las inscripciones están abiertas</p>
          
            <a
              href="mailto:torneourbanova@gmail.com"
              className="inline-block mt-2 text-sage font-lato font-bold text-sm hover:underline"
            >
              torneourbanova@gmail.com
            </a>
        </div>
      )}

      {[1, 2, 3].map(level => {
        const levelTeams = teams?.filter(t => t.level === level) ?? []
        if (levelTeams.length === 0) return null
        const { label, color } = LEVEL_INFO[level]

        return (
          <section key={level} className="mb-12">
            <span className={`inline-block font-lato text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border mb-5 ${color}`}>
              {label}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {levelTeams.map(team => (
                <div
                  key={team.id}
                  className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <p className="font-bebas text-xl text-forest tracking-wide">{team.name}</p>
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                    {team.players?.map(p => (
                      <p key={p.id} className="font-lato text-sm text-gray-500 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-sage inline-block shrink-0" />
                        {p.name}
                      </p>
                    ))}
                    {(!team.players || team.players.length === 0) && (
                      <p className="font-lato text-xs text-gray-300 italic">Sin jugadores asignados</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}