import { supabase } from '@/lib/supabase'
import { LEVELS, CATEGORY_META, CATEGORY_COLOR } from '@/lib/tournament'
import { AWARD_TYPES, awardFor, mvpWinnersFromVotes } from '@/lib/awards'
import AwardCard from '@/app/components/AwardCard'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import Badge from '@/app/components/ui/Badge'
import { cn } from '@/lib/cn'

export const revalidate = 0

export const metadata = { title: 'Palmarés' }

export default async function PremiosPage() {
  // Pairs carry the division, which is also how each player inherits one.
  const [{ data: teams }, { data: votes }] = await Promise.all([
    supabase
      .from('teams')
      .select(`
        id, name, level,
        player1:players!teams_player1_id_fkey(id, name),
        player2:players!teams_player2_id_fkey(id, name)
      `)
      .order('level'),
    supabase.from('mvp_votes').select('player_id, level'),
  ])

  const players = []
  const seen = new Set()
  for (const team of teams ?? []) {
    for (const p of [team.player1, team.player2]) {
      if (p && !seen.has(p.id)) {
        seen.add(p.id)
        players.push({ id: p.id, name: p.name, level: team.level, pair: team.name })
      }
    }
  }
  players.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'es'))

  // The MVP is whoever the public voted for most in that division. Counted here
  // from the stored votes, so the page reports a result rather than a poll.
  const playerIndex = Object.fromEntries(players.map(p => [p.id, { name: p.name, pair: p.pair }]))
  const mvp         = mvpWinnersFromVotes(votes ?? [], playerIndex)
  const totalVotes  = (votes ?? []).length

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Fin de torneo"
        title="PALMARÉS"
        description="El MVP de cada división de la III edición, elegido por votación popular. La votación está cerrada y estos son los resultados definitivos."
        actions={
          <Badge tone="sand" size="md">
            {totalVotes.toLocaleString('es-ES')} votos · votación cerrada
          </Badge>
        }
      />

      <div className="space-y-12">
        {LEVELS.map(level => (
          <section key={level}>
            <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-hairline pb-4">
              <span className={cn('h-2.5 w-2.5 rounded-full', CATEGORY_COLOR[level].dot)} />
              <span className="font-display text-4xl text-fg-subtle/30">
                {CATEGORY_META[level].short}
              </span>
              <div className="mr-auto">
                <h2 className="font-display text-2xl text-fg">{CATEGORY_META[level].name}</h2>
                <p className="text-xs text-fg-subtle">{CATEGORY_META[level].blurb}</p>
              </div>
              <Badge tone="neutral" size="md">
                {(mvp[level]?.total ?? 0).toLocaleString('es-ES')} votos
              </Badge>
            </div>

            <div className="grid gap-3">
              {AWARD_TYPES.map((type, i) => (
                <AwardCard
                  key={type.key}
                  type={type}
                  award={awardFor(level, type.key)}
                  live={type.byPublicVote ? liveMvp(mvp[level]) : null}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

    </PageShell>
  )
}

/** Turns a tally into the shape AwardCard's `live` prop expects. */
function liveMvp(result) {
  if (!result?.winner) return null
  return {
    winner:  result.winner,
    support: result.support,
    note:    result.tied
      ? `Empate a ${result.votes} votos en la votación popular.`
      : `${result.votes} de ${result.total} votos (${result.share}%) en la votación popular.`,
  }
}
