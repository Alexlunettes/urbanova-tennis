'use client'

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin-login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/admin')
      router.refresh()          // forces the server component to re-read the cookie
    } else {
      const data = await res.json()
      console.log('ENV:', JSON.stringify(process.env.ADMIN_PASSWORD))
      console.log('Got:', JSON.stringify(password))
      setError(data.error || 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sage/10 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🔐</span>
          <h1 className="font-bebas text-3xl text-gray-900 tracking-wide mt-3">
            PANEL DE ADMIN
          </h1>
          <p className="font-lato text-sm text-gray-500 mt-1">
            Solo para la organización del torneo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoComplete="current-password"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 font-lato text-sm focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage"
          />

          {error && (
            <p className="font-lato text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-sage text-white font-lato font-bold text-sm py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? 'Comprobando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}