import { Bebas_Neue, Geist, Geist_Mono } from 'next/font/google'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import './globals.css'

/* Bebas carries the tournament identity on display type; Geist handles all
   running text and UI; Geist Mono keeps scores and standings in true columns. */
const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata = {
  title: {
    default:  'Torneo Tenis Urbanova 2026',
    template: '%s · Torneo Tenis Urbanova',
  },
  description:
    'III edición del Torneo Tenis Urbanova. 40 parejas y cuatro divisiones, de jueves a domingo. Urbanova, Alicante · 6–9 de agosto de 2026.',
  keywords: ['tenis', 'torneo', 'Urbanova', 'Alicante', 'dobles', 'Torneo Tenis Urbanova'],
  openGraph: {
    title:       'Torneo Tenis Urbanova 2026',
    description: '40 parejas · 4 divisiones · de jueves a domingo. Urbanova, Alicante.',
    locale:      'es_ES',
    type:        'website',
  },
  robots: { index: true, follow: true },
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfbf9' },
    { media: '(prefers-color-scheme: dark)',  color: '#0a0d0c' },
  ],
}

/**
 * Applies the saved theme before first paint. Without this the page renders in
 * light and then flips — the classic dark-mode flash.
 */
const THEME_SCRIPT = `(function(){try{
  var s=localStorage.getItem('theme');
  var d=s==='dark'||(!s&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark',d);
}catch(e){}})()`

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${bebas.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="font-sans antialiased bg-canvas text-fg">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-accent-fg"
        >
          Saltar al contenido
        </a>
        <Navbar />
        <div id="contenido">{children}</div>
        <Footer />
      </body>
    </html>
  )
}
