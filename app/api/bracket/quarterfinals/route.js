import { NextResponse }  from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin }  from '@/lib/auth'
import {
  LEVELS, CATEGORY_RULES, CATEGORY_META,
  QUARTERFINAL_SEEDING, division3Quarterfinals,
} from '@/lib/tournament'
import { calculateCategoryStandings, calculateGroupedStandings } from '@/lib/standings'
import { quarterfinalSlot, slotToISO } from '@/lib/tournament-data'

/**
 * Draws one division's quarterfinals from its finished group table.
 *
 * These are matches between INDIVIDUAL PAIRS — squads do not exist yet.
 *
 *   · divisions 1 and 2 — the group winner rests, the rest meet 2v7, 3v6, 4v5
 *   · division 4        — the usual 1v8, 2v7, 3v6, 4v5
 *   · division 3        — seeded from its three group tables: the two best
 *                         winners draw the qualifying third-placed pairs, the
 *                         remaining winner draws the weakest runner-up, and
 *                         the other two runners-up meet
 *
 * Already-played quarterfinals are never touched, so this is safe to re-run
 * after a late group result changes the seeding of an unplayed tie.
 */
export async function POST(request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { level } = await request.json().catch(() => ({}))
  const lvl = Number(level)
  if (!LEVELS.includes(lvl)) {
    return NextResponse.json({ error: 'División inválida' }, { status: 400 })
  }

  const rules = CATEGORY_RULES[lvl]

  const [{ data: teams }, { data: matches }, { data: groups }] = await Promise.all([
    supabaseAdmin.from('teams').select('id, name').eq('level', lvl),
    supabaseAdmin.from('matches')
      .select('id, team1_id, team2_id, group_id, completed, sets(team1_score, team2_score)')
      .eq('stage', 'group_stage').eq('level', lvl),
    supabaseAdmin.from('tournament_groups')
      .select('id, name, group_entries(team_id)')
      .eq('level', lvl).order('name'),
  ])

  const pending = (matches ?? []).filter(m => !m.completed).length
  if (pending > 0) {
    return NextResponse.json(
      { error: `Faltan ${pending} partidos de grupo por jugar en ${CATEGORY_META[lvl].name}` },
      { status: 400 },
    )
  }

  const toRow = t => ({ team_id: t.id, team_name: t.name })
  let pairings = []

  if (rules.groups > 1) {
    // ── Division 3: seeded across its three groups ──
    const grouped = calculateGroupedStandings(
      lvl,
      (groups ?? []).map(g => ({
        id: g.id,
        name: g.name,
        teams: (g.group_entries ?? [])
          .map(e => (teams ?? []).find(t => t.id === e.team_id))
          .filter(Boolean).map(toRow),
      })),
      matches ?? [],
    )
    if (grouped.winners.length < 3 || grouped.runners.length < 3 || grouped.qualifiedThirds.length < 2) {
      return NextResponse.json(
        { error: 'No hay suficientes clasificados para sortear los cuartos' },
        { status: 400 },
      )
    }
    pairings = division3Quarterfinals(grouped.winners, grouped.runners, grouped.qualifiedThirds)
  } else {
    // ── Divisions 1, 2 and 4: straight off the single table ──
    const table = calculateCategoryStandings(lvl, (teams ?? []).map(toRow), matches ?? [])
    const seeding = QUARTERFINAL_SEEDING[lvl] ?? []
    if (table.length < rules.byes + rules.qualifiers) {
      return NextResponse.json({ error: 'Clasificación incompleta' }, { status: 400 })
    }
    pairings = seeding.map(([a, b]) => [table[a - 1], table[b - 1]])
  }

  if (pairings.some(([a, b]) => !a || !b)) {
    return NextResponse.json({ error: 'No se pudo completar el sorteo' }, { status: 400 })
  }

  // Keep anything already played; replace the rest.
  const { data: existing } = await supabaseAdmin
    .from('matches')
    .select('id, slot, completed')
    .eq('stage', 'quarterfinal').eq('level', lvl)

  const lockedSlots = new Set((existing ?? []).filter(m => m.completed).map(m => m.slot))

  await supabaseAdmin
    .from('matches')
    .delete()
    .eq('stage', 'quarterfinal').eq('level', lvl).eq('completed', false)

  const rows = pairings
    .map(([a, b], i) => {
      // Kick-off time and court come from the published quarterfinal sheet,
      // keyed by the slot the draw assigns.
      const when = quarterfinalSlot(lvl, i + 1)
      return {
        level:        lvl,
        stage:        'quarterfinal',
        slot:         i + 1,
        team1_id:     a.team_id,
        team2_id:     b.team_id,
        scheduled_at: when ? slotToISO(when.day, when.time) : null,
        court:        when?.court ?? null,
        completed:    false,
      }
    })
    .filter(r => !lockedSlots.has(r.slot))

  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from('matches').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    created: rows.length,
    kept: lockedSlots.size,
    message:
      `${CATEGORY_META[lvl].name}: ${rows.length} cuartos sorteados` +
      (lockedSlots.size ? ` (${lockedSlots.size} ya jugados, sin tocar)` : ''),
  })
}

/** Clears a division's unplayed quarterfinals. */
export async function DELETE(request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const lvl = Number(new URL(request.url).searchParams.get('level'))
  if (!LEVELS.includes(lvl)) {
    return NextResponse.json({ error: 'División inválida' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('matches')
    .delete()
    .eq('stage', 'quarterfinal').eq('level', lvl).eq('completed', false)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
