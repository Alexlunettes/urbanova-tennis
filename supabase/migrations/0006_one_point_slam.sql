-- ═══════════════════════════════════════════════════════════════════════════
--  0006_one_point_slam.sql
--
--  The "1 Point Slam": a separate INDIVIDUAL knockout for 16 players, played
--  on the Sunday evening alongside the finals of the main tournament.
--
--  It is deliberately its own pair of tables rather than an extra `stage` on
--  `matches`, because `matches` is between PAIRS (`teams`) and this is between
--  single players. Participants reference `public.players`, so nobody is
--  duplicated — a slam entrant is the same person record as in the main draw.
--
--  Two design notes:
--
--  · `player_id` is nullable. Seed 3 is not known yet, and a null renders as
--    the placeholder in `label`. Filling it in later is a one-row UPDATE.
--
--  · Only the round-of-16 line-up is stored. Every later round's participants
--    are DERIVED from the winners below it (see lib/slam.js), so the bracket
--    can never drift out of step with its results. A match therefore records
--    `winner_slot` (1 = upper participant, 2 = lower) rather than a player id.
--
--  Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── The 16 draw positions ──────────────────────────────────────────────────
create table if not exists public.slam_participants (
  id         uuid primary key default gen_random_uuid(),
  seed       smallint not null unique check (seed between 1 and 16),
  player_id  uuid references public.players(id) on delete set null,
  label      text,                       -- shown when player_id is null
  created_at timestamptz not null default now()
);

-- ── The 15 matches of the bracket ──────────────────────────────────────────
create table if not exists public.slam_matches (
  id           uuid primary key default gen_random_uuid(),
  round        text not null check (round in ('round_of_16','quarterfinal','semifinal','final')),
  position     smallint not null check (position between 1 and 8),
  winner_slot  smallint check (winner_slot in (1, 2)),
  score        text,                     -- free text; a "1 point slam" match is a single point
  completed    boolean not null default false,
  scheduled_at timestamptz,
  court        text,
  created_at   timestamptz not null default now(),
  unique (round, position)
);

-- A match is completed exactly when it has a winner.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'slam_matches_winner_check') then
    alter table public.slam_matches
      add constraint slam_matches_winner_check
      check ((completed and winner_slot is not null) or (not completed and winner_slot is null));
  end if;
end $$;

-- ── RLS: public read, writes only via the service-role key ─────────────────
do $$
declare t text;
begin
  foreach t in array array['slam_participants','slam_matches'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_public_read', t
    );
  end loop;
end $$;

-- ── Realtime, so the bracket updates itself while people watch ─────────────
do $$
declare t text;
begin
  foreach t in array array['slam_participants','slam_matches'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end loop;
end $$;

commit;
