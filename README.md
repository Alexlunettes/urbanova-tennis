# Torneo Tenis Urbanova

Live site for the Urbanova 24-hour doubles tournament (III edition, 6–9 August
2026). 40 pairs, four categories, and a knockout stage played by combined
squads.

Next.js 16 (App Router, React Compiler) · Tailwind v4 · Supabase · Vercel.

---

## Format

**Group stage.** Each category is its own league, played Champions-League
style: a pair meets only 3–5 of the other pairs, not all of them. Final
position decides who qualifies.

| Category | Pairs | To semifinals | To quarterfinals | Out |
| -------- | ----- | ------------- | ---------------- | --- |
| 1        | 7     | 1st           | 2nd–7th          | —   |
| 2        | 7     | 1st           | 2nd–7th          | —   |
| 3        | 12    | —             | Top 8            | 4   |
| 4        | 14    | —             | Top 8            | 6   |

**Knockout.** From the quarterfinals on, pairs stop competing alone. A *squad*
fields one qualified pair per category and meets another squad over four
simultaneous matches, one per category. The squad winning the majority
advances — so a pair can lose its own match and still go through.

Ties are broken by total matches won, then total sets, then total games.

**The reduced quarterfinal.** Categories 1 and 2 send only six pairs each to
the quarterfinals (their winners are already in the semifinals), against eight
from Categories 3 and 4. One of the four quarterfinals is therefore contested
by Categories 3 and 4 alone, over two matches. Whoever wins it receives their
Category 1 and 2 pairs on reaching the semifinals.

---

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
2. `0002_tournament_2026.sql` — four categories, squad knockout tables, and the
   missing `matches.completed_at` column.

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

1. **Resultados** — enter scores for any match, group stage or knockout.
   Re-entering a score overwrites it; *Resetear* returns a match to pending.
2. **Escuadras** — build the eight squads. Pair pickers are ordered by final
   group position and mark pairs already taken. Two squads are left without
   Category 1 and 2 pairs: those contest the reduced quarterfinal.
3. **Cuadro** — assign squads to bracket slots and press *Generar partidos* to
   create that tie's matches. Safe to repeat: played matches are never touched,
   so regenerate after a squad picks up a late pair.

Standings and squad results are **derived**, never stored, so correcting any
score immediately updates the tables and the whole bracket. Public pages
subscribe to Supabase Realtime and refresh themselves as results land.

---

## Layout

```
app/
  page.js               Homepage
  equipos/              Pairs by category
  grupos/               Standings with qualification zones
  partidos/             Fixtures and results
  cuadro/               Squad bracket
  estadisticas/         Per-player statistics
  galeria/  mvp/  reglas/
  admin/                Score entry, squad builder, bracket builder
  api/                  Route handlers (all writes; service-role key)
  components/
    ui/                 Button, Card, Badge, PageHeader, EmptyState, tabs
    admin/              Admin panels
lib/
  tournament.js         Category rules, qualification, scoring helpers
  tournament-data.js    2026 roster + fixtures (source of truth)
  standings.js          League table calculation
  squads.js             Squad encounter resolution
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

Add entries to `lib/sponsors.js` and drop the artwork in `public/sponsors/`.
The footer section picks them up automatically. Logos render in greyscale and
come to full colour on hover; entries without a logo show a placeholder tile,
so the layout is right before the artwork arrives.

## Deployment

Vercel, from `main`. Set `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`
and (recommended) `ADMIN_SESSION_SECRET` in the project's environment
variables.
