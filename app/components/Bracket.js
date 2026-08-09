import {
  CATEGORY_META, CATEGORY_COLOR, CATEGORY_RULES, LEVELS,
  quarterfinalSeedLabels, courtLabel,
} from '@/lib/tournament'
import { quarterfinalSlot, finalSlot, semifinalSlot } from '@/lib/tournament-data'
import { TEAM_COMPOSITION, SEMIFINAL_SEEDING } from '@/lib/squads'
import Badge from './ui/Badge'
import { cn } from '@/lib/cn'

/**
 * The knockout stage, in the three acts it is actually played in.
 *
 * The quarterfinals are contested by INDIVIDUAL PAIRS, division by division, so
 * they stay as a grid of compact per-division cards — readable from day one,
 * because before anyone has qualified each slot shows the finishing positions
 * that will contest it ("2º vs 7º", and for division 3 the "1º TOP2" notation
 * from the printed sheet).
 *
 * The semifinals and the final are a different competition in miniature: TEAM
 * against TEAM over four matches. Squeezing that into a bracket column made it
 * impossible to see who was playing whom, so from here the layout opens out
 * into full-width head-to-head cards — one team on the left, one on the right,
 * and the four division matches laid out between them so you can read straight
 * across from a pair to its opponent.
 */
export default function Bracket({ quarterfinalsByDivision, semifinals, final, squads }) {
  const teamsFormed = squads.length > 0

  return (
    <div className="space-y-14">

      {/* ── Act 1: quarterfinals, by division ── */}
      <section>
        <SectionHeading
          step="1"
          title="Cuartos de final"
          note="Por parejas, división por división · al mejor de 2 sets · sábado"
        />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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

      {/* ── Act 2: semifinals, team against team ── */}
      <section>
        <SectionHeading
          step="2"
          title="Semifinales"
          note="Equipo contra equipo · 4 partidos, uno por división · domingo por la mañana"
        />
        <div className="space-y-8">
          {semifinals.length > 0 && teamsFormed
            ? semifinals.map((tie, i) => (
                <TeamMatchup
                  key={tie.id}
                  tie={tie}
                  label={`Semifinal ${i + 1}`}
                  position={tie.position ?? i + 1}
                />
              ))
            : SEMIFINAL_SEEDING.map(([a, b], i) => (
                <TeamMatchup
                  key={i}
                  placeholder
                  label={`Semifinal ${i + 1}`}
                  seeds={[a, b]}
                  position={i + 1}
                />
              ))}
        </div>
      </section>

      {/* ── Act 3: the final ── */}
      <section>
        <SectionHeading
          step="3"
          title="Final"
          note="Las 4 parejas del equipo que gane su semifinal · domingo por la tarde"
        />
        {final && teamsFormed
          ? <TeamMatchup tie={final} label="Final" isFinal />
          : <TeamMatchup placeholder label="Final" isFinal />}
      </section>
    </div>
  )
}

function SectionHeading({ step, title, note }) {
  return (
    <div className="mb-5 flex items-baseline gap-3 border-b border-hairline pb-3">
      <span className="tabular font-mono text-[11px] text-fg-subtle">{step}</span>
      <h3 className="font-display text-2xl text-fg">{title.toUpperCase()}</h3>
      <p className="hidden text-[11.5px] text-fg-subtle sm:block">{note}</p>
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

/**
 * One team tie, read left to right.
 *
 * The whole point of this card is to answer "who is playing whom" without
 * anyone having to learn the format first. So the two teams sit on opposite
 * sides with the aggregate score between them, and underneath, the four
 * division matches line up on the same axis: the left team's pair on the left,
 * its opponent directly across, and that match's score in the middle column.
 * Reading down the middle gives the story of the tie; reading across any row
 * gives a single match.
 *
 * Winners are marked by weight and colour rather than by badges everywhere —
 * one tag on the team that goes through, bold text on the pairs that won their
 * own match, and everything else stepped back.
 */
/**
 * The four divisions of a tie, in the order they are actually played.
 *
 * Neither round runs in division order — the semifinals go 4ª, 2ª, 1ª, 3ª and
 * the finals 3ª, 4ª, 2ª, 1ª — so the rows are sorted by kick-off rather than by
 * level. Real match rows win; a tie with no rows yet (a projected final) falls
 * back to the published schedule.
 */
function playingOrder(tie, isFinal, position) {
  const minuteOf = level => {
    const iso = tie?.matchesByCategory?.[level]?.scheduled_at
    if (iso) return new Date(iso).getTime()
    const slot = isFinal ? finalSlot(level) : semifinalSlot(position, level)
    if (!slot) return null
    const [h, m] = slot.time.split(':').map(Number)
    return h * 60 + m
  }

  return [...LEVELS].sort((a, b) => {
    const ta = minuteOf(a), tb = minuteOf(b)
    if (ta === null && tb === null) return a - b
    if (ta === null) return 1
    if (tb === null) return -1
    return ta - tb || a - b       // same slot → division order, so it is stable
  })
}

function TeamMatchup({ tie, placeholder = false, label, isFinal = false, seeds, position }) {
  const spec1 = placeholder ? TEAM_COMPOSITION.find(t => t.seed === seeds?.[0]) : null
  const spec2 = placeholder ? TEAM_COMPOSITION.find(t => t.seed === seeds?.[1]) : null

  const resolution = tie?.resolution
  const decided    = Boolean(resolution?.winnerSquadId)
  const s1Won      = decided && resolution.winnerSquadId === tie.squad1_id
  const s2Won      = decided && resolution.winnerSquadId === tie.squad2_id

  const name1 = placeholder ? spec1?.name : tie.squad1?.name
  const name2 = placeholder ? spec2?.name : tie.squad2?.name

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border bg-surface',
        isFinal
          ? 'border-sand-300/70 shadow-md ring-1 ring-sand-300/25 dark:border-sand-400/30'
          : 'border-hairline shadow-xs',
      )}
    >
      {/* ── Which tie this is ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-hairline bg-surface-2/50 px-4 py-2 sm:px-6">
        <span className="font-display text-base text-fg">{label.toUpperCase()}</span>
        {!placeholder && (
          <span className="text-[11px] text-fg-subtle">
            {resolution.isComplete
              ? 'Eliminatoria terminada'
              : `${resolution.played} de ${resolution.total} partidos jugados`}
          </span>
        )}
        {tie?.projected && (
          <Badge tone="neutral" size="xs" className="ml-auto">Según las semifinales</Badge>
        )}
      </div>

      {/* ── Team vs team ── */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-4 sm:gap-6 sm:px-6">
        <TeamHeading name={name1} won={s1Won} decided={decided} align="right" />

        <div className="flex flex-col items-center gap-1">
          {resolution && resolution.played > 0 ? (
            <p className="tabular whitespace-nowrap font-mono text-2xl text-fg sm:text-3xl">
              <span className={cn(s1Won && 'font-medium', s2Won && 'text-fg-subtle')}>
                {resolution.score.squad1.matches}
              </span>
              <span className="mx-1 text-fg-subtle">–</span>
              <span className={cn(s2Won && 'font-medium', s1Won && 'text-fg-subtle')}>
                {resolution.score.squad2.matches}
              </span>
            </p>
          ) : (
            <span className="font-display text-lg text-fg-subtle sm:text-xl">VS</span>
          )}
        </div>

        <TeamHeading name={name2} won={s2Won} decided={decided} align="left" />
      </div>

      {/* ── The four matches, pair against pair ── */}
      <ul className="divide-y divide-hairline border-t border-hairline">
        {playingOrder(tie, isFinal, position).map(level => (
          <DivisionDuel
            key={level}
            level={level}
            match={tie?.matchesByCategory?.[level] ?? null}
            pair1={placeholder ? null : tie.squad1?.membersByCategory?.[level]}
            pair2={placeholder ? null : tie.squad2?.membersByCategory?.[level]}
            rank1={spec1?.ranks?.[level]}
            rank2={spec2?.ranks?.[level]}
            isFinal={isFinal}
          />
        ))}
      </ul>

      {/* ── Outcome ── */}
      <div
        className={cn(
          'border-t border-hairline px-4 py-2.5 text-center text-[11.5px] sm:px-6',
          resolution?.isTied
            ? 'bg-red-50/60 text-red-700 dark:bg-red-500/10 dark:text-red-300'
            : decided ? 'bg-accent-soft text-fg-muted'
            : 'bg-surface-2/30 text-fg-subtle',
        )}
      >
        {decided ? (
          <>
            {isFinal && !resolution.isTied ? '🏆 ' : ''}
            <span className="font-medium text-fg">
              {s1Won ? name1 : name2}
            </span>{' '}
            {isFinal ? 'gana el torneo' : 'pasa a la final'} · {tie.explanation}
          </>
        ) : resolution?.isTied ? (
          tie.explanation
        ) : (
          'Avanza el equipo que gane más partidos, no las parejas ganadoras.'
        )}
      </div>
    </article>
  )
}

/** One side of the head-to-head. */
function TeamHeading({ name, won, decided, align }) {
  return (
    <div className={cn('min-w-0', align === 'right' ? 'text-right' : 'text-left')}>
      <p
        className={cn(
          'truncate font-display text-xl sm:text-2xl',
          !name    ? 'italic text-fg-subtle'
          : won    ? 'text-fg'
          : decided ? 'text-fg-subtle'
          : 'text-fg',
        )}
      >
        {name ?? 'Por determinar'}
      </p>
      {won && (
        <span className="mt-1 inline-block rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-fg">
          Pasa
        </span>
      )}
    </div>
  )
}

/**
 * One division's match inside a tie: the two pairs facing each other, with the
 * score — or the kick-off time — holding the middle.
 */
function DivisionDuel({ level, match, pair1, pair2, rank1, rank2, isFinal }) {
  const sets   = (match?.sets ?? []).slice().sort((a, b) => a.set_number - b.set_number)
  const p1Won  = match?.completed && match.winner_id === match.team1_id
  const p2Won  = match?.completed && match.winner_id === match.team2_id

  // A projected final has no match rows yet, so fall back to the published
  // kick-off times rather than leaving the middle column empty.
  const slot = !match && isFinal ? finalSlot(level) : null
  const when = match?.scheduled_at
    ? new Date(match.scheduled_at).toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid',
      })
    : slot?.time ?? null
  const court = match?.court ?? slot?.court ?? null

  const placeholderFor = rank => rank ? `nº ${rank} de ${CATEGORY_META[level].short}` : null

  return (
    <li className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2.5 sm:gap-6 sm:px-6">
      <PairCell
        name={pair1?.name ?? placeholderFor(rank1)}
        won={p1Won}
        dimmed={p2Won}
        align="right"
      />

      <div className="flex min-w-16 flex-col items-center gap-0.5 sm:min-w-28">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
            CATEGORY_COLOR[level].chip, 'border',
          )}
        >
          {CATEGORY_META[level].short}
        </span>
        {sets.length > 0 ? (
          <span className="tabular whitespace-nowrap font-mono text-[12px] font-medium text-fg">
            {sets.map(s => `${s.team1_score}-${s.team2_score}`).join(' ')}
          </span>
        ) : (
          <span className="tabular whitespace-nowrap font-mono text-[10px] text-fg-subtle">
            {when ? `${when}${court ? ` · ${courtLabel(court)}` : ''}` : 'Por jugar'}
          </span>
        )}
      </div>

      <PairCell
        name={pair2?.name ?? placeholderFor(rank2)}
        won={p2Won}
        dimmed={p1Won}
        align="left"
      />
    </li>
  )
}

function PairCell({ name, won, dimmed, align }) {
  const right = align === 'right'
  return (
    <div
      className={cn(
        'flex min-w-0 items-start gap-1.5',
        right ? 'flex-row-reverse text-right' : 'text-left',
      )}
    >
      {won && (
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="4" strokeLinecap="round" className="mt-1 shrink-0 text-accent"
          aria-label="Ganador"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {/* Wraps rather than truncates: on a phone the two columns are narrow,
          and half a partner's name is worse than two lines. */}
      <span
        className={cn(
          'min-w-0 text-[12.5px] leading-snug text-balance sm:text-[13.5px]',
          !name   ? 'italic text-fg-subtle'
          : won   ? 'font-medium text-fg'
          : dimmed ? 'text-fg-subtle'
          : 'text-fg-muted',
        )}
      >
        {name ?? 'Por determinar'}
      </span>
    </div>
  )
}
