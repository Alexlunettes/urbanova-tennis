import {
  CATEGORY_META, CATEGORY_COLOR, CATEGORY_RULES, LEVELS,
  quarterfinalSeedLabels, courtLabel,
} from '@/lib/tournament'
import { quarterfinalSlot, finalSlot } from '@/lib/tournament-data'
import { TEAM_COMPOSITION, SEMIFINAL_SEEDING } from '@/lib/squads'
import Badge from './ui/Badge'
import { cn } from '@/lib/cn'

/**
 * The knockout stage as a single left-to-right bracket.
 *
 * It is readable from day one: before anyone has qualified, each quarterfinal
 * slot shows the finishing positions that will contest it ("2º vs 7º", and for
 * division 3 the "1º TOP2 vs 3º TOP1" notation used on the printed sheet),
 * together with its published time and court. As results come in, those
 * placeholders are replaced by real pairs.
 *
 * The two halves work differently and the layout says so: the quarterfinal
 * column holds INDIVIDUAL PAIRS, division by division, while the semifinal and
 * final columns hold TEAMS of four pairs. The band between them is where the
 * organisers draw those teams.
 *
 * Scrolls horizontally on narrow screens rather than reflowing, so the shape of
 * the draw is never lost.
 */
export default function Bracket({ quarterfinalsByDivision, semifinals, final, squads }) {
  const teamsFormed = squads.length > 0

  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-4 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-5 lg:gap-7">

        {/* ── Column 1: quarterfinals, by division ── */}
        <section className="w-84 shrink-0">
          <ColumnHeading
            title="Cuartos de final"
            note="Por parejas · al mejor de 2 sets · sábado"
          />
          <div className="space-y-5">
            {LEVELS.map(level => (
              <DivisionQuarterfinals
                key={level}
                level={level}
                ties={quarterfinalsByDivision[level] ?? []}
              />
            ))}
          </div>
          <SeedLegend />
        </section>

        <Connector />

        {/* ── Column 2: semifinals ── */}
        <section className="w-80 shrink-0 self-center sm:w-88">
          <ColumnHeading title="Semifinales" note="A vs D y B vs C · domingo por la mañana" />
          <div className="space-y-5">
            {semifinals.length > 0 && teamsFormed
              ? semifinals.map(tie => <TeamNode key={tie.id} tie={tie} />)
              : SEMIFINAL_SEEDING.map(([a, b], i) => (
                  <TeamNode key={i} placeholder label={`Semifinal ${i + 1}`} seeds={[a, b]} />
                ))}
          </div>
        </section>

        <Connector />

        {/* ── Column 3: final ── */}
        <section className="w-80 shrink-0 self-center sm:w-88">
          <ColumnHeading title="Final" note="Las 4 parejas del equipo ganador · domingo tarde" />
          {final && teamsFormed
            ? <TeamNode tie={final} isFinal />
            : <TeamNode placeholder label="Final" isFinal />}
        </section>
      </div>
    </div>
  )
}

function ColumnHeading({ title, note }) {
  return (
    <div className="mb-4">
      <h3 className="font-display text-xl text-fg">{title.toUpperCase()}</h3>
      <p className="mt-0.5 text-[11px] text-fg-subtle">{note}</p>
    </div>
  )
}

function Connector() {
  return (
    <div className="flex w-5 shrink-0 items-center justify-center lg:w-7" aria-hidden="true">
      <span className="h-32 w-px bg-linear-to-b from-transparent via-hairline-strong to-transparent" />
    </div>
  )
}

/* ─────────────────────────── QUARTERFINALS ─────────────────────────── */

function DivisionQuarterfinals({ level, ties }) {
  const rules  = CATEGORY_RULES[level]
  const colour = CATEGORY_COLOR[level]
  const labels = quarterfinalSeedLabels(level)
  const bySlot = Object.fromEntries(ties.map(t => [t.slot ?? 0, t]))

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xs">
      <div className="flex items-center gap-2 border-b border-hairline bg-surface-2/50 px-3.5 py-2.5">
        <span className={cn('h-2 w-2 rounded-full', colour.dot)} />
        <span className="font-display text-base text-fg">{CATEGORY_META[level].name}</span>
        {rules.byes > 0 && (
          <Badge tone="sand" size="xs" className="ml-auto">1º pasa directo</Badge>
        )}
      </div>

      <div className="divide-y divide-hairline">
        {labels.map(({ slot, a, b }) => (
          <PairTie
            key={slot}
            tie={bySlot[slot] ?? null}
            level={level}
            slot={slot}
            seedA={a}
            seedB={b}
          />
        ))}
      </div>
    </div>
  )
}

function PairTie({ tie, level, slot, seedA, seedB }) {
  const when  = quarterfinalSlot(level, slot)
  const drawn = Boolean(tie)

  const t1Won = tie?.completed && tie.winner_id === tie.team1_id
  const t2Won = tie?.completed && tie.winner_id === tie.team2_id
  const sets  = (tie?.sets ?? []).slice().sort((a, b) => a.set_number - b.set_number)

  return (
    <div className="px-3.5 py-2">
      <PairLine
        name={tie?.team1?.name}
        seed={seedA}
        won={t1Won}
        dimmed={tie?.completed && !t1Won}
      />

      <div className="my-1 flex items-center gap-2">
        <span className="h-px flex-1 bg-hairline" />
        {sets.length > 0 ? (
          <span className="tabular font-mono text-[10px] text-fg-subtle">
            {sets.map(s => `${s.team1_score}-${s.team2_score}`).join(' ')}
          </span>
        ) : when ? (
          <span className="tabular whitespace-nowrap font-mono text-[9.5px] text-fg-subtle">
            {when.time} · {courtLabel(when.court)}
          </span>
        ) : (
          <span className="text-[10px] text-fg-subtle">vs</span>
        )}
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <PairLine
        name={tie?.team2?.name}
        seed={seedB}
        won={t2Won}
        dimmed={tie?.completed && !t2Won}
      />

      {!drawn && (
        <p className="mt-1.5 text-[9.5px] italic text-fg-subtle/70">
          Se define con la clasificación final
        </p>
      )}
    </div>
  )
}

/**
 * One side of a quarterfinal. Before the draw it shows the finishing position
 * that will fill the slot; afterwards, the pair that actually did.
 */
function PairLine({ name, seed, won, dimmed }) {
  return (
    <div className="flex items-center gap-1.5">
      {won && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="shrink-0 text-accent" aria-label="Ganador">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {!name && (
        <span className="shrink-0 rounded border border-hairline bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] leading-none text-fg-muted">
          {seed}
        </span>
      )}
      <span
        className={cn(
          'truncate text-[12px]',
          !name  ? 'text-fg-subtle'
          : won  ? 'font-medium text-fg'
          : dimmed ? 'text-fg-subtle'
          : 'text-fg-muted',
        )}
      >
        {name ?? 'Por determinar'}
      </span>
    </div>
  )
}

/** Explains the division-3 seeding notation, which is not self-evident. */
function SeedLegend() {
  return (
    <p className="mt-3 rounded-xl border border-hairline bg-surface-2/40 px-3 py-2.5 text-[10.5px] leading-relaxed text-fg-subtle">
      <span className="font-medium text-fg-muted">Cómo se leen los cruces.</span>{' '}
      En 1ª, 2ª y 4ª el número es la posición final de la división. En 3ª, que
      juega en tres grupos, <span className="font-mono">1º TOP2</span> significa
      «el segundo mejor de todos los primeros de grupo», y{' '}
      <span className="font-mono">3º TOP1</span> «el mejor de todos los terceros».
    </p>
  )
}

/* ─────────────────── SEMIFINALS AND FINAL (TEAMS) ─────────────────── */

function TeamNode({ tie, placeholder = false, label, isFinal = false, seeds }) {
  if (placeholder) {
    return (
      <article
        className={cn(
          'overflow-hidden rounded-2xl border border-dashed bg-surface-2/40',
          isFinal ? 'border-sand-300/60' : 'border-hairline-strong',
        )}
      >
        <PlaceholderSide seeds={seeds?.[0]} />
        <div className="border-y border-hairline bg-surface-2/60 px-4 py-1.5 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fg-subtle">
            {label}
          </span>
        </div>
        <PlaceholderSide seeds={seeds?.[1]} />
      </article>
    )
  }

  const { resolution, explanation, matchesByCategory } = tie
  const s1Won = resolution.winnerSquadId && resolution.winnerSquadId === tie.squad1_id
  const s2Won = resolution.winnerSquadId && resolution.winnerSquadId === tie.squad2_id

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border bg-surface',
        isFinal
          ? 'border-sand-300/70 shadow-lg ring-1 ring-sand-300/30 dark:border-sand-400/30'
          : 'border-hairline shadow-xs',
      )}
    >
      <TeamSide
        squad={tie.squad1}
        won={s1Won}
        decided={resolution.isComplete}
        score={resolution.score.squad1.matches}
        pending={!resolution.isComplete}
      />

      <div className="flex items-center gap-2 border-y border-hairline bg-surface-2/50 px-4 py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-fg-subtle">
          {resolution.isComplete ? 'Final' : `${resolution.played}/${resolution.total} partidos`}
        </span>
        <span className="ml-auto flex gap-0.5">
          {LEVELS.map(l => {
            const m = matchesByCategory[l]
            return (
              <span
                key={l}
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  m?.completed ? CATEGORY_COLOR[l].dot : 'bg-hairline-strong',
                )}
                title={`${CATEGORY_META[l].name}${m?.completed ? ' · jugado' : ' · pendiente'}`}
              />
            )
          })}
        </span>
      </div>

      <TeamSide
        squad={tie.squad2}
        won={s2Won}
        decided={resolution.isComplete}
        score={resolution.score.squad2.matches}
        pending={!resolution.isComplete}
      />

      <MatchBreakdown tie={tie} />

      {explanation && (
        <p
          className={cn(
            'border-t border-hairline px-4 py-2 text-[11px]',
            resolution.isTied ? 'bg-red-50/60 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                              : 'bg-accent-soft text-fg-muted',
          )}
        >
          {isFinal && !resolution.isTied ? '🏆 ' : ''}{explanation}
        </p>
      )}
    </article>
  )
}

/**
 * The four matches of a tie, one per division, with their time and score.
 *
 * Worth showing in full because the tie is decided on the majority: a pair can
 * win here and still go out with its team, which is exactly the thing visitors
 * find surprising.
 */
function MatchBreakdown({ tie }) {
  const { matchesByCategory } = tie

  return (
    <div className="border-t border-hairline bg-surface-2/30 px-4 py-2">
      <ul className="space-y-1">
        {LEVELS.map(level => {
          const m = matchesByCategory[level]
          const sets = (m?.sets ?? []).slice().sort((a, b) => a.set_number - b.set_number)
          const t1Won = m?.completed && m.winner_id === m.team1_id
          const t2Won = m?.completed && m.winner_id === m.team2_id
          // A projected final has no match rows yet, so fall back to the
          // published kick-off times rather than showing four dashes.
          const slot  = tie.round === 'final' ? finalSlot(level) : null
          const when  = m?.scheduled_at
            ? new Date(m.scheduled_at).toLocaleTimeString('es-ES', {
                hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid',
              })
            : slot?.time ?? null

          return (
            <li key={level} className="flex items-center gap-1.5 text-[10.5px]">
              <span className={cn('h-1 w-1 shrink-0 rounded-full', CATEGORY_COLOR[level].dot)} />
              <span className="w-4 shrink-0 font-display text-[9.5px] text-fg-subtle">
                {CATEGORY_META[level].short}
              </span>
              <span className={cn('shrink-0', t1Won ? 'font-medium text-fg' : 'text-fg-subtle')}>
                {t1Won ? '▲' : t2Won ? '▽' : '·'}
              </span>
              <span className={cn('shrink-0', t2Won ? 'font-medium text-fg' : 'text-fg-subtle')}>
                {t2Won ? '▲' : t1Won ? '▽' : '·'}
              </span>
              <span className="tabular ml-auto shrink-0 font-mono text-[9.5px] text-fg-subtle">
                {sets.length > 0
                  ? sets.map(s => `${s.team1_score}-${s.team2_score}`).join(' ')
                  : when ? `${when}${(m?.court ?? slot?.court) ? ` · ${courtLabel(m?.court ?? slot.court)}` : ''}` : '—'}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-1.5 text-[9.5px] leading-snug text-fg-subtle/80">
        Avanza el equipo que gane más partidos, no las parejas ganadoras.
      </p>
    </div>
  )
}

/** The shape of a team slot before the draw, so the structure is legible early. */
function PlaceholderSide({ seeds }) {
  const spec = seeds ? TEAM_COMPOSITION.find(t => t.seed === seeds) : null

  return (
    <div className="px-4 py-3">
      <p className="font-display text-xl text-fg-subtle">
        {spec ? spec.name : <span className="italic">Equipo por definir</span>}
      </p>
      <ul className="mt-2 space-y-0.5">
        {LEVELS.map(level => (
          <li key={level} className="flex items-center gap-1.5">
            <span className={cn('h-1 w-1 shrink-0 rounded-full opacity-40', CATEGORY_COLOR[level].dot)} />
            <span className="w-4 shrink-0 font-display text-[10px] text-fg-subtle">
              {CATEGORY_META[level].short}
            </span>
            <span className="text-[11px] italic text-fg-subtle/70">
              {spec
                ? `nº ${spec.ranks[level]} de ${CATEGORY_META[level].short} división`
                : `1 pareja de ${CATEGORY_META[level].short} división`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * One side of a team tie: the name, its running match tally, and the four
 * pairs that make it up in smaller type — so a visitor can always see who is
 * actually playing for that team.
 */
function TeamSide({ squad, won, decided, score, pending }) {
  return (
    <div className={cn('px-4 py-3', won && 'bg-accent-soft')}>
      <div className="flex items-center gap-2.5">
        <p
          className={cn(
            'min-w-0 flex-1 truncate font-display text-xl',
            !squad   ? 'italic text-fg-subtle'
            : won    ? 'text-fg'
            : decided ? 'text-fg-subtle'
            : 'text-fg-muted',
          )}
        >
          {squad?.name ?? 'Por determinar'}
        </p>
        <span
          className={cn(
            'tabular flex h-7 w-7 items-center justify-center rounded-lg font-mono text-sm',
            won ? 'bg-accent text-accent-fg'
            : pending ? 'border border-dashed border-hairline-strong text-fg-subtle'
            : 'border border-hairline bg-surface-2 text-fg-muted',
          )}
        >
          {score}
        </span>
      </div>

      {squad && (
        <ul className="mt-2 space-y-0.5">
          {LEVELS.map(level => {
            const pair = squad.membersByCategory?.[level]
            return (
              <li key={level} className="flex items-center gap-1.5">
                <span className={cn('h-1 w-1 shrink-0 rounded-full', CATEGORY_COLOR[level].dot)} />
                <span className="w-4 shrink-0 font-display text-[10px] text-fg-subtle">
                  {CATEGORY_META[level].short}
                </span>
                <span className={cn('truncate text-[11px]', pair ? 'text-fg-muted' : 'italic text-fg-subtle')}>
                  {pair?.name ?? '—'}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
