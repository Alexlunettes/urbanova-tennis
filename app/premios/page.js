import { supabase } from '@/lib/supabase'
import { LEVELS, CATEGORY_META, CATEGORY_COLOR } from '@/lib/tournament'
import { AWARD_TYPES, AWARDS, AWARDS_ANNOUNCED, awardFor } from '@/lib/awards'
import AwardCard from '@/app/components/AwardCard'
import MvpVoter from '@/app/components/MvpVoter'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import Badge from '@/app/components/ui/Badge'
import Wave from '@/app/components/ui/Wave'
import { cn } from '@/lib/cn'

export const revalidate = 0

export const metadata = { title: 'Palmarés' }

export default async function PremiosPage() {
  // Pairs carry the division, which is also how each player inherits one.
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id, name, level,
      player1:players!teams_player1_id_fkey(id, name),
      player2:players!teams_player2_id_fkey(id, name)
    `)
    .order('level')

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

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Fin de torneo"
        title="PALMARÉS"
        description="Los premios de la III edición, división por división. Se entregan al terminar el torneo; hasta entonces el MVP se decide con los votos del público."
        actions={
          <Badge tone={AWARDS_ANNOUNCED ? 'sand' : 'neutral'} size="md">
            {AWARDS_ANNOUNCED ? 'Premios entregados' : 'Aún por decidir'}
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
                {Object.keys(AWARDS[level] ?? {}).length} / {AWARD_TYPES.length} entregados
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {AWARD_TYPES.map((type, i) => (
                <AwardCard
                  key={type.key}
                  type={type}
                  award={awardFor(level, type.key)}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ── Public MVP vote ── */}
      <section className="relative mt-16 overflow-hidden rounded-3xl border border-hairline bg-sea-wash">
        <div className="px-5 py-10 sm:px-8">
          <div className="mb-7 max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
              Votación abierta
            </p>
            <h2 className="mt-2.5 font-display text-3xl text-fg md:text-4xl">
              VOTA AL MVP DEL TORNEO
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-fg-muted">
              El MVP lo elige el público. Un voto por dispositivo, resultados en
              directo. La organización confirma el premio al cierre del torneo.
            </p>
          </div>

          {players.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-hairline-strong bg-surface/60 px-5 py-10 text-center text-sm text-fg-subtle">
              Los jugadores aparecerán aquí en cuanto se publique el cuadro de inscritos.
            </p>
          ) : (
            <MvpVoter players={players} />
          )}
        </div>
        <Wave tone="canvas" flip className="absolute inset-x-0 bottom-0 -mb-px" />
      </section>
    </PageShell>
  )
}
