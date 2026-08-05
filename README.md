# Torneo Tenis Urbanova

Live site for the Torneo Tenis Urbanova (III edition, 6–9 August 2026) —
Thursday afternoon through Sunday afternoon. 40 pairs, four divisions, and a
knockout stage that ends with combined squads.

Next.js 16 (App Router, React Compiler) · Tailwind v4 · Supabase · Vercel.

---

## Format

**Group stage.** Each division competes separately and every group match is a
**single set**. Divisions 1, 2 and 4 play as one table; division 3's twelve
pairs are split into three groups of four playing a full round robin. Ranking
is matches won, then games won and lost.

| Division | Pairs | Groups | Bye to semis | To quarterfinals | Quarterfinal ties |
| -------- | ----- | ------ | ------------ | ---------------- | ----------------- |
| 1        | 7     | 1      | 1st          | 6                | 3                 |
| 2        | 7     | 1      | 1st          | 6                | 3                 |
| 3        | 12    | 3      | —            | 8                | 4                 |
| 4        | 14    | 1      | —            | 8                | 4                 |

Two pairs play a fourth group match — Rocío / Carla in division 1 and Héctor /
Alexander in division 2. For them only three results count: **their best two
and their worst**, so the third-best is dropped. (`countedResults` in
`lib/standings.js`.)

**Quarterfinals — still by pairs.** Best of 2 sets, super tiebreak if they
split. Divisions 1 and 2 rest their group winner and cross 2v7, 3v6, 4v5;
division 4 goes 1v8 … 4v5. Division 3 is seeded off its three tables: the two
best group winners draw the qualifying third-placed pairs, the remaining
winner draws the weakest runner-up, and the other two runners-up meet. Every
division ends with **four surviving pairs**.

**Squads — formed after the quarterfinals, not before.** The four survivors of
each division are ranked on their group-stage record (for division 3, compared
across its groups) and grouped by rank: the best remaining pair of every
division becomes Escuadra 1, the second-best of each Escuadra 2, and so on.

**Semifinals and final.** Squad versus squad over four matches, one per
division. The squad winning the majority advances; 2–2 is broken by total
sets, then total games.

## Getting started

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run dev
```

### Database

The schema lives in `supabase/migrations/`. Run them in order in the Supabase
SQL editor (Dashboard → SQL Editor → New query):

1. `0001_baseline.sql` — the original tables. Idempotent; safe on an existing
   project.
2. `0002_tournament_2026.sql` — four divisions, squad tables, and the missing
   `matches.completed_at` column.
3. `0003_knockout_by_pairs.sql` — moves the quarterfinals back to individual
   pairs. Adds `matches.slot`, narrows squad ties to semifinals and the final,
   and drops the obsolete `is_reduced` column.

Then import the roster and fixtures:

```bash
npm run seed:dry      # preview — writes nothing
npm run seed          # import (refuses to run if data already exists)
npm run seed:reset    # ERASE all tournament data, then import
```

`npm run seed:reset` deletes every score already entered. It is meant for
setting up before the tournament, not during it.

The roster and the fixture list live in `lib/tournament-data.js`. Edit that
file and re-seed to correct a name or add a fixture before play starts; once
results are being recorded, use the admin panel instead.

---

## Running the tournament

`/admin`, protected by `ADMIN_PASSWORD`.

1. **Resultados** — enter scores for any match. The form follows the round: one
   set in the group stage, best of two with a super tiebreak from the
   quarterfinals on. Re-entering a score overwrites it; *Resetear* returns a
   match to pending.
2. **Eliminatorias** — three steps in the order they happen:
   *Sortear los cuartos* per division (needs that division's groups finished),
   then *Formar escuadras* once every quarterfinal is played (which also seeds
   the semifinals 1v4 and 2v3), then *Montar la final* once both semifinals are
   settled. Every step is safe to repeat — nothing already played is
   overwritten.

Standings and squad results are **derived**, never stored, so correcting any
score immediately updates the tables and the whole bracket. Public pages
subscribe to Supabase Realtime and refresh themselves as results land.

---

## Layout

```
app/
  page.js               Homepage
  equipos/              Pairs by division
  grupos/               Standings with qualification zones
  partidos/             Calendar + bracket, in two tabs
  cuadro/               Redirect into the bracket tab
  estadisticas/         Per-player statistics
  galeria/  mvp/  reglas/
  admin/                Score entry and knockout manager
  api/                  Route handlers (all writes; service-role key)
  components/
    ui/                 Button, Card, Badge, PageHeader, EmptyState, tabs
    admin/              Admin panels
lib/
  tournament.js         Division rules, formats, qualification, seeding
  tournament-data.js    2026 roster + fixtures (source of truth)
  standings.js          League tables, incl. the four-match exception
  squads.js             Survivors, squad formation, tie resolution
  auth.js               Signed admin sessions
  sponsors.js           Sponsor roster
supabase/migrations/    Schema, in version control
scripts/seed.mjs        Roster + fixture import
```

### Conventions

- Server components read Supabase directly with the anon key. RLS permits
  public reads and no writes.
- Every mutation goes through a route handler in `app/api/` using the
  service-role key, guarded by `requireAdmin()`.
- Within a squad encounter, `team1` always belongs to `squad1`. `lib/squads.js`
  relies on this to derive results from `matches.winner_id`.
- Colours, spacing and type come from the tokens in `app/globals.css`.
  Components use the semantic names (`bg-surface`, `text-fg-muted`,
  `border-hairline`), which is what makes light and dark mode work.

## Sponsors

Add entries to `lib/sponsors.js` and drop the artwork in `public/logos_sponsors/`.
The footer section picks them up automatically. Logos render in greyscale and
come to full colour on hover; entries without a logo show a placeholder tile,
so the layout is right before the artwork arrives.

## Deployment

Vercel, from `main`. Set `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`
and (recommended) `ADMIN_SESSION_SECRET` in the project's environment
variables.
