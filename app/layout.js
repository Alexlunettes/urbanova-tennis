import { Bebas_Neue, Lato } from 'next/font/google'
import Navbar from './components/Navbar'
import './globals.css'

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const lato = Lato({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-lato',
  display: 'swap',
})

export const metadata = {
  title: 'Torneo Tenis Urbanova 2026',
  description: 'Torneo de dobles · Urbanova, Alicante · 6–9 de agosto de 2026 · 3ª edición',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${bebas.variable} ${lato.variable}`}>
      <body className="font-lato bg-cream text-forest">
        <Navbar />
        {children}
      </body>
    </html>
  )
}