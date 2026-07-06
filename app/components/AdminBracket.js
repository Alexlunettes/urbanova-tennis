'use client'

import { useState }  from 'react'
import { useRouter } from 'next/navigation'

const LEVEL_LABELS = { 1: 'Nivel 1', 2: 'Nivel 2', 3: 'Nivel 3' }

function emptySetState() {
  return [
    { team1_score: '', team2_score: '' },
    { team1_score: '', team2_score: '' },
    { team1_score: '', team2_score: '' },
  ]
}

export default function AdminBracket({ initialEncounters }) {
  const router = useRouter()
  const encounters = initialEncounters   // geen useState, geen useEffect

  const [selectedMatchId, setSelectedMatchId] = useState(null)
  const [sets,   setSets]   = useState(emptySetState())
  const [loading, setLoading] = useState(false)
  const [flash,  setFlash]  = useState(null)

  function updateSet(idx, side, raw) {
    setSets(prev => prev.map((s, i) =>
      i === idx ? { ...s, [side]: raw === '' ? '' : Number(raw) } : s
    ))
  }

 async function post(url, body) {
  setLoading(true); setFlash(null)
  try {
    const res  = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    let data = {}
    try { data = JSON.parse(text) } catch { /**/ }
    setLoading(false)
    if (res.ok) {
      window.location.reload()       // ← was: router.refresh()
      return { ok: true, data }
    }
    setFlash({ type: 'err', msg: data.error || 'Error desconocido' })
    return { ok: false }
  } catch (err) {
    setLoading(false)
    setFlash({ type: 'err', msg: err.message || 'Netwerkfout' })
    return { ok: false }
  }
}

  async function handleSeedBracket(level) {
    const r = await post('/api/bracket/seed', { level })
    if (r.ok) setFlash({ type: 'ok', msg: `✓ Cuadro creado — ${r.data.sf1} | ${r.data.sf2}` })
  }

  async function handleSeedFinal(level) {
    const r = await post('/api/bracket/seed-final', { level })
    if (r.ok) setFlash({ type: 'ok', msg: '✓ Final generada con los ganadores de las semis' })
  }

  // Score entry state
  const selectedEnc = encounters.find(e => e.match?.id === selectedMatchId)
  const s1ok = sets[0].team1_score !== '' && sets[0].team2_score !== ''
  const s2ok = sets[1].team1_score !== '' && sets[1].team2_score !== ''
  const t1After2 = [sets[0], sets[1]].filter(s => Number(s.team1_score) > Number(s.team2_score)).length
  const t2After2 = [sets[0], sets[1]].filter(s => Number(s.team2_score) > Number(s.team1_score)).length
  const needsSet3 = s1ok && s2ok && t1After2 === 1 && t2After2 === 1
  const s3ok      = sets[2].team1_score !== '' && sets[2].team2_score !== ''
  const canSubmit = s1ok && s2ok && (!needsSet3 || s3ok)

  async function handleScoreSubmit() {
    if (!canSubmit || !selectedMatchId) return
    const setsPayload = [
      { set_number: 1, ...sets[0] },
      { set_number: 2, ...sets[1] },
      ...(needsSet3 ? [{ set_number: 3, ...sets[2] }] : []),
    ]
    const r = await post(`/api/matches/${selectedMatchId}/score`, { sets: setsPayload })
    if (r.ok) {
      setFlash({ type: 'ok', msg: '✓ Resultado guardado' })
      setSelectedMatchId(null)
      setSets(emptySetState())
    }
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-10 border-t-2 border-gray-100">
      <h2 className="font-bebas text-4xl text-gray-900 tracking-wide mb-1">CUADRO FINAL</h2>
      <p className="font-lato text-sm text-gray-500 mb-8">
        Genera las semifinales, introduce resultados y genera la final.
      </p>

      {flash && (
        <div className={`mb-6 rounded-xl px-4 py-3 font-lato text-sm border ${
          flash.type === 'ok'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {flash.msg}
        </div>
      )}

      {[1, 2, 3].map(lvl => {
        const lvlEnc = encounters.filter(e => e.level === lvl)
        const sfs    = lvlEnc.filter(e => e.round === 'semifinal')
        const final  = lvlEnc.find(e => e.round === 'final')
        const sfsDone = sfs.length === 2 && sfs.every(sf => sf.match?.completed)

        return (
          <div key={lvl} className="mb-8 bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bebas text-2xl text-sage tracking-wide mb-5">{LEVEL_LABELS[lvl]}</h3>

            {/* No bracket yet → seed button */}
            {lvlEnc.length === 0 && (
              <button
                onClick={() => handleSeedBracket(lvl)}
                disabled={loading}
                className="font-lato font-bold text-sm bg-sage text-white px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Sembrar cuadro (desde clasificación de grupos)
              </button>
            )}

            {/* SF match rows */}
            {sfs.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="font-lato font-bold text-xs text-gray-400 uppercase tracking-widest mb-2">
                  Semifinales
                </p>
                {sfs.map(sf => (
                  <KOMatchRow
                    key={sf.id} enc={sf}
                    isSelected={selectedMatchId === sf.match?.id}
                    onSelect={() => {
                      if (!sf.match?.id) return
                      setSelectedMatchId(sf.match.id)
                      setSets(emptySetState())
                      setFlash(null)
                    }}
                  />
                ))}
              </div>
            )}

            {/* Generate final button (appears when both SFs done and final not yet created) */}
            {sfsDone && !final?.match_id && (
              <button
                onClick={() => handleSeedFinal(lvl)}
                disabled={loading}
                className="mt-2 font-lato font-bold text-sm bg-gold text-white px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                Generar final →
              </button>
            )}

            {/* Final match row */}
            {final?.match_id && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="font-lato font-bold text-xs text-gray-400 uppercase tracking-widest mb-2">
                  Final
                </p>
                <KOMatchRow
                  enc={final}
                  isSelected={selectedMatchId === final.match?.id}
                  onSelect={() => {
                    if (!final.match?.id || final.match?.completed) return
                    setSelectedMatchId(final.match.id)
                    setSets(emptySetState())
                    setFlash(null)
                  }}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Floating score entry panel */}
      {selectedMatchId && selectedEnc && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-sage shadow-2xl p-5 z-50">
          <div className="max-w-md mx-auto">
            <p className="font-bebas text-xl text-gray-900 tracking-wide mb-4">
              {selectedEnc.team1?.name ?? '?'} <span className="text-gray-400">vs</span> {selectedEnc.team2?.name ?? '?'}
            </p>
            <div className="flex flex-col gap-3">
              {[0, 1, ...(needsSet3 ? [2] : [])].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <span className="font-lato text-xs text-gray-400 w-12">
                    Set {i + 1}{i === 2 ? ' *' : ''}
                  </span>
                  <input
                    type="number" min="0" max="99"
                    value={sets[i].team1_score}
                    onChange={e => updateSet(i, 'team1_score', e.target.value)}
                    className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 font-lato text-sm text-center focus:outline-none focus:ring-2 focus:ring-sage/40"
                  />
                  <span className="text-gray-400">—</span>
                  <input
                    type="number" min="0" max="99"
                    value={sets[i].team2_score}
                    onChange={e => updateSet(i, 'team2_score', e.target.value)}
                    className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 font-lato text-sm text-center focus:outline-none focus:ring-2 focus:ring-sage/40"
                  />
                </div>
              ))}
            </div>
            {needsSet3 && <p className="font-lato text-xs text-gray-400 mt-1 italic">* Super tiebreak</p>}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleScoreSubmit}
                disabled={!canSubmit || loading}
                className="flex-1 bg-sage text-white font-lato font-bold text-sm py-3 rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {loading ? 'Guardando...' : 'Guardar resultado'}
              </button>
              <button
                onClick={() => { setSelectedMatchId(null); setSets(emptySetState()) }}
                className="px-4 py-3 font-lato text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function KOMatchRow({ enc, isSelected, onSelect }) {
  const hasMatch    = !!enc.match?.id
  const isCompleted = !!enc.match?.completed
  const matchSets = (enc.match?.sets || []).sort((a, b) => a.set_number - b.set_number)

  async function handleReset() {
    if (!enc.match?.id) return
    if (!confirm('¿Resetear este partido? Se borrarán todos los sets.')) return

    const res = await fetch(`/api/matches/${enc.match.id}/reset`, { method: 'POST' })
    if (res.ok) {
      window.location.reload()
      return
    }

    const { error } = await res.json()
    alert('Error: ' + (error || 'No se pudo resetear'))
  }

  return (
    <div
      className={`w-full rounded-xl border px-4 py-3 transition-colors ${
        isSelected
          ? 'border-sage bg-sage/5'
          : isCompleted
          ? 'border-gray-100 bg-gray-50'
          : hasMatch
          ? 'border-gray-200 bg-white hover:border-sage/50 hover:bg-sage/5'
          : 'border-dashed border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onSelect}
          disabled={!hasMatch || isCompleted}
          className={`flex min-w-0 flex-1 items-center text-left ${
            !hasMatch || isCompleted ? 'cursor-default' : 'cursor-pointer'
          }`}
        >
          <span className="font-lato text-sm text-gray-800 truncate">
            {enc.team1?.name ?? '—'} <span className="text-gray-400 mx-1">vs</span> {enc.team2?.name ?? '—'}
          </span>
        </button>

        {isCompleted ? (
          <>
            <span className="font-lato text-xs text-gray-400 shrink-0 tabular-nums">
              {matchSets.map(s => `${s.team1_score}–${s.team2_score}`).join(' ')}
            </span>
            <button
              onClick={handleReset}
              className="font-lato text-xs text-red-500 hover:text-red-700 underline shrink-0"
            >
              Resetear
            </button>
          </>
        ) : (
          <span className={`font-lato text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
            hasMatch ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
          }`}>
            {hasMatch ? 'Pendiente' : 'Sin crear'}
          </span>
        )}
      </div>
    </div>
  )
}