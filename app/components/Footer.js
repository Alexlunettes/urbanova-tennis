import Link from 'next/link'
import Sponsors from './Sponsors'
import Logo from './Logo'

const SECTIONS = [
  {
    title: 'Torneo',
    links: [
      { href: '/equipos',  label: 'Parejas'       },
      { href: '/grupos',   label: 'Clasificación' },
      { href: '/partidos', label: 'Partidos'      },
      { href: '/partidos?vista=cuadro', label: 'Cuadro final' },
    ],
  },
  {
    title: 'Más',
    links: [
      { href: '/estadisticas', label: 'Estadísticas' },
      { href: '/galeria',      label: 'Galería'      },
      { href: '/premios',      label: 'Palmarés'     },
      { href: '/reglas',       label: 'Reglamento'   },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-auto">
      <Sponsors />

      <div className="border-t border-hairline bg-surface-2/40">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

            <div className="lg:col-span-2">
              <Logo className="w-40" />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-fg-muted">
                III edición · de jueves a domingo en Urbanova, Alicante.
                Cuatro divisiones, cuarenta parejas y un único equipo campeón.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <a
                  href="https://www.instagram.com/urbanovatenis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface text-fg-muted transition-all hover:-translate-y-0.5 hover:text-fg hover:shadow-sm"
                  aria-label="Instagram @urbanovatenis"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="mailto:torneourbanova@gmail.com"
                  className="inline-flex h-9 items-center rounded-lg border border-hairline bg-surface px-3 text-xs font-medium text-fg-muted transition-all hover:-translate-y-0.5 hover:text-fg hover:shadow-sm"
                >
                  torneourbanova@gmail.com
                </a>
              </div>
            </div>

            {SECTIONS.map(section => (
              <div key={section.title}>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-fg-subtle">
                  {section.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {section.links.map(l => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-fg-muted transition-colors hover:text-fg"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col-reverse items-center justify-between gap-4 border-t border-hairline pt-6 sm:flex-row">
            <p className="text-xs text-fg-subtle">
              © {new Date().getFullYear()} Torneo Tenis Urbanova · Urbanova, Alicante
            </p>
            <Link
              href="/admin"
              className="text-xs text-fg-subtle/60 transition-colors hover:text-fg-muted"
            >
              Organización
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
