'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const LINKS = [
  { href: '/',        label: 'Inicio'  },
  { href: '/equipos', label: 'Equipos' },
  { href: '/reglas',  label: 'Reglas'  },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-sage sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-bebas text-lg text-cream/80 tracking-[0.12em]">
            TORNEO TENIS
          </span>
          <span className="font-bebas text-2xl text-gold tracking-[0.12em] -mt-0.5">
            URBANOVA 2026
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`font-lato font-bold text-xs uppercase tracking-[0.2em] transition-colors duration-150 ${
                pathname === href
                  ? 'text-gold'
                  : 'text-cream hover:text-gold-light'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-cream p-1"
          onClick={() => setOpen(v => !v)}
          aria-label="Abrir menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="md:hidden bg-sage-dark px-4 pb-4 pt-2 border-t border-cream/10">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`block py-2.5 font-lato font-bold text-xs uppercase tracking-[0.2em] ${
                pathname === href ? 'text-gold' : 'text-cream'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}