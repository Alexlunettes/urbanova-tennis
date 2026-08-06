import { CATEGORY_META, CATEGORY_COLOR, CATEGORY_RULES, LEVELS } from '@/lib/tournament'
import { cn } from '@/lib/cn'

/**
 * How the tournament is put together, as a diagram rather than as prose.
 *
 * This replaces the old worked example, which showed a made-up "Equipo A vs
 * Equipo B" scoreline and read like a real result. Nothing here can be
 * mistaken for a fixture: it is the shape of the competition, stage by stage.
 */
export default function FormatExplainer() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Stage
        step="1"
        title="Fase de grupos"
        note="Cada división por separado · 1 set por partido"
      >
        <div className="space-y-1.5">
          {LEVELS.map(level => {
            const r = CATEGORY_RULES[level]
            return (
              <div
                key={level}
                className="flex items-center gap-2.5 rounded-lg border border-hairline bg-surface px-2.5 py-2"
              >
                <span className={cn('h-2 w-2 shrink-0 rounded-full', CATEGORY_COLOR[level].dot)} />
                <span className="min-w-0 flex-1 truncate text-[12px] text-fg">
                  {CATEGORY_META[level].name}
                </span>
                <span className="tabular shrink-0 font-mono text-[10px] text-fg-subtle">
                  {r.teams} parejas
                  {r.groups > 1 ? ` · ${r.groups} grupos` : ''}
                </span>
              </div>
            )
          })}
        </div>
        <Footnote>
          Se ordena por partidos ganados y, en caso de empate, por juegos.
        </Footnote>
      </Stage>

      <Stage
        step="2"
        title="Cuartos de final"
        note="Todavía pareja contra pareja · al mejor de 2 sets"
      >
        <div className="space-y-1.5">
          {LEVELS.map(level => {
            const r = CATEGORY_RULES[level]
            return (
              <div
                key={level}
                className="flex items-center gap-2.5 rounded-lg border border-hairline bg-surface px-2.5 py-2"
              >
                <span className={cn('h-2 w-2 shrink-0 rounded-full', CATEGORY_COLOR[level].dot)} />
                <span className="min-w-0 flex-1 truncate text-[12px] text-fg-muted">
                  {r.byes > 0 ? '1ª descansa · ' : ''}{r.quarterfinals} cruces
                </span>
                <span className="tabular shrink-0 rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] text-accent">
                  4 vivas
                </span>
              </div>
            )
          })}
        </div>
        <Footnote>
          En 1ª y 2ª el primero de grupo pasa directo. Cada división termina con
          cuatro parejas en pie.
        </Footnote>
      </Stage>

      <Stage
        step="3"
        title="Equipos"
        note="Sorteo aleatorio · solo desde semifinales"
        accent
      >
        <div className="space-y-1.5">
          {[1, 2, 3, 4].map(seed => (
            <div
              key={seed}
              className="flex items-center gap-2.5 rounded-lg border border-hairline bg-surface px-2.5 py-2"
            >
              <span className="tabular w-3 shrink-0 font-mono text-[10px] text-fg-subtle">{seed}</span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-fg">Equipo {seed}</span>
              <span className="flex shrink-0 gap-0.5">
                {LEVELS.map(l => (
                  <span
                    key={l}
                    className={cn('h-1.5 w-1.5 rounded-full', CATEGORY_COLOR[l].dot)}
                    title={CATEGORY_META[l].name}
                  />
                ))}
              </span>
            </div>
          ))}
        </div>
        <Footnote>
          Un equipo no es una pareja de la fase de grupos: nace al llegar a
          semifinales y lo forman cuatro parejas, una de cada división. Al
          acabar los cuartos, las dieciséis parejas supervivientes se reparten{' '}
          <span className="font-medium text-fg">al azar</span> en cuatro equipos.
        </Footnote>
      </Stage>
    </div>
  )
}

function Stage({ step, title, note, accent = false, children }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5',
        accent
          ? 'border-accent/25 bg-accent-soft/60 shadow-sm'
          : 'border-hairline bg-surface-2/50',
      )}
    >
      <div className="mb-4 flex items-baseline gap-2.5">
        <span
          className={cn(
            'tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-[11px]',
            accent ? 'bg-accent text-accent-fg' : 'bg-surface text-fg-muted border border-hairline',
          )}
        >
          {step}
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-xl text-fg">{title.toUpperCase()}</h3>
          <p className="text-[11px] text-fg-subtle">{note}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function Footnote({ children }) {
  return (
    <p className="mt-3.5 border-t border-hairline pt-3 text-[11.5px] leading-relaxed text-fg-muted">
      {children}
    </p>
  )
}

/**
 * The one thing people find counter-intuitive, stated plainly and without a
 * fake scoreline attached.
 */
export function SquadKeyPoint({ className }) {
  return (
    <div
      className={cn(
        'flex gap-3.5 rounded-2xl border border-sand-200 bg-sand-50/70 p-5 dark:border-sand-400/25 dark:bg-sand-400/[0.07]',
        className,
      )}
    >
      <svg
        width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
        className="mt-0.5 shrink-0 text-sand-600 dark:text-sand-300"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9.2" />
        <path d="M12 16.5v-5M12 8h.01" />
      </svg>
      <p className="text-[13px] leading-relaxed text-fg-muted">
        <span className="font-medium text-fg">
          Desde semifinales puedes perder tu partido y seguir en el torneo.
        </span>{' '}
        Cada eliminatoria son cuatro partidos, uno por división, y pasa el
        equipo que gane la mayoría. Si acaba 2–2 deciden los sets y, después,
        los juegos.
      </p>
    </div>
  )
}
