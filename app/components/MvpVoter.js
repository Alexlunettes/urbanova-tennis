'use client'
import { useState, useEffect } from 'react'

function getVoterToken() {
  let token = localStorage.getItem('mvp_voter_token')
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem('mvp_voter_token', token)
  }
  return token
}

export default function MvpVoter({ players }) {
  const [voted, setVoted] = useState(() => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('mvp_voted_for')
  })
  const [votedFor, setVotedFor] = useState(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('mvp_voted_for')
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [counts,  setCounts]  = useState({})

  // ✅ setCounts wordt aangeroepen in een .then()-callback, niet synchroon in de effect-body.
  // Dat is precies het patroon dat de linter verwacht.
  useEffect(() => {
    fetch('/api/mvp/counts')
      .then(res => res.ok ? res.json() : {})
      .then(data => setCounts(data))
      .catch(() => {})
  }, [])

  // Aparte functie, alleen gebruikt vanuit handleVote — niet in een effect.
  async function refreshCounts() {
    const res = await fetch('/api/mvp/counts')
    if (res.ok) setCounts(await res.json())
  }

  async function handleVote(player_id) {
    setLoading(true)
    setError('')
    try {
      const voter_token = getVoterToken()
      const res = await fetch('/api/mvp/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id, voter_token }),
      })
      const data = await res.json()

      if (data.error === 'already_voted') {
        setVoted(true)
      } else if (!res.ok) {
        setError('Error al votar. Inténtalo de nuevo.')
      } else {
        setVoted(true)
        setVotedFor(player_id)
        localStorage.setItem('mvp_voted_for', player_id)
        await refreshCounts()
      }
    } finally {
      setLoading(false)
    }
  }

  const totalVotes = Object.values(counts).reduce((s, n) => s + n, 0)

  const sortedPlayers = voted
    ? [...players].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))
    : players

  return (
    <div>
      {!voted && (
        <div className="mb-8 p-4 bg-gold/10 rounded-xl border border-gold/30">
          <p className="font-lato text-gray-700 text-sm">
            🗳️ <strong>Vota por el jugador que más te ha impresionado en este torneo.</strong>
            {' '}Solo un voto por dispositivo.
          </p>
        </div>
      )}

      {voted && (
        <div className="mb-8 p-4 bg-sage/10 rounded-xl border border-sage/30 flex items-center justify-between flex-wrap gap-2">
          <p className="font-lato text-gray-700 text-sm">
            ✅ <strong>¡Gracias por votar!</strong> Resultados en tiempo real:
          </p>
          <span className="font-bebas text-sage tracking-wide text-sm">
            {totalVotes} {totalVotes === 1 ? 'voto total' : 'votos totales'}
          </span>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm font-lato mb-4 bg-red-50 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPlayers.map(player => {
          const voteCount  = counts[player.id] ?? 0
          const pct        = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
          const isVotedFor = votedFor === player.id

          return (
            <div
              key={player.id}
              className={`rounded-xl border p-4 transition-all ${
                isVotedFor
                  ? 'border-gold bg-gold/10 shadow-sm'
                  : 'border-sage/20 bg-white hover:border-sage/40'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-lato font-bold text-gray-800 text-sm leading-tight">
                    {player.name}
                  </p>
                  <p className="font-lato text-xs text-gray-400 mt-0.5">Nivel {player.level}</p>
                </div>
                {isVotedFor && <span className="text-gold text-xl leading-none">⭐</span>}
              </div>

              {voted && (
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400 font-lato">
                      {voteCount} {voteCount === 1 ? 'voto' : 'votos'}
                    </span>
                    <span className="text-xs font-bold text-sage font-lato">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-sage/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sage rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}

              {!voted && (
                <button
                  onClick={() => handleVote(player.id)}
                  disabled={loading}
                  className="w-full mt-2 py-1.5 rounded-lg bg-sage text-white font-bebas tracking-wide text-sm hover:bg-sage/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? '…' : 'VOTAR'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}