import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CATEGORY_RULES, CATEGORY_META, LEVELS } from '@/lib/tournament'
import Countdown from './components/Countdown'
import SquadExplainer from './components/SquadExplainer'
import Button from './components/ui/Button'
import Card from './components/ui/Card'
import Badge from './components/ui/Badge'

export const revalidate = 60

export default async function Home() {
  const [{ count: teamCount }, { count: playerCount }] = await Promise.all([
    supabase.from('teams').select('id',   { count: 'exact', head: true }),
    supabase.from('players').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    { value: teamCount   || 40, label: 'Parejas'    },
    { value: playerCount || 80, label: 'Jugadores'  },
    { value: 4,                 label: 'Categorías' },
    { value: '24h',             label: 'Sin parar'  },
  ]

  return (
    <>
      {/* ───────────────────────────── HERO ───────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-court-grid opacity-50" />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-140 opacity-70"
          style={{
            background:
              'radial-gradient(70% 55% at 50% 0%, var(--accent-soft) 0%, transparent 70%)',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-noise" />

        <div className="relative mx-auto max-w-5xl px-5 pt-16 pb-20 text-center sm:px-6 md:pt-24 md:pb-28">
          <div className="animate-fade-up">
            <Badge tone="accent" size="md" className="mb-6">
              III Edición · 6–9 agosto 2026
            </Badge>
          </div>

          <h1
            className="animate-fade-up font-display text-[19vw] leading-[0.86] text-fg sm:text-[15vw] md:text-[9.5rem] lg:text-[11rem]"
            style={{ animationDelay: '60ms' }}
          >
            <span className="block">TORNEO</span>
            <span className="block text-gradient">URBANOVA</span>
          </h1>

          <p
            className="animate-fade-up mx-auto mt-6 max-w-xl text-base leading-relaxed text-fg-muted md:text-lg"
            style={{ animationDelay: '120ms' }}
          >
            Cuarenta parejas. Cuatro categorías. Veinticuatro horas de tenis
            ininterrumpido a orillas del Mediterráneo.
          </p>

          <div className="animate-fade-up mt-12" style={{ animationDelay: '180ms' }}>
            <Countdown />
          </div>

          <div
            className="animate-fade-up mt-12 flex flex-wrap justify-center gap-3"
            style={{ animationDelay: '240ms' }}
          >
            <Button href="/grupos" size="lg">
              Ver clasificación
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
            <Button href="/cuadro" variant="secondary" size="lg">
              Cuadro final
            </Button>
          </div>
        </div>
      </section>

      {/* ──────────────────────────── STATS ──────────────────────────── */}
      <section className="border-y border-hairline bg-surface/50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-y divide-hairline sm:grid-cols-4 sm:divide-y-0">
          {stats.map(({ value, label }) => (
            <div key={label} className="px-5 py-8 text-center">
              <p className="tabular font-display text-4xl text-fg md:text-5xl">{value}</p>
              <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────────────── CATEGORIES ───────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-20 sm:px-6 md:py-28">
        <SectionHeading
          eyebrow="Fase de grupos"
          title="CUATRO CATEGORÍAS"
          description="Cada categoría disputa su propia liga en formato Champions: no juegas contra todos, sino contra un grupo reducido de rivales. La posición final decide quién pasa."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEVELS.map((level, i) => {
            const rules = CATEGORY_RULES[level]
            const meta  = CATEGORY_META[level]
            return (
              <Card
                key={level}
                as={Link}
                href={`/grupos?cat=${level}`}
                interactive
                className="animate-fade-up group block p-5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between">
                  <span className="font-display text-5xl text-accent/25 transition-colors duration-300 group-hover:text-accent/50">
                    {meta.short}
                  </span>
                  <Badge tone="neutral" size="xs">{rules.teams} parejas</Badge>
                </div>
                <p className="mt-4 font-display text-xl text-fg">{meta.name}</p>
                <p className="mt-1 text-xs text-fg-subtle">{meta.blurb}</p>
                <p className="mt-4 border-t border-hairline pt-3 text-xs text-fg-muted">
                  {rules.directToSemis > 0 ? (
                    <>
                      <span className="font-medium text-accent">1º a semifinales</span>
                      {' · '}{rules.toQuarters} a cuartos
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-accent">Top {rules.toQuarters}</span>
                      {' a cuartos · '}{rules.teams - rules.toQuarters} eliminadas
                    </>
                  )}
                </p>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ─────────────────────── THE SQUAD FORMAT ────────────────────── */}
      <section className="border-y border-hairline bg-surface-2/40">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:px-6 md:py-28">
          <SectionHeading
            eyebrow="Fase eliminatoria"
            title="A PARTIR DE CUARTOS, SE JUEGA EN ESCUADRA"
            description="Desde los cuartos de final nadie compite solo. Cada escuadra reúne a una pareja de cada categoría y se enfrenta a otra escuadra en cuatro partidos simultáneos. Puedes perder tu partido y aun así seguir en el torneo."
          />
          <div className="mt-12">
            <SquadExplainer />
          </div>
          <div className="mt-10 flex justify-center">
            <Button href="/reglas" variant="secondary">
              Leer el reglamento completo
            </Button>
          </div>
        </div>
      </section>

      {/* ──────────────────────────── ABOUT ──────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-6 md:py-28">
        <SectionHeading eyebrow="Urbanova, Alicante" title="EL TORNEO" centered />
        <p className="mt-6 text-[15px] leading-relaxed text-fg-muted">
          El Torneo Tenis Urbanova reúne cada verano a jugadores de todos los
          niveles en la costa alicantina. Un torneo de dobles organizado por
          amigos, para amigos — con competición de verdad, buen ambiente y
          partidos que no paran ni de madrugada. Este agosto celebramos la
          tercera edición.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="https://www.instagram.com/urbanovatenis" external variant="secondary">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            @urbanovatenis
          </Button>
          <Button href="mailto:torneourbanova@gmail.com" variant="ghost">
            torneourbanova@gmail.com
          </Button>
        </div>
      </section>
    </>
  )
}

function SectionHeading({ eyebrow, title, description, centered = false }) {
  return (
    <div className={centered ? 'text-center' : ''}>
      {eyebrow && (
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 font-display text-4xl text-fg md:text-5xl">{title}</h2>
      {description && (
        <p className={`mt-4 max-w-2xl text-[15px] leading-relaxed text-fg-muted ${centered ? 'mx-auto' : ''}`}>
          {description}
        </p>
      )}
    </div>
  )
}
