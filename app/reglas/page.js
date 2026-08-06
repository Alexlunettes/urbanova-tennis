import { CATEGORY_RULES, CATEGORY_META, CATEGORY_COLOR, LEVELS, formatFor } from '@/lib/tournament'
import FormatExplainer, { SquadKeyPoint } from '@/app/components/FormatExplainer'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import Card from '@/app/components/ui/Card'
import Badge from '@/app/components/ui/Badge'
import Button from '@/app/components/ui/Button'
import { cn } from '@/lib/cn'

export const metadata = { title: 'Reglamento' }

const RULES = [
  {
    title: 'Modalidad',
    body: 'Torneo de dobles, de jueves por la tarde a domingo por la tarde. Los partidos de la fase de grupos se juegan a un solo set. Desde cuartos de final se juega al mejor de 2 sets, con super tiebreak a 10 puntos si se llega empatados a un set.',
  },
  {
    title: 'Fase de grupos',
    body: 'Cada división compite por separado. La 1ª, la 2ª y la 4ª juegan como un único grupo; la 3ª se divide en tres grupos de cuatro parejas que juegan todos contra todos. La clasificación se ordena primero por partidos ganados y, en caso de empate, por juegos ganados y perdidos.',
  },
  {
    title: 'Las parejas con cuatro partidos',
    body: 'Rocío y Carla en la 1ª división, y Héctor y Alexander en la 2ª, juegan un partido más que el resto. Para no salir beneficiadas ni perjudicadas, de sus cuatro resultados solo cuentan tres: sus dos mejores y el peor. El tercer mejor resultado se descarta.',
  },
  {
    title: 'Cuartos de final — todavía por parejas',
    body: 'En cuartos siguen compitiendo las parejas por su cuenta, división por división. En la 1ª y la 2ª división el primero de grupo pasa directo a semifinales y el resto se cruza 2º-7º, 3º-6º y 4º-5º. En la 4ª se cruzan 1º-8º, 2º-7º, 3º-6º y 4º-5º. En la 3ª, que juega en tres grupos, los cruces se sortean comparando entre grupos a los primeros, a los segundos y a los terceros. Cada división llega al final de los cuartos con cuatro parejas vivas.',
  },
  {
    title: 'Clasificación de la 3ª división',
    body: 'Pasan los dos primeros de cada grupo más los dos mejores terceros. En el sorteo de cuartos, los dos mejores primeros de grupo se enfrentan a los dos terceros clasificados; el primero de grupo restante juega contra el peor segundo; y los otros dos segundos se enfrentan entre sí.',
  },
  {
    title: 'Los equipos se sortean después de los cuartos',
    body: 'Un equipo no es una pareja de la fase de grupos: solo existe a partir de semifinales y lo componen cuatro parejas, una de cada división. Cuando terminan los cuartos, las dieciséis parejas supervivientes se reparten al azar en cuatro equipos. El sorteo lo realiza la organización.',
  },
  {
    title: 'Semifinales y final',
    body: 'Ya no se compite en solitario. Cada eliminatoria enfrenta a dos equipos en cuatro partidos, uno por división, y avanza el equipo que gane la mayoría. Si queda 2–2 decide el total de sets ganados en la eliminatoria y, si el empate persiste, el total de juegos.',
  },
  {
    title: 'Puntualidad',
    body: 'Es obligatorio estar listo para jugar en el horario asignado. Un retraso de más de 15 minutos sin aviso previo se considera derrota por incomparecencia. Las pistas van encadenadas, así que un retraso arrastra a todos los partidos siguientes.',
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
        eyebrow="Torneo Tenis Urbanova 2026"
        title="REGLAMENTO"
        description="Todo lo que necesitas saber para competir, de la fase de grupos a la final."
      />

      {/* ── The three stages ── */}
      <section className="mb-14">
        <h2 className="mb-2 font-display text-2xl text-fg">EL FORMATO EN TRES ETAPAS</h2>
        <p className="mb-6 text-[14px] leading-relaxed text-fg-muted">
          Se empieza compitiendo por parejas y se acaba compitiendo en equipo.
        </p>
        <FormatExplainer />
        <SquadKeyPoint className="mt-5" />
      </section>

      {/* ── Qualification at a glance ── */}
      <section className="mb-14">
        <h2 className="mb-4 font-display text-2xl text-fg">CÓMO SE CLASIFICA</h2>
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-140 text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-2/60">
                  <Th className="text-left">División</Th>
                  <Th>Parejas</Th>
                  <Th>Grupos</Th>
                  <Th>A semis</Th>
                  <Th>A cuartos</Th>
                  <Th>Cruces</Th>
                  <Th className="pr-4">Vivas tras cuartos</Th>
                </tr>
              </thead>
              <tbody>
                {LEVELS.map(level => {
                  const r = CATEGORY_RULES[level]
                  return (
                    <tr key={level} className="border-b border-hairline last:border-0">
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-2">
                          <span className={cn('h-2 w-2 rounded-full', CATEGORY_COLOR[level].dot)} />
                          <span className="text-[13px] font-medium text-fg">
                            {CATEGORY_META[level].name}
                          </span>
                        </span>
                      </td>
                      <Td>{r.teams}</Td>
                      <Td>{r.groups}</Td>
                      <td className="px-3 py-3.5 text-center">
                        {r.byes > 0
                          ? <Badge tone="sand" size="xs">1ª directa</Badge>
                          : <span className="text-fg-subtle">—</span>}
                      </td>
                      <Td strong>{r.qualifiers}</Td>
                      <Td>{r.quarterfinals}</Td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="tabular rounded bg-accent-soft px-2 py-0.5 font-mono text-[12px] font-medium text-accent">
                          {r.survivors}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 px-1 text-[11px] text-fg-subtle">
          Fase de grupos: {formatFor('group_stage').label}. Desde cuartos:{' '}
          {formatFor('quarterfinal').label.toLowerCase()}.
        </p>
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

function Th({ children, className }) {
  return (
    <th className={cn('px-3 py-3 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle', className)}>
      {children}
    </th>
  )
}

function Td({ children, strong = false }) {
  return (
    <td className="px-3 py-3.5 text-center">
      <span className={cn('tabular font-mono text-[13px]', strong ? 'font-medium text-fg' : 'text-fg-muted')}>
        {children}
      </span>
    </td>
  )
}
