-- ═══════════════════════════════════════════════════════════════════════════
--  0003_knockout_by_pairs.sql
--
--  Corrects when squads come into existence.
--
--  0002 assumed the quarterfinals were already contested by squads. They are
--  not: the quarterfinals are played by INDIVIDUAL PAIRS, division by
--  division. Only once they are done are the four surviving pairs of each
--  division ranked and combined into squads for the semifinals and the final.
--
--  Consequences for the schema:
--
--  * `squad_encounters` now only ever holds semifinals and the final. The
--    round CHECK is narrowed to match, and `is_reduced` — which described the
--    Category 3+4-only quarterfinal that no longer exists — is dropped.
--
--  * Quarterfinal matches are ordinary `matches` rows with
--    stage = 'quarterfinal' and squad_encounter_id = NULL, so nothing new is
--    needed to store them. `slot` is added to keep them in bracket order.
--
--  Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ───────────────────────────────────────────────────────────────────────────
--  1. Bracket ordering for individual knockout matches
-- ───────────────────────────────────────────────────────────────────────────
alter table public.matches add column if not exists slot smallint;

comment on column public.matches.slot is
  'Position within a round for knockout matches played by pairs (quarterfinal 1..4). Null for group-stage matches.';

-- One match per slot per division per round.
create unique index if not exists matches_round_slot_uniq
  on public.matches (stage, level, slot)
  where slot is not null;

-- ───────────────────────────────────────────────────────────────────────────
--  2. Squad ties are semifinals and the final only
-- ───────────────────────────────────────────────────────────────────────────

-- Any quarterfinal tie seeded under the old model is now meaningless. Detach
-- its matches first so they are not deleted along with it.
update public.matches
   set squad_encounter_id = null
 where squad_encounter_id in (
   select id from public.squad_encounters where round = 'quarterfinal'
 );

delete from public.squad_encounters where round = 'quarterfinal';

alter table public.squad_encounters drop column if exists is_reduced;

-- Narrow the round CHECK. Dropped by definition rather than by name, since
-- the generated name is not guaranteed.
do $$
declare r record;
begin
  for r in
    select c.conname
      from pg_constraint c
      join pg_class     t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
     where n.nspname = 'public'
       and t.relname = 'squad_encounters'
       and c.contype = 'c'
       and pg_get_constraintdef(c.oid) ilike '%round%'
  loop
    execute format('alter table public.squad_encounters drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.squad_encounters
  add constraint squad_encounters_round_check
  check (round in ('semifinal', 'final'));

-- ───────────────────────────────────────────────────────────────────────────
--  3. Squads carry a seed — squad 1 is built from the best remaining pair of
--     every division, squad 2 from the second-best, and so on.
-- ───────────────────────────────────────────────────────────────────────────
create index if not exists squads_seed_idx on public.squads (seed);

commit;
