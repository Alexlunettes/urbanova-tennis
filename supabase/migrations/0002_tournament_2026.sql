-- ═══════════════════════════════════════════════════════════════════════════
--  0002_tournament_2026.sql
--
--  Reworks the tournament model for the 2026 (III) edition.
--
--  WHAT CHANGES AND WHY
--
--  1. Four categories instead of three. `level` is widened to 1–4.
--
--  2. Champions-League group stage. Each category is one league table whose
--     teams play only a subset of opponents (3–5 each), not a round robin.
--     One `tournament_groups` row per category is enough — the old
--     "Grupo A / Grupo B" split is gone.
--
--  3. Knockout is played by SQUADS, not by pairs. A squad fields one pair from
--     each category and faces another squad over four simultaneous matches;
--     the squad winning the majority advances. A pair can therefore lose its
--     own match and still go through.
--
--     `knockout_encounters` (team vs team) cannot express this and is replaced
--     by `squads` + `squad_members` + `squad_encounters`.
--
--  4. `matches.completed_at` is ADDED. Application code already reads and
--     writes this column, but it never existed — which silently broke the
--     player statistics page and made the admin "reset match" button fail.
--
--  Squad winners are NOT stored: they are derived from the member match
--  results (majority → total sets → total games) so that editing any score
--  immediately and consistently updates the whole bracket.
--
--  Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ───────────────────────────────────────────────────────────────────────────
--  1. Four categories
-- ───────────────────────────────────────────────────────────────────────────
-- Any pre-existing CHECK on `level` almost certainly caps it at 3. Its name is
-- whatever Postgres generated, so drop by definition rather than by guessing
-- the name — leaving a stale "between 1 and 3" behind would silently reject
-- every Category 4 row.
do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass as tbl, c.conname
      from pg_constraint c
      join pg_class     t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
     where n.nspname = 'public'
       and t.relname in ('teams', 'matches', 'tournament_groups')
       and c.contype = 'c'
       and pg_get_constraintdef(c.oid) ilike '%level%'
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
  end loop;
end $$;

alter table public.teams
  add constraint teams_level_check check (level between 1 and 4);
alter table public.matches
  add constraint matches_level_check check (level between 1 and 4);
alter table public.tournament_groups
  add constraint tournament_groups_level_check check (level between 1 and 4);

comment on column public.teams.level is
  'Competition category, 1–4. Kept under the historical name `level`.';

-- ───────────────────────────────────────────────────────────────────────────
--  2. The missing completed_at column
-- ───────────────────────────────────────────────────────────────────────────
alter table public.matches add column if not exists completed_at timestamptz;

-- Backfill so existing finished matches are not treated as unplayed.
update public.matches
   set completed_at = coalesce(completed_at, created_at)
 where completed = true and completed_at is null;

-- ───────────────────────────────────────────────────────────────────────────
--  3. Squads
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.squads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  seed       smallint,
  created_at timestamptz not null default now()
);

comment on table public.squads is
  'A knockout squad: one qualified pair from each category, competing together.';

-- One pair per category per squad; a pair belongs to at most one squad.
create table if not exists public.squad_members (
  id         uuid primary key default gen_random_uuid(),
  squad_id   uuid not null references public.squads(id) on delete cascade,
  team_id    uuid not null references public.teams(id) on delete cascade,
  category   smallint not null check (category between 1 and 4),
  created_at timestamptz not null default now(),
  unique (squad_id, category),
  unique (team_id)
);

comment on table public.squad_members is
  'Slots may be filled late: the squad from the Category 3+4-only quarterfinal receives its Category 1 and 2 pairs only once it reaches the semifinals.';

-- ───────────────────────────────────────────────────────────────────────────
--  4. Squad encounters (the bracket)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.squad_encounters (
  id         uuid primary key default gen_random_uuid(),
  round      text not null check (round in ('quarterfinal','semifinal','final')),
  position   smallint not null,
  squad1_id  uuid references public.squads(id) on delete set null,
  squad2_id  uuid references public.squads(id) on delete set null,
  -- The special quarterfinal contested by Categories 3 and 4 only, because
  -- Categories 1 and 2 have just 7 teams and their winners skip to the semis.
  is_reduced boolean not null default false,
  scheduled_at timestamptz,
  court      text,
  created_at timestamptz not null default now(),
  unique (round, position)
);

comment on column public.squad_encounters.is_reduced is
  'True for the quarterfinal played over 2 matches (Categories 3 and 4 only).';

-- Link matches to their squad encounter.
alter table public.matches
  add column if not exists squad_encounter_id uuid
  references public.squad_encounters(id) on delete cascade;

-- The old, unused knockout link and table.
alter table public.matches drop column if exists knockout_encounter_id;
drop table if exists public.knockout_encounters;

-- Allowed stages. Same reasoning as the level constraint above: drop by
-- definition, since an older CHECK may not permit 'quarterfinal'.
do $$
declare r record;
begin
  for r in
    select c.conname
      from pg_constraint c
      join pg_class     t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
     where n.nspname = 'public'
       and t.relname = 'matches'
       and c.contype = 'c'
       and pg_get_constraintdef(c.oid) ilike '%stage%'
  loop
    execute format('alter table public.matches drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.matches
  add constraint matches_stage_check
  check (stage in ('group_stage','quarterfinal','semifinal','final'));

-- A squad encounter holds at most one match per category.
create unique index if not exists matches_encounter_category_uniq
  on public.matches (squad_encounter_id, level)
  where squad_encounter_id is not null;

-- ───────────────────────────────────────────────────────────────────────────
--  5. Indexes for the hot read paths
-- ───────────────────────────────────────────────────────────────────────────
create index if not exists matches_level_stage_idx  on public.matches (level, stage);
create index if not exists matches_scheduled_idx    on public.matches (scheduled_at);
create index if not exists matches_encounter_idx    on public.matches (squad_encounter_id);
create index if not exists sets_match_idx           on public.sets (match_id);
create index if not exists teams_level_idx          on public.teams (level);
create index if not exists squad_members_squad_idx  on public.squad_members (squad_id);

-- ───────────────────────────────────────────────────────────────────────────
--  6. RLS on the new tables — public read, writes via service role only
-- ───────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['squads','squad_members','squad_encounters'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_public_read', t
    );
  end loop;
end $$;

-- ───────────────────────────────────────────────────────────────────────────
--  7. Realtime — the live bracket and standings subscribe to these
-- ───────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'matches','sets','squads','squad_members','squad_encounters','mvp_votes'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;   -- already published
      when undefined_object then null;   -- publication absent (local/dev)
    end;
  end loop;
end $$;

commit;
