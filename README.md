# Torneo Tenis Urbanova

Live site for the Torneo Tenis Urbanova (III edition, 6–9 August 2026) —
Thursday afternoon through Sunday afternoon. 40 pairs, four divisions, and a
knockout stage that ends with combined teams (*equipos*).

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

Two pairs play a fourth group match — Rocío Navarro / Carla in division 1 and Héctor /
Alexander in division 2. For them only three results count: **their best two
and their worst**, so the third-best is dropped. (`countedResults` in
`lib/standings.js`.)

**Quarterfinals — still by pairs.** Best of 2 sets, super tiebreak if they
split. Divisions 1 and 2 rest their group winner and cross 2v7, 3v6, 4v5;
division 4 goes 1v8 … 4v5. Division 3 is seeded off its three tables: the two
best group winners draw the qualifying third-placed pairs, the remaining
winner draws the weakest runner-up, and the other two runners-up meet. Every
division ends with **four surviving pairs**.

**Equipos — drawn by hand after the quarterfinals.** An *equipo* is not a
group-stage pair: it comes into existence only at the semifinals and is made up
of four pairs, one per division. Once every quarterfinal is played, the sixteen
survivors are drawn at random into four teams **by the organisers**, in the
admin panel. The site never generates or randomises them in code — players have
real availability constraints that only the organisers know about, so the draw
happens offline and is recorded here.

**Semifinals and final.** Equipo versus equipo over four matches, one per
division. The equipo winning the majority advances; 2–2 is broken by total
sets, then total games.

> In the database these rows are still called `squads` / `squad_members` /
> `squad_encounters`. Only the user-facing wording changed; renaming the tables
> would have meant a migration with no functional benefit.

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
4. `0004_analytics.sql` — the anonymous page-view log behind the admin
   analytics tab. No IPs, no cookies, no cross-day identifier.

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
   then *Formar equipos* once every quarterfinal is played (which also seeds
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
  estadisticas/         Per-pair statistics, by division
  premios/              End-of-tournament awards + public MVP vote
  galeria/              Photos 2026 / 2025 and interviews
  mvp/  cuadro/         Redirects kept for previously shared links
  reglas/
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
  analytics.js          UA/referrer parsing + daily visitor hashing
  analytics-queries.js  Aggregations for the admin dashboard
  pair-stats.js         Per-pair tournament statistics
  awards.js             Award definitions and winners
  sponsors.js           Sponsor roster
  photos.js             Photo lists per edition
  interviews.js         Interview videos (files or embeds)
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

## Content you will edit during the tournament

| What | Where |
| ---- | ----- |
| Awards (Mejor Pareja, MVP, Mejor Jugador/a, Dúo Revelación) | `lib/awards.js` |
| Photos | drop files in `public/fotos/2026/`, list them in `lib/photos.js` |
| Interviews | drop files in `public/entrevistas/` or use an embed URL, list in `lib/interviews.js` |
| Sponsors | `lib/sponsors.js`, artwork in `public/logos_sponsors/` |

Sponsor artwork is supplied already black and white, so it is shown at full
opacity with no greyscale filter — the old filter left logos permanently dimmed
on touch devices. `tier: 'principal'` renders a sponsor larger, in its own row
above the collaborators.

## Deployment

Vercel, from `main`. Set `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`
and (recommended) `ADMIN_SESSION_SECRET` in the project's environment
variables.

## Analytics

Two layers, both cookieless and neither needing a consent banner:

- **Vercel Analytics + Speed Insights** (`app/layout.js`) — audience and Core
  Web Vitals, viewed in the Vercel dashboard. Enable Analytics for the project
  in Vercel or the calls are simply no-ops.
- **First-party page views** — logged to Supabase and shown in the *Analítica*
  tab of `/admin`: views and unique visitors, a daily trend, top pages,
  devices, browsers, OS, countries, referrers and peak hour.

No IP address or cookie is stored. The visitor identifier is a salted SHA-256
of (IP + user agent + today's date) truncated to 32 chars, so it cannot be
reversed and changes at midnight — "unique visitors" therefore means unique
*per day*, and nobody can be followed across days. `/admin` and `/api` are not
tracked, and common bot user agents are dropped.
