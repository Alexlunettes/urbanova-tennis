import { CATEGORY_RULES, CATEGORY_META, LEVELS } from '@/lib/tournament'
import SquadExplainer from '@/app/components/SquadExplainer'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import Card from '@/app/components/ui/Card'
import Badge from '@/app/components/ui/Badge'
import Button from '@/app/components/ui/Button'

export const metadata = { title: 'Reglamento' }

const RULES = [
  {
    title: 'Modalidad',
    body: 'Torneo de dobles. Todos los partidos se juegan al mejor de 3 sets. El tercer set, si se llega a él, se disputa como super tiebreak — primero en llegar a 10 puntos con diferencia de 2.',
  },
  {
    title: 'Fase de grupos',
    body: 'Cada categoría disputa su propia liga en formato Champions League: no se juega contra todos los rivales, sino contra un grupo reducido de ellos. La clasificación se ordena por victorias, después por derrotas, después por diferencia de sets y finalmente por diferencia de juegos.',
  },
  {
    title: 'Fase eliminatoria por escuadras',
    body: 'A partir de cuartos de final las parejas dejan de competir por su cuenta. Se forman escuadras con una pareja de cada categoría, y cada eliminatoria consiste en cuatro partidos simultáneos, uno por categoría. Avanza la escuadra que gane la mayoría. Si el resultado queda 2–2, decide el total de sets ganados y, si persiste el empate, el total de juegos.',
  },
  {
    title: 'La eliminatoria especial de cuartos',
    body: 'Las Categorías 1 y 2 solo tienen siete parejas y su primera clasificada pasa directa a semifinales. Eso deja seis parejas de cada una para cuartos, frente a ocho de las Categorías 3 y 4. Por eso una de las cuatro eliminatorias de cuartos la juegan solo las parejas de Categoría 3 y 4, a dos partidos. La escuadra ganadora recibe sus parejas de Categoría 1 y 2 en semifinales.',
  },
  {
    title: 'Puntualidad',
    body: 'Es obligatorio estar listo para jugar en el horario asignado. Un retraso de más de 15 minutos sin aviso previo se considera derrota por incomparecencia. El torneo dura 24 horas seguidas y un retraso arrastra a todas las pistas.',
  },
  {
    title: 'Material',
    body: 'La organización proporciona las pelotas. Cada jugador debe traer su propia raqueta.',
  },
  {
    title: 'Fair play',
    body: 'Los jugadores marcan sus propios puntos con honestidad. En caso de duda sobre un punto, se repite. El buen ambiente es parte del torneo.',
  },
]

export default function ReglasPage() {
  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Torneo Urbanova 2026"
        title="REGLAMENTO"
        description="Todo lo que necesitas saber para competir, de la fase de grupos a la final."
      />

      {/* ── Qualification at a glance ── */}
      <section className="mb-14">
        <h2 className="mb-4 font-display text-2xl text-fg">CÓMO SE CLASIFICA</h2>
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-125 text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-2/60">
                  <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
                    Categoría
                  </th>
                  <th className="px-3 py-3 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
                    Parejas
                  </th>
                  <th className="px-3 py-3 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
                    A semifinales
                  </th>
                  <th className="px-3 py-3 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
                    A cuartos
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
                    Eliminadas
                  </th>
                </tr>
              </thead>
              <tbody>
                {LEVELS.map(level => {
                  const r = CATEGORY_RULES[level]
                  const out = r.teams - r.qualifiers
                  return (
                    <tr key={level} className="border-b border-hairline last:border-0">
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-2">
                          <span className="font-display text-lg text-accent/40">
                            {CATEGORY_META[level].short}
                          </span>
                          <span className="text-[13px] font-medium text-fg">
                            {CATEGORY_META[level].name}
                          </span>
                        </span>
                      </td>
                      <td className="tabular px-3 py-3.5 text-center font-mono text-[13px] text-fg-muted">
                        {r.teams}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {r.directToSemis > 0
                          ? <Badge tone="sand" size="xs">1ª clasificada</Badge>
                          : <span className="text-fg-subtle">—</span>}
                      </td>
                      <td className="tabular px-3 py-3.5 text-center font-mono text-[13px] font-medium text-fg">
                        {r.toQuarters}
                      </td>
                      <td className="tabular px-4 py-3.5 text-center font-mono text-[13px] text-fg-subtle">
                        {out > 0 ? out : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── The squad format ── */}
      <section className="mb-14">
        <h2 className="mb-2 font-display text-2xl text-fg">CÓMO FUNCIONA UNA ESCUADRA</h2>
        <p className="mb-6 text-[14px] leading-relaxed text-fg-muted">
          Este es el cambio más importante del formato. Un ejemplo real de
          eliminatoria:
        </p>
        <SquadExplainer />
      </section>

      {/* ── The rules themselves ── */}
      <section>
        <h2 className="mb-4 font-display text-2xl text-fg">NORMAS</h2>
        <div className="space-y-3">
          {RULES.map((rule, i) => (
            <Card key={rule.title} className="p-5">
              <div className="flex gap-4">
                <span className="tabular shrink-0 font-mono text-[13px] leading-6 text-fg-subtle">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-display text-lg text-fg">{rule.title.toUpperCase()}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg-muted">{rule.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Card className="mt-10 bg-accent-soft p-6" accent>
        <p className="font-display text-xl text-fg">¿DUDAS O CONSULTAS?</p>
        <p className="mt-1.5 text-[13.5px] text-fg-muted">
          Escribe a la organización y te respondemos.
        </p>
        <Button href="mailto:torneourbanova@gmail.com" className="mt-4" size="sm">
          torneourbanova@gmail.com
        </Button>
      </Card>
    </PageShell>
  )
}
