import { createClient } from '@supabase/supabase-js'
import MvpVoter from '@/app/components/MvpVoter'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const revalidate = 0 // always fresh (voting is real-time)

export default async function MvpPage() {
  // Fetch teams with their players (fastest way to get player → level mapping)
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      level,
      player1:players!teams_player1_id_fkey(id, name),
      player2:players!teams_player2_id_fkey(id, name)
    `)
    .order('level')

  // Build a flat, deduplicated player list
  const seen = new Set()
  const players = []
  for (const team of (teams ?? [])) {
    for (const p of [team.player1, team.player2]) {
      if (p && !seen.has(p.id)) {
        seen.add(p.id)
        players.push({ id: p.id, name: p.name, level: team.level })
      }
    }
  }
  players.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="font-bebas text-5xl text-sage tracking-widest mb-2">MVP DEL TORNEO</h1>
      <p className="font-lato text-gray-500 mb-8">
        ¿Quién ha sido el mejor jugador de esta edición? Vota y descubre los resultados en tiempo real.
      </p>

      {players.length === 0 ? (
        <div className="text-center py-16 border border-sage/20 rounded-xl text-gray-400">
          <p className="font-bebas text-2xl tracking-wide mb-2">JUGADORES NO AÑADIDOS AÚN</p>
          <p className="font-lato text-sm">Los jugadores aparecerán aquí una vez se añadan al torneo.</p>
        </div>
      ) : (
        <MvpVoter players={players} />
      )}
    </div>
  )
}