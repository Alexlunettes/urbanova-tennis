'use client'

import Link           from 'next/link'
import { usePathname } from 'next/navigation'
import { useState }   from 'react'

const links = [
  { href: '/',         label: 'Inicio'   },
  { href: '/equipos',  label: 'Equipos'  },
  { href: '/grupos',   label: 'Grupos'   },
  { href: '/partidos', label: 'Partidos' },
  { href: '/cuadro',   label: 'Cuadro'   },   // ← add this
  { href: '/reglas',   label: 'Reglas'   },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  function isActive(href) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <nav className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

        <Link
          href="/"
          className="font-bebas text-xl tracking-wide text-gray-900 hover:text-sage transition-colors"
        >
          TORNEO URBANOVA 2026
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`font-lato font-bold text-sm transition-colors ${
                isActive(l.href)
                  ? 'text-sage border-b-2 border-sage pb-0.5'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4">
          <div className="flex flex-col gap-1 pt-2">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`font-lato font-bold text-sm py-2.5 px-3 rounded-lg transition-colors ${
                  isActive(l.href)
                    ? 'bg-sage/10 text-sage'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}