import { supabase }      from '@/lib/supabase'
import RealtimeRefresher from '@/app/components/RealtimeRefresher'

export const revalidate = 0

async function getBracket() {
  const { data } = await supabase
    .from('knockout_encounters')
    .select(`
      id, level, round, team1_id, team2_id, winner_id,
      team1:team1_id(id, name),
      team2:team2_id(id, name),
      winner:winner_id(id, name),
      match:match_id(id, completed, winner_id,
        sets(set_number, team1_score, team2_score))
    `)
    .order('level')
    .order('created_at')
  return data || []
}

const LEVEL_LABELS = { 1: 'Nivel 1', 2: 'Nivel 2', 3: 'Nivel 3' }

export default async function CuadroPage() {
  const encounters = await getBracket()

  return (
    <main className="min-h-screen bg-gray-50 py-16 px-4">
      <RealtimeRefresher tables={['knockout_encounters', 'sets', 'matches']} />

      <div className="max-w-5xl mx-auto">
        <h1 className="font-bebas text-6xl text-sage text-center mb-2 tracking-wide">
          CUADRO FINAL
        </h1>
        <p className="font-lato text-gray-500 text-center text-sm mb-14">
          Fase eliminatoria · Torneo Tenis Urbanova 2026
        </p>

        {[1, 2, 3].map((lvl) => {
          const lvlEnc = encounters.filter(e => e.level === lvl)
          const sfs    = lvlEnc.filter(e => e.round === 'semifinal')
          const final  = lvlEnc.find(e => e.round === 'final')

          return (
            <div key={lvl} className="mb-16">
              <h2 className="font-bebas text-3xl text-gray-800 mb-8 pb-3 border-b border-gray-200 tracking-wide">
                {LEVEL_LABELS[lvl]}
              </h2>

              {lvlEnc.length === 0 ? (
                <p className="font-lato text-gray-400 italic text-sm">
                  El cuadro aún no ha sido generado para este nivel.
                </p>
              ) : (
                <div className="flex items-center gap-0 overflow-x-auto pb-4">
                  {/* Semi-finals column */}
                  <div className="flex flex-col gap-5 min-w-[230px] flex-shrink-0">
                    <p className="font-lato font-bold text-xs text-gray-400 uppercase tracking-widest">
                      Semifinales
                    </p>
                    {sfs.map(sf => <BracketCard key={sf.id} enc={sf} />)}
                  </div>

                  {/* Connector (desktop only) */}
                  <div className="hidden md:flex items-center flex-shrink-0 mx-1">
                    <BracketConnector />
                  </div>

                  {/* Final column */}
                  <div className="flex flex-col justify-center min-w-[230px] flex-shrink-0 ml-4 md:ml-0">
                    <p className="font-lato font-bold text-xs text-gray-400 uppercase tracking-widest mb-5">
                      Final
                    </p>
                    {final?.match_id ? (
                      <BracketCard enc={final} isFinal />
                    ) : (
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center">
                        <p className="font-lato text-gray-400 text-sm italic">Por determinar</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}

function BracketCard({ enc, isFinal = false }) {
  const matchWinnerId = enc.match?.winner_id
  const t1Won = matchWinnerId && matchWinnerId === enc.team1_id
  const t2Won = matchWinnerId && matchWinnerId === enc.team2_id

  const rows = [
    { team: enc.team1, hasId: !!enc.team1_id, isWinner: t1Won },
    { team: enc.team2, hasId: !!enc.team2_id, isWinner: t2Won },
  ]

  return (
    <div className={`rounded-2xl overflow-hidden border-2 bg-white shadow-sm ${
      isFinal ? 'border-gold' : 'border-gray-200'
    }`}>
      {rows.map(({ team, hasId, isWinner }, i) => (
        <div
          key={i}
          className={`flex items-center justify-between px-4 py-3 ${
            i === 0 ? 'border-b border-gray-100' : ''
          } ${isWinner ? 'bg-sage/10' : ''}`}
        >
          <span className={`font-lato text-sm ${
            isWinner ? 'font-bold text-sage'
            : hasId   ? 'text-gray-800'
            :            'text-gray-400 italic'
          }`}>
            {team?.name ?? (hasId ? '—' : 'Por determinar')}
          </span>
          {isWinner && <span className="text-sage text-xs font-bold ml-2">✓</span>}
        </div>
      ))}

      {isFinal && !!matchWinnerId && (
        <div className="bg-gold/20 px-4 py-2 text-center border-t border-gold/30">
          <span className="font-bebas text-gold text-lg tracking-wide">
            🏆 {enc.winner?.name ?? 'Campeón'}
          </span>
        </div>
      )}
    </div>
  )
}

function BracketConnector() {
  // Draws: two arms from SF1 (y≈40) and SF2 (y≈160) meeting at midpoint (y≈100),
  // then a horizontal line right to the Final box.
  return (
    <svg width="48" height="200" viewBox="0 0 48 200" fill="none">
      <line x1="0"  y1="40"  x2="24" y2="40"  stroke="#D1D5DB" strokeWidth="2" />
      <line x1="0"  y1="160" x2="24" y2="160" stroke="#D1D5DB" strokeWidth="2" />
      <line x1="24" y1="40"  x2="24" y2="160" stroke="#D1D5DB" strokeWidth="2" />
      <line x1="24" y1="100" x2="48" y2="100" stroke="#D1D5DB" strokeWidth="2" />
    </svg>
  )
}