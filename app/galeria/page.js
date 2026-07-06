'use client'
import { useState } from 'react'
import { PHOTOS } from '@/lib/photos'

export default function Galeria() {
  const years = Object.keys(PHOTOS).map(Number).sort((a, b) => b - a)
  const [activeYear, setActiveYear] = useState(years[0])
  const [lightbox, setLightbox] = useState(null) // index of the open photo, or null

  const currentPhotos = PHOTOS[activeYear] ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="font-bebas text-5xl text-sage tracking-widest mb-2">GALERÍA</h1>
      <p className="font-lato text-gray-500 mb-8">
        Fotos de las ediciones anteriores del torneo.
      </p>

      {/* Year tabs */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {years.map(year => (
          <button
            key={year}
            onClick={() => { setActiveYear(year); setLightbox(null) }}
            className={`font-bebas tracking-wider px-5 py-2 rounded-full text-sm transition-colors ${
              activeYear === year
                ? 'bg-sage text-white'
                : 'bg-sage/10 text-sage hover:bg-sage/20'
            }`}
          >
            Edición {year}
          </button>
        ))}
      </div>

      {/* Photo grid — masonry style with CSS columns */}
      {currentPhotos.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="font-bebas text-2xl tracking-wide mb-2">FOTOS PRÓXIMAMENTE</p>
          <p className="font-lato text-sm">
            Añade imágenes a <code className="bg-gray-100 px-1 rounded">public/fotos/{activeYear}/</code> y
            actualiza <code className="bg-gray-100 px-1 rounded">lib/photos.js</code>
          </p>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 gap-3 space-y-3">
          {currentPhotos.map((photo, i) => (
            <div
              key={i}
              className="break-inside-avoid cursor-pointer rounded-xl overflow-hidden group relative"
              onClick={() => setLightbox(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
            </div>
          ))}
        </div>
      )}

      {/* ─── Lightbox ─── */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 text-white/60 hover:text-white text-3xl leading-none transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>

          {/* Previous */}
          <button
            onClick={e => { e.stopPropagation(); setLightbox(l => l - 1) }}
            disabled={lightbox === 0}
            className="absolute left-4 text-white/60 hover:text-white text-6xl font-light disabled:opacity-20 transition-colors select-none"
            aria-label="Anterior"
          >
            ‹
          </button>

          {/* Image */}
          <div
            className="max-h-[90vh] max-w-[90vw] flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPhotos[lightbox].src}
              alt={currentPhotos[lightbox].alt}
              className="max-h-[80vh] max-w-[85vw] object-contain rounded-lg"
            />
            <p className="text-white/50 text-sm font-lato mt-3">
              {currentPhotos[lightbox].alt} · {lightbox + 1} / {currentPhotos.length}
            </p>
          </div>

          {/* Next */}
          <button
            onClick={e => { e.stopPropagation(); setLightbox(l => l + 1) }}
            disabled={lightbox === currentPhotos.length - 1}
            className="absolute right-4 text-white/60 hover:text-white text-6xl font-light disabled:opacity-20 transition-colors select-none"
            aria-label="Siguiente"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}