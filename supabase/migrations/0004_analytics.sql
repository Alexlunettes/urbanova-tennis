-- ═══════════════════════════════════════════════════════════════════════════
--  0004_analytics.sql
--
--  First-party page-view log, so the organisers get a dashboard inside /admin
--  rather than having to open a third-party console.
--
--  PRIVACY: no IP address, no cookie, no cross-day identifier is ever stored.
--  `visitor_hash` is a salted SHA-256 of (ip + user-agent + the current date),
--  computed server-side and never reversible. Because the date is part of the
--  input, the hash changes every midnight — it can count unique visitors within
--  a day but cannot follow anyone from one day to the next. That keeps the
--  whole thing outside the scope of consent banners under GDPR/ePrivacy, and
--  it is why "unique visitors" below is really "unique visitors per day".
--
--  Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

create table if not exists public.page_views (
  id           bigserial primary key,
  path         text        not null,
  referrer     text,                       -- host only, never the full URL
  device       text,                       -- mobile | tablet | desktop
  browser      text,
  os           text,
  country      text,                       -- ISO-2, from the edge
  visitor_hash text        not null,
  created_at   timestamptz not null default now()
);

comment on table public.page_views is
  'Anonymous first-party page views. visitor_hash rotates daily and contains no PII.';

create index if not exists page_views_created_idx on public.page_views (created_at desc);
create index if not exists page_views_path_idx    on public.page_views (path);
create index if not exists page_views_visitor_idx on public.page_views (visitor_hash, created_at);

-- ── Row Level Security ─────────────────────────────────────────────────────
-- Nobody reads or writes this with the anon key. Inserts come from the
-- tracking route and reads from the admin page, both via the service role,
-- which bypasses RLS. Enabling it with no policy therefore denies the public
-- outright, which is what we want for behavioural data.
alter table public.page_views enable row level security;

drop policy if exists page_views_public_read on public.page_views;

commit;
