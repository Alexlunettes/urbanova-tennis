import { supabase } from '@/lib/supabase'
import { LEVELS } from '@/lib/tournament'
import MvpVoter from '@/app/components/MvpVoter'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import EmptyState from '@/app/components/ui/EmptyState'
import Button from '@/app/components/ui/Button'

export const revalidate = 0 // Voting is live.

export const metadata = { title: 'MVP del torneo' }

export default async function MvpPage() {
  // Teams carry the category, so this is the cheapest way to build a player
  // list already tagged by category.
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      level,
      player1:players!teams_player1_id_fkey(id, name),
      player2:players!teams_player2_id_fkey(id, name)
    `)
    .order('level')

  const seen = new Set()
  const players = []
  for (const team of teams ?? []) {
    for (const p of [team.player1, team.player2]) {
      if (p && !seen.has(p.id)) {
        seen.add(p.id)
        players.push({ id: p.id, name: p.name, level: team.level })
      }
    }
  }
  players.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'es'))

  const hasPlayers = players.length > 0

  return (
    <PageShell>
      <PageHeader
        eyebrow="Votación abierta"
        title="MVP DEL TORNEO"
        description="¿Quién ha sido el jugador o la jugadora de esta edición? Un voto por persona, resultados en directo."
      />

      {!hasPlayers ? (
        <EmptyState
          icon={<StarIcon />}
          title="Votación no disponible"
          description="Los jugadores aparecerán aquí en cuanto se publique el cuadro de inscritos."
          action={<Button href="/equipos" variant="secondary">Ver parejas</Button>}
        />
      ) : (
        <MvpVoter players={players} categories={LEVELS} />
      )}
    </PageShell>
  )
}

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9Z" />
    </svg>
  )
}
