'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { PHOTOS } from '@/lib/photos'
import PageHeader, { PageShell } from '@/app/components/ui/PageHeader'
import EmptyState from '@/app/components/ui/EmptyState'
import { cn } from '@/lib/cn'

export default function GaleriaPage() {
  const years = Object.keys(PHOTOS).map(Number).sort((a, b) => b - a)
  const [year, setYear] = useState(years[0])
  const [lightbox, setLightbox] = useState(null)

  const photos = PHOTOS[year] ?? []

  // Plain functions: the React Compiler memoizes these itself, and a manual
  // useCallback here makes it bail out of optimizing the whole component.
  const close = () => setLightbox(null)
  const prev  = () => setLightbox(i => (i > 0 ? i - 1 : i))
  const next  = () => setLightbox(i => (i !== null && i < photos.length - 1 ? i + 1 : i))

  // Keyboard control for the lightbox, and a scroll lock while it is open.
  // The handlers are inlined and use updater functions, so the effect depends
  // only on whether the lightbox is open — not on identities that change each
  // render.
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

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Archivo"
        title="GALERÍA"
        description="Momentos de las ediciones anteriores del torneo, de los primeros saques a las finales de madrugada."
      />

      <div className="mb-8 inline-flex gap-1 rounded-2xl border border-hairline bg-surface-2 p-1">
        {years.map(y => (
          <button
            key={y}
            onClick={() => { setYear(y); setLightbox(null) }}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
              y === year
                ? 'bg-surface text-fg shadow-sm'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            Edición {y}
          </button>
        ))}
      </div>

      {photos.length === 0 ? (
        <EmptyState
          icon={<CameraIcon />}
          title="Fotos próximamente"
          description={`Las imágenes de la edición ${year} se publicarán durante el torneo.`}
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              onClick={() => setLightbox(i)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-hairline bg-surface-2"
              aria-label={`Abrir foto ${i + 1} de ${photos.length}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt ?? `Torneo Urbanova ${year} — foto ${i + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                loading={i < 8 ? 'eager' : 'lazy'}
              />
              <span className="absolute inset-0 bg-ink-950/0 transition-colors duration-300 group-hover:bg-ink-950/15" />
            </button>
          ))}
        </div>
      )}

      {lightbox !== null && photos[lightbox] && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-ink-950/95 backdrop-blur-sm animate-fade-in"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Visor de fotos"
        >
          <button
            onClick={close}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <NavButton side="left"  onClick={prev} disabled={lightbox === 0} />
          <NavButton side="right" onClick={next} disabled={lightbox === photos.length - 1} />

          <div
            className="relative flex h-full w-full flex-col items-center justify-center p-4 sm:p-12"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative h-full max-h-[82vh] w-full max-w-5xl">
              <Image
                src={photos[lightbox].src}
                alt={photos[lightbox].alt ?? `Torneo Urbanova ${year} — foto ${lightbox + 1}`}
                fill
                sizes="90vw"
                className="object-contain"
                priority
              />
            </div>
            <p className="tabular mt-4 font-mono text-xs text-white/50">
              {lightbox + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </PageShell>
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

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.8l1.2-2h6.9l1.2 2h1.9A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z" />
      <circle cx="12" cy="13" r="3.6" />
    </svg>
  )
}
