import { supabase } from '@/lib/supabase'
import Countdown from './components/Countdown'
import Link from 'next/link'

export const revalidate = 60

export default async function Home() {
  const { data: teams } = await supabase.from('teams').select('id')
  const teamCount = teams?.length ?? 0

  return (
    <>
      {/* HERO */}
      <section className="bg-sage min-h-[80vh] flex flex-col items-center justify-center text-center px-4 py-20 gap-10">
        <div>
          <p className="font-lato text-xs text-gold uppercase tracking-[0.35em] mb-3">
            3ª Edición · Urbanova, Alicante
          </p>
          <h1 className="font-bebas text-[18vw] md:text-[10rem] lg:text-[11rem] text-cream leading-none tracking-wide">
            TORNEO<br />URBANOVA
          </h1>
          <p className="font-lato text-cream/70 text-sm md:text-base mt-3 tracking-wide">
            Tenis de dobles · 6–9 de agosto de 2026
          </p>
        </div>

        <Countdown />

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/equipos"
            className="bg-gold hover:bg-gold-light text-cream font-lato font-bold text-xs uppercase tracking-[0.2em] px-8 py-3 rounded-full transition-colors duration-200"
          >
            Ver equipos
          </Link>
          <Link
            href="/reglas"
            className="border border-cream/30 hover:border-cream text-cream font-lato font-bold text-xs uppercase tracking-[0.2em] px-8 py-3 rounded-full transition-colors duration-200"
          >
            Reglamento
          </Link>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="bg-cream-dark py-10 px-4 border-y border-sage/20">
        <div className="max-w-3xl mx-auto grid grid-cols-3 divide-x divide-sage/20 text-center">
          {[
            { stat: '6–9 AGO',                       label: 'Fechas'           },
            { stat: teamCount > 0 ? teamCount : '—', label: 'Equipos'          },
            { stat: '3',                              label: 'Niveles de juego' },
          ].map(({ stat, label }) => (
            <div key={label} className="px-4 py-2">
              <p className="font-bebas text-4xl md:text-5xl text-sage leading-none">{stat}</p>
              <p className="font-lato text-gray-500 text-xs uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-bebas text-5xl text-sage tracking-wide mb-4">EL TORNEO</h2>
          <p className="font-lato text-gray-600 leading-relaxed">
            El Torneo Tenis Urbanova reúne a jugadores de todos los niveles en el verano
            alicantino. Un torneo de dobles organizado por amigos, para amigos — con
            competición real, buen ambiente y mucho sol. Este agosto celebramos la tercera edición.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            
            <a
              href="https://www.instagram.com/urbanovatenis"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sage font-lato font-bold text-sm hover:text-sage-dark transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @urbanovatenis
            </a>
            
            <a
              href="mailto:torneourbanova@gmail.com"
              className="flex items-center justify-center gap-2 text-gray-400 font-lato font-bold text-sm hover:text-gray-600 transition-colors"
            >
              torneourbanova@gmail.com
            </a>
          </div>
        </div>
      </section>
    </>
  )
}