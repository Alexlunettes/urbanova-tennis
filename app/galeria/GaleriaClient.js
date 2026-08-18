'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { CATEGORY_META } from '@/lib/tournament'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import EmptyState from '@/app/components/ui/EmptyState'
import Badge from '@/app/components/ui/Badge'
import { cn } from '@/lib/cn'

/**
 * Photos, one section per edition.
 *
 * The page keeps the name "Galería" — it is what people already look for, and
 * in Spanish it reads naturally as covering video as well as stills. The
 * section tabs make the actual contents explicit, which is what was missing.
 */

const SECTIONS = [
  { key: '2026', label: 'Fotos 2026' },
  { key: '2025', label: 'Fotos 2025' },
]

export default function GaleriaClient({ photosByYear = {} }) {
  const [section, setSection]   = useState('2026')
  const [lightbox, setLightbox] = useState(null)

  const active = SECTIONS.find(s => s.key === section) ?? SECTIONS[0]
  const photos = photosByYear[active.key] ?? []

  const isOpen = lightbox !== null
  const count  = photos.length

  useEffect(() => {
    if (!isOpen) return
    const onKey = e => {
      if (e.key === 'Escape')     setLightbox(null)
      if (e.key === 'ArrowLeft')  setLightbox(i => (i > 0 ? i - 1 : i))
      if (e.key === 'ArrowRight') setLightbox(i => (i !== null && i < count - 1 ? i + 1 : i))
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, count])

  function pickSection(key) {
    setSection(key)
    setLightbox(null)
  }

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Fotos y vídeo"
        title="GALERÍA"
        description="Todas las imágenes del torneo, edición por edición."
      />

      {/* ── Section tabs ── */}
      <div className="-mx-5 overflow-x-auto px-5 no-scrollbar sm:mx-0 sm:px-0">
        <div className="inline-flex min-w-max gap-1 rounded-2xl border border-hairline bg-surface-2 p-1">
          {SECTIONS.map(s => {
            const n = (photosByYear[s.key] ?? []).length
            return (
              <button
                key={s.key}
                onClick={() => pickSection(s.key)}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                  section === s.key ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
                )}
              >
                <CameraIcon small />
                {s.label}
                {n > 0 && (
                  <span
                    className={cn(
                      'tabular rounded-md px-1.5 py-0.5 font-mono text-[10px]',
                      section === s.key ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-fg-subtle',
                    )}
                  >
                    {n}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8">
        <PhotoGrid photos={photos} year={active.key} onOpen={setLightbox} />
      </div>

      {isOpen && photos[lightbox] && (
        <Lightbox
          photos={photos}
          index={lightbox}
          year={active.key}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox(i => (i > 0 ? i - 1 : i))}
          onNext={() => setLightbox(i => (i !== null && i < count - 1 ? i + 1 : i))}
        />
      )}
    </PageShell>
  )
}

/* ──────────────────────────── PHOTOS ──────────────────────────── */

function PhotoGrid({ photos, year, onOpen }) {
  if (photos.length === 0) {
    return (
      <EmptyState
        icon={<CameraIcon />}
        title={`Fotos de ${year} próximamente`}
        description={
          year === '2026'
            ? 'Todavía no se han subido imágenes de la edición 2026.'
            : `Todavía no se han subido imágenes de la edición ${year}.`
        }
      />
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
      {photos.map((photo, i) => (
        <button
          key={photo.src}
          onClick={() => onOpen(i)}
          className="group relative aspect-square overflow-hidden rounded-xl border border-hairline bg-surface-2"
          aria-label={`Abrir foto ${i + 1} de ${photos.length}`}
        >
          <Image
            src={photo.src}
            alt={photo.alt ?? `Torneo Tenis Urbanova ${year} — foto ${i + 1}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading={i < 8 ? 'eager' : 'lazy'}
          />
          <span className="absolute inset-0 bg-ink-950/0 transition-colors duration-300 group-hover:bg-ink-950/15" />
        </button>
      ))}
    </div>
  )
}

function Lightbox({ photos, index, year, onClose, onPrev, onNext }) {
  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-ink-950/95 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Visor de fotos"
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        aria-label="Cerrar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <NavButton side="left"  onClick={onPrev} disabled={index === 0} />
      <NavButton side="right" onClick={onNext} disabled={index === photos.length - 1} />

      <div
        className="relative flex h-full w-full flex-col items-center justify-center p-4 sm:p-12"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative h-full max-h-[82vh] w-full max-w-5xl">
          <Image
            src={photos[index].src}
            alt={photos[index].alt ?? `Torneo Tenis Urbanova ${year} — foto ${index + 1}`}
            fill
            sizes="90vw"
            className="object-contain"
            priority
          />
        </div>
        <p className="tabular mt-4 font-mono text-xs text-white/50">
          {index + 1} / {photos.length}
        </p>
      </div>
    </div>
  )
}

function NavButton({ side, onClick, disabled }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      disabled={disabled}
      aria-label={side === 'left' ? 'Foto anterior' : 'Foto siguiente'}
      className={cn(
        'absolute z-10 flex h-11 w-11 items-center justify-center rounded-full',
        'bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white',
        'disabled:pointer-events-none disabled:opacity-20',
        side === 'left' ? 'left-3 sm:left-6' : 'right-3 sm:right-6',
      )}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d={side === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
      </svg>
    </button>
  )
}

/* ─────────────────────────── ICONS ─────────────────────────── */

function CameraIcon({ small = false }) {
  const s = small ? 14 : 20
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.8l1.2-2h6.9l1.2 2h1.9A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z" />
      <circle cx="12" cy="13" r="3.6" />
    </svg>
  )
}

