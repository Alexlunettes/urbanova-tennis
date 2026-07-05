'use client'

import { useState } from 'react'

const LEVEL_LABELS = { 1: 'Nivel 1', 2: 'Nivel 2', 3: 'Nivel 3' }

function emptySetState() {
  return [
    { team1_score: '', team2_score: '' },
    { team1_score: '', team2_score: '' },
    { team1_score: '', team2_score: '' }, // set 3 / super tiebreak
  ]
}

export default function AdminPanel({ initialPending, initialCompleted }) {
  const [pending, setPending]       = useState(initialPending)
  const [completed, setCompleted]   = useState(initialCompleted)
  const [selectedId, setSelectedId] = useState(null)
  const [sets, setSets]             = useState(emptySetState())
  const [loading, setLoading]       = useState(false)
  const [flash, setFlash]           = useState(null)  // { type:'ok'|'err', msg }

  function selectMatch(id) {
    setSelectedId(id)
    setSets(emptySetState())
    setFlash(null)
  }

  function updateSet(idx, side, raw) {
    setSets(prev =>
      prev.map((s, i) =>
        i === idx ? { ...s, [side]: raw === '' ? '' : Number(raw) } : s
      )
    )
  }

  const selectedMatch = pending.find(m => m.id === selectedId)

  // Validity helpers
  const s1ok = sets[0].team1_score !== '' && sets[0].team2_score !== ''
  const s2ok = sets[1].team1_score !== '' && sets[1].team2_score !== ''

  const t1After2 = [sets[0], sets[1]].filter(
    s => s.team1_score !== '' && Number(s.team1_score) > Number(s.team2_score)
  ).length
  const t2After2 = [sets[0], sets[1]].filter(
    s => s.team2_score !== '' && Number(s.team2_score) > Number(s.team1_score)
  ).length

  const needsSet3 = s1ok && s2ok && t1After2 === 1 && t2After2 === 1
  const s3ok      = sets[2].team1_score !== '' && sets[2].team2_score !== ''
  const canSubmit = s1ok && s2ok && (!needsSet3 || s3ok)

  async function handleSubmit() {
    if (!canSubmit || !selectedMatch) return
    setLoading(true)
    setFlash(null)

    const setsPayload = [
      { set_number: 1, ...sets[0] },
      { set_number: 2, ...sets[1] },
      ...(needsSet3 ? [{ set_number: 3, ...sets[2] }] : []),
    ]

    const res = await fetch(`/api/matches/${selectedId}/score`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sets: setsPayload }),
    })

    if (res.ok) {
      const t1Sets = setsPayload.filter(s => s.team1_score > s.team2_score).length
      const winner = t1Sets >= 2 ? selectedMatch.team1 : selectedMatch.team2

      setCompleted(prev => [{
        ...selectedMatch,
        completed: true,
        winner,
        sets: setsPayload,
      }, ...prev])
      setPending(prev => prev.filter(m => m.id !== selectedId))
      setSelectedId(null)
      setSets(emptySetState())
      setFlash({ type: 'ok',
        msg: `✓ Resultado guardado: ${selectedMatch.team1?.name} vs ${selectedMatch.team2?.name}` })
    } else {
      const data = await res.json()
      setFlash({ type: 'err', msg: data.error || 'Error desconocido' })
    }
    setLoading(false)
  }

  // Group pending by level for display
  const pendingByLevel = {}
  for (const m of pending) {
    if (!pendingByLevel[m.level]) pendingByLevel[m.level] = []
    pendingByLevel[m.level].push(m)
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 min-h-screen">
      <h1 className="font-bebas text-5xl text-gray-900 tracking-wide mb-1">
        ADMINISTRACIÓN
      </h1>
      <p className="font-lato text-sm text-gray-500 mb-8">
        Fase de grupos · introduce los resultados de los partidos.
      </p>

      {flash && (
        <div className={`mb-6 rounded-xl px-4 py-3 font-lato text-sm border ${
          flash.type === 'ok'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {flash.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* ── LEFT: pending matches ── */}
        <div>
          <h2 className="font-bebas text-2xl tracking-wide mb-4 text-gold">
            PENDIENTES ({pending.length})
          </h2>

          {pending.length === 0 ? (
            <div className="bg-green-50 rounded-2xl border border-green-100 p-8 text-center">
              <p className="font-lato text-green-700 text-sm">
                🎾 ¡Todos los partidos completados!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(pendingByLevel)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([lvl, matches]) => (
                  <div key={lvl}>
                    <p className="font-lato font-bold text-xs text-gray-400 uppercase tracking-widest mb-2">
                      {LEVEL_LABELS[Number(lvl)]}
                    </p>
                    <div className="space-y-2">
                      {matches.map(match => (
                        <button
                          key={match.id}
                          onClick={() => selectMatch(match.id)}
                          className={`w-full text-left rounded-xl border p-3 transition-all ${
                            selectedId === match.id
                              ? 'border-sage bg-sage/10 ring-1 ring-sage/30'
                              : 'border-gray-200 bg-white hover:border-sage/40 hover:bg-sage/5'
                          }`}
                        >
                          <p className="font-lato font-bold text-sm text-gray-900">
                            {match.team1?.name}{' '}
                            <span className="font-normal text-gray-400">vs</span>{' '}
                            {match.team2?.name}
                          </p>
                          <p className="font-lato text-xs text-gray-400 mt-0.5">
                            {[
                              match.tournament_groups?.name,
                              match.court && `Pista ${match.court}`,
                            ].filter(Boolean).join(' · ')}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: score form ── */}
        <div>
          <h2 className="font-bebas text-2xl tracking-wide mb-4 text-gold">RESULTADO</h2>

          {selectedMatch ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="font-lato text-xs text-gray-400 mb-4">
                {selectedMatch.tournament_groups?.name}
              </p>

              {/* Team name headers */}
              <div className="grid grid-cols-[1fr_88px_1fr] gap-2 mb-1">
                <p className="font-lato font-bold text-xs text-gray-700 truncate">
                  {selectedMatch.team1?.name}
                </p>
                <div />
                <p className="font-lato font-bold text-xs text-gray-700 text-right truncate">
                  {selectedMatch.team2?.name}
                </p>
              </div>

              {/* Sets 1 & 2 */}
              {[0, 1].map(i => (
                <div key={i} className="grid grid-cols-[1fr_88px_1fr] gap-2 mb-3 items-center">
                  <input
                    type="number" min="0" max="7"
                    value={sets[i].team1_score}
                    onChange={e => updateSet(i, 'team1_score', e.target.value)}
                    placeholder="0"
                    className="border border-gray-200 rounded-xl px-3 py-3 text-center font-lato font-bold text-2xl focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage"
                  />
                  <p className="font-lato text-xs text-gray-400 text-center font-bold">
                    SET {i + 1}
                  </p>
                  <input
                    type="number" min="0" max="7"
                    value={sets[i].team2_score}
                    onChange={e => updateSet(i, 'team2_score', e.target.value)}
                    placeholder="0"
                    className="border border-gray-200 rounded-xl px-3 py-3 text-center font-lato font-bold text-2xl focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage"
                  />
                </div>
              ))}

              {/* Set 3 — only appears when each team won one set */}
              {needsSet3 && (
                <div className="grid grid-cols-[1fr_88px_1fr] gap-2 mb-3 items-center">
                  <input
                    type="number" min="0" max="30"
                    value={sets[2].team1_score}
                    onChange={e => updateSet(2, 'team1_score', e.target.value)}
                    placeholder="0"
                    className="border-2 border-sage rounded-xl px-3 py-3 text-center font-lato font-bold text-2xl focus:outline-none focus:ring-2 focus:ring-sage/40"
                  />
                  <p className="font-lato text-xs text-sage text-center font-bold">
                    SUPER TB
                  </p>
                  <input
                    type="number" min="0" max="30"
                    value={sets[2].team2_score}
                    onChange={e => updateSet(2, 'team2_score', e.target.value)}
                    placeholder="0"
                    className="border-2 border-sage rounded-xl px-3 py-3 text-center font-lato font-bold text-2xl focus:outline-none focus:ring-2 focus:ring-sage/40"
                  />
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
                className="w-full mt-2 bg-sage text-white font-lato font-bold text-sm py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Guardar resultado →'}
              </button>
            </div>
          ) : (
            <div className="bg-sage/5 rounded-2xl border border-sage/20 p-10 text-center">
              <p className="font-lato text-gray-400 text-sm">
                ← Selecciona un partido para introducir su resultado.
              </p>
            </div>
          )}

          {/* Completed log */}
          {completed.length > 0 && (
            <div className="mt-8">
              <h3 className="font-bebas text-xl tracking-wide mb-3 text-gold">
                COMPLETADOS ({completed.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {completed.map(match => {
                  const matchSets = (match.sets || [])
                    .sort((a, b) => a.set_number - b.set_number)
                  return (
                    <div
                      key={match.id}
                      className="bg-gray-50 rounded-xl px-4 py-2.5 flex items-center gap-3"
                    >
                      <p className={`font-lato text-sm font-bold truncate flex-1 ${
                        match.winner?.id === match.team1?.id ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {match.team1?.name}
                      </p>
                      <p className="font-lato text-xs text-gray-400 shrink-0 tabular-nums">
                        {matchSets.map(s => `${s.team1_score}–${s.team2_score}`).join(' ')}
                      </p>
                      <p className={`font-lato text-sm font-bold truncate flex-1 text-right ${
                        match.winner?.id === match.team2?.id ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {match.team2?.name}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}