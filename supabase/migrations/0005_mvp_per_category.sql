-- ═══════════════════════════════════════════════════════════════════════════
--  0005_mvp_per_category.sql
--
--  The MVP vote becomes one vote per division instead of one vote overall.
--
--  A visitor now casts four votes — a most valuable player for the 1ª, the 2ª,
--  the 3ª and the 4ª — so the UNIQUE constraint that enforced one row per
--  browser has to widen to one row per browser PER DIVISION.
--
--  Existing votes are kept: each one is assigned the division of the player it
--  was cast for, which is the division that vote was always implicitly about.
--
--  Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── 1. The division the vote belongs to ────────────────────────────────────
alter table public.mvp_votes
  add column if not exists level smallint;

-- ── 2. Backfill from the player's pair ─────────────────────────────────────
-- A player inherits their division from the pair they play in. A player in two
-- pairs (which the roster does not currently have) would resolve to the lower
-- division, which is a stable, arbitrary choice rather than a failure.
update public.mvp_votes v
set    level = sub.level
from (
  select p.id as player_id, min(t.level) as level
  from   public.players p
  join   public.teams t on t.player1_id = p.id or t.player2_id = p.id
  group  by p.id
) sub
where v.player_id = sub.player_id
  and v.level is null;

-- Any vote whose player is no longer on a pair cannot be attributed to a
-- division, so it is dropped rather than silently miscounted.
delete from public.mvp_votes where level is null;

alter table public.mvp_votes
  alter column level set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'mvp_votes_level_check'
  ) then
    alter table public.mvp_votes
      add constraint mvp_votes_level_check check (level between 1 and 4);
  end if;
end $$;

-- ── 3. One vote per browser PER DIVISION, not one overall ──────────────────
alter table public.mvp_votes
  drop constraint if exists mvp_votes_voter_token_key;

drop index if exists mvp_votes_voter_token_key;

create unique index if not exists mvp_votes_token_level_key
  on public.mvp_votes (voter_token, level);

create index if not exists mvp_votes_level_idx
  on public.mvp_votes (level);

commit;
