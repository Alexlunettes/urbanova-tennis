'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'
import { cn } from '@/lib/cn'

const LINKS = [
  { href: '/equipos',      label: 'Parejas'       },
  { href: '/grupos',       label: 'Clasificación' },
  { href: '/partidos',     label: 'Partidos'      },
  { href: '/cuadro',       label: 'Cuadro'        },
  { href: '/estadisticas', label: 'Stats'         },
  { href: '/galeria',      label: 'Galería'       },
  { href: '/mvp',          label: 'MVP'           },
  { href: '/reglas',       label: 'Reglas'        },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // The header gains its border and blur only once the page has moved, so the
  // hero reads as edge-to-edge on first paint.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The sheet closes from the link's own onClick rather than from an effect
  // watching the pathname — one less cascading render, and it feels instant.

  // Stop the page behind the mobile sheet from scrolling.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const isActive = href => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300 ease-out',
        scrolled
          ? 'bg-canvas/80 backdrop-blur-xl border-b border-hairline'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <nav className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">

          <Link href="/" className="group flex items-center gap-2.5 shrink-0" aria-label="Inicio">
            <Emblem />
            <span className="hidden sm:flex flex-col leading-none">
              <span className="font-display text-lg text-fg tracking-wide">URBANOVA</span>
              <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-fg-subtle mt-0.5">
                Torneo 24h · 2026
              </span>
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-0.5">
            {LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'relative rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-200',
                  isActive(l.href)
                    ? 'text-fg'
                    : 'text-fg-muted hover:text-fg hover:bg-surface-2',
                )}
              >
                {l.label}
                {isActive(l.href) && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <button
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors"
              onClick={() => setOpen(o => !o)}
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={open}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {open
                  ? <path d="M18 6 6 18M6 6l12 12" />
                  : <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile sheet */}
      {open && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-canvas/95 backdrop-blur-xl animate-fade-in">
          <div className="h-full overflow-y-auto px-5 py-4 flex flex-col gap-1">
            {LINKS.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${i * 28}ms` }}
                className={cn(
                  'animate-fade-up flex items-center justify-between rounded-xl px-4 py-3.5',
                  'text-[15px] font-medium transition-colors',
                  isActive(l.href)
                    ? 'bg-accent-soft text-accent'
                    : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                )}
              >
                {l.label}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

/** Crossed rackets over a court — the emblem reduced to something legible at 36px. */
function Emblem() {
  return (
    <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-600 to-brand-800 shadow-sm ring-1 ring-brand-950/20 transition-transform duration-300 group-hover:scale-105">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <ellipse cx="8.2" cy="8.2" rx="4.1" ry="5.4" transform="rotate(-45 8.2 8.2)" stroke="#f9edd0" strokeWidth="1.5" />
        <ellipse cx="15.8" cy="8.2" rx="4.1" ry="5.4" transform="rotate(45 15.8 8.2)" stroke="#f9edd0" strokeWidth="1.5" />
        <path d="M10.4 12.4 8 21M13.6 12.4 16 21" stroke="#e9be65" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  )
}
