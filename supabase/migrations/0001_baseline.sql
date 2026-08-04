-- ═══════════════════════════════════════════════════════════════════════════
--  0001_baseline.sql
--
--  Captures the schema as it existed in Supabase before the 2026 redesign.
--  Until now the schema lived ONLY inside the hosted project — nothing was in
--  version control. This file makes the database reproducible from scratch.
--
--  Safe to run against the existing project: every statement is idempotent.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Individual players ─────────────────────────────────────────────────────
create table if not exists public.players (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- ── A team is a doubles pair ───────────────────────────────────────────────
-- `level` is the competition category. Historically 1–3; widened to 1–4 in 0002.
create table if not exists public.teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  level      smallint not null,
  player1_id uuid references public.players(id) on delete set null,
  player2_id uuid references public.players(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── Group container (one per category from 0002 onward) ────────────────────
create table if not exists public.tournament_groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  level      smallint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.group_entries (
  id             uuid primary key default gen_random_uuid(),
  group_id       uuid not null references public.tournament_groups(id) on delete cascade,
  team_id        uuid not null references public.teams(id) on delete cascade,
  final_position smallint,
  unique (group_id, team_id)
);

-- ── A single doubles match between two teams ───────────────────────────────
create table if not exists public.matches (
  id           uuid primary key default gen_random_uuid(),
  level        smallint not null,
  stage        text not null default 'group_stage',
  group_id     uuid references public.tournament_groups(id) on delete set null,
  team1_id     uuid references public.teams(id) on delete cascade,
  team2_id     uuid references public.teams(id) on delete cascade,
  court        text,
  scheduled_at timestamptz,
  completed    boolean not null default false,
  winner_id    uuid references public.teams(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ── Set-by-set scores. Set 3 is played as a super tiebreak to 10. ──────────
create table if not exists public.sets (
  id                uuid primary key default gen_random_uuid(),
  match_id          uuid not null references public.matches(id) on delete cascade,
  set_number        smallint not null,
  team1_score       smallint not null,
  team2_score       smallint not null,
  is_super_tiebreak boolean not null default false,
  unique (match_id, set_number)
);

-- ── One MVP vote per browser (enforced by the unique token) ────────────────
create table if not exists public.mvp_votes (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references public.players(id) on delete cascade,
  voter_token text not null unique,
  created_at  timestamptz not null default now()
);

-- ── Row Level Security ─────────────────────────────────────────────────────
-- Public read for everything; all writes go through server route handlers
-- using the service-role key, which bypasses RLS.
do $$
declare t text;
begin
  foreach t in array array[
    'players','teams','tournament_groups','group_entries','matches','sets','mvp_votes'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_public_read', t
    );
  end loop;
end $$;
