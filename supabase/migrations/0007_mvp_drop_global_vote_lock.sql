-- ═══════════════════════════════════════════════════════════════════════════
--  0007_mvp_drop_global_vote_lock.sql
--
--  Finishes the job 0005 was supposed to do: make the MVP vote one per device
--  PER DIVISION instead of one per device overall.
--
--  0005 added the `level` column, backfilled it and created the composite
--  unique index — but it dropped the old single-column constraint BY NAME
--  (`mvp_votes_voter_token_key`, the name Postgres would have generated from
--  the `unique` in 0001). The live database's constraint is actually called
--  `unique_voter`: it was created by hand long before the schema was put in
--  version control, so 0001 is a reconstruction and guessed the name. The drop
--  matched nothing, no error was raised, and the global lock stayed in force —
--  a device could still only ever vote once.
--
--  So this migration does not trust names. It finds EVERY unique index on
--  mvp_votes whose key is exactly (voter_token) and removes it, whatever it is
--  called, then makes sure the (voter_token, level) index is present.
--
--  No vote is touched: this only changes which combinations are permitted.
--  Existing rows already carry their division from 0005's backfill.
--
--  Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── 1. Drop any unique index keyed on voter_token alone, whatever its name ──
do $$
declare
  rec record;
begin
  for rec in
    select
      i.indexrelid::regclass::text as index_name,
      con.conname                  as constraint_name
    from pg_index i
    join pg_class     t on t.oid = i.indrelid
    join pg_namespace n on n.oid = t.relnamespace
    left join pg_constraint con
           on con.conindid = i.indexrelid
          and con.contype in ('u', 'p')
    where n.nspname = 'public'
      and t.relname = 'mvp_votes'
      and i.indisunique
      and i.indnkeyatts = 1
      and (
        select a.attname
        from pg_attribute a
        where a.attrelid = t.oid
          and a.attnum   = i.indkey[0]
      ) = 'voter_token'
  loop
    if rec.constraint_name is not null then
      raise notice 'dropping constraint %', rec.constraint_name;
      execute format('alter table public.mvp_votes drop constraint %I', rec.constraint_name);
    else
      raise notice 'dropping index %', rec.index_name;
      execute format('drop index %s', rec.index_name);
    end if;
  end loop;
end $$;

-- ── 2. The rule we actually want ───────────────────────────────────────────
-- Belt and braces: 0005 should have created these, but it may have been run
-- against a database where the earlier statements aborted.
alter table public.mvp_votes
  add column if not exists level smallint;

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

delete from public.mvp_votes where level is null;

alter table public.mvp_votes
  alter column level set not null;

create unique index if not exists mvp_votes_token_level_key
  on public.mvp_votes (voter_token, level);

create index if not exists mvp_votes_level_idx
  on public.mvp_votes (level);

commit;

-- ── Verify: this must return no rows ───────────────────────────────────────
-- select i.indexrelid::regclass
-- from pg_index i join pg_class t on t.oid = i.indrelid
-- where t.relname = 'mvp_votes' and i.indisunique and i.indnkeyatts = 1;
