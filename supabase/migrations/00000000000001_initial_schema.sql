-- ============================================================================
-- Design Sight — Initial schema (v1)
-- Source of truth: docs/prd.md §8.2 (data model), §8.4 (anti-cheat)
--
-- Paste-ready for the Supabase SQL Editor (run as a single script).
-- Idempotency: this is an initial migration; it assumes a fresh project.
--
-- Security model (PRD invariants):
--   * RLS enabled on EVERY table.
--   * Clients never write scores/XP/HP — Edge Functions (service role) do.
--     Tables with no INSERT/UPDATE/DELETE policies are server-write-only.
--   * `rounds` carries truth data (reference kerning positions, target
--     colors, typeface names). It has NO client-facing policies at all:
--     only the service role can read it. Clients receive the client-safe
--     `payload` via Edge Functions.
--   * Leaderboards are exposed through security-definer views that project
--     only public fields (handle, avatar, score) — never raw runs.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
create type public.run_mode as enum ('quick', 'daily', 'challenge_link');
create type public.duel_status as enum (
  'waiting',      -- created, second player not joined yet
  'ready',        -- both present in lobby
  'in_progress',  -- rounds running
  'complete',     -- finished normally
  'forfeited',    -- a player abandoned (2 consecutive missed rounds)
  'cancelled'     -- never started / creator left
);
create type public.friendship_status as enum ('pending', 'accepted', 'blocked');

-- ---------------------------------------------------------------------------
-- 2. profiles — one row per auth user
-- ---------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  handle         text not null unique
                 check (char_length(handle) between 3 and 20
                        and handle ~ '^[a-zA-Z0-9_]+$'),
  avatar_url     text,
  xp             integer not null default 0 check (xp >= 0),
  level          integer not null default 1 check (level >= 1),
  streak         integer not null default 0 check (streak >= 0),
  streak_freezes integer not null default 0 check (streak_freezes >= 0),
  last_daily_date date,           -- last date the user completed a daily (streak logic)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.profiles is
  'Public player profile. XP/level/streak are server-maintained (column-level grants block client writes).';

-- Case-insensitive uniqueness for handles ("Ada" and "ada" collide).
create unique index profiles_handle_lower_idx on public.profiles (lower(handle));

-- ---------------------------------------------------------------------------
-- 3. games — the catalog (kern-duel, contrast-call, color-match, type-snob)
-- ---------------------------------------------------------------------------
create table public.games (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name       text not null,
  config     jsonb not null default '{}'::jsonb, -- timers, scoring params (client-safe)
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. rounds — seeded round content. SERVER-ONLY (no client policies).
--    `payload` = client-safe playable data (sent by Edge Function at round start)
--    `truth`   = reference solution / correct answer (NEVER leaves the server
--                before submission)
-- ---------------------------------------------------------------------------
create table public.rounds (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.games (id) on delete cascade,
  payload    jsonb not null,
  truth      jsonb not null,
  difficulty smallint not null default 1 check (difficulty between 1 and 3),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create index rounds_game_active_idx on public.rounds (game_id, is_active, difficulty);

-- ---------------------------------------------------------------------------
-- 5. runs — a 5-round play session (quick / daily / challenge link)
--    Created and finalized by Edge Functions only.
-- ---------------------------------------------------------------------------
create table public.runs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  mode          public.run_mode not null,
  round_ids     uuid[] not null check (array_length(round_ids, 1) between 1 and 10),
  total_score   integer not null default 0 check (total_score between 0 and 50000),
  daily_date    date,                 -- set iff mode = 'daily'
  parent_run_id uuid references public.runs (id) on delete set null,
                -- set iff mode = 'challenge_link': the run being challenged
  share_slug    text unique,          -- short code for "Beat my score" links
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,          -- null while in progress

  constraint runs_daily_date_presence check (
    (mode = 'daily' and daily_date is not null)
    or (mode <> 'daily' and daily_date is null)
  ),
  constraint runs_challenge_parent check (
    mode = 'challenge_link' or parent_run_id is null
  )
);

-- Anti-cheat (PRD §8.4): one daily attempt per user per date.
create unique index runs_one_daily_per_user_idx
  on public.runs (user_id, daily_date)
  where mode = 'daily';

create index runs_user_idx        on public.runs (user_id, started_at desc);
create index runs_daily_board_idx on public.runs (daily_date, total_score desc)
  where mode = 'daily' and completed_at is not null;
create index runs_completed_idx   on public.runs (completed_at desc)
  where completed_at is not null;

-- ---------------------------------------------------------------------------
-- 6. round_results — per-round answers & server-computed scores
-- ---------------------------------------------------------------------------
create table public.round_results (
  run_id    uuid not null references public.runs (id) on delete cascade,
  round_no  smallint not null check (round_no between 1 and 10),
  round_id  uuid not null references public.rounds (id) on delete restrict,
  answer    jsonb not null,
  score     integer not null check (score between 0 and 5000),
  time_ms   integer not null check (time_ms >= 0),
  created_at timestamptz not null default now(),
  primary key (run_id, round_no)
);

create index round_results_round_idx on public.round_results (round_id);

-- ---------------------------------------------------------------------------
-- 7. daily_challenges — one pre-seeded row per UTC date
-- ---------------------------------------------------------------------------
create table public.daily_challenges (
  date       date primary key,
  round_ids  uuid[] not null check (array_length(round_ids, 1) = 5),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 8. duels — live 1v1 matches (HP system). Server-authoritative.
-- ---------------------------------------------------------------------------
create table public.duels (
  id            uuid primary key default gen_random_uuid(),
  status        public.duel_status not null default 'waiting',
  player_a      uuid not null references public.profiles (id) on delete cascade,
  player_b      uuid references public.profiles (id) on delete cascade,
  round_ids     uuid[] not null default '{}',
  hp_a          integer not null default 5000 check (hp_a between 0 and 5000),
  hp_b          integer not null default 5000 check (hp_b between 0 and 5000),
  current_round smallint not null default 0 check (current_round between 0 and 5),
  winner        uuid references public.profiles (id) on delete set null,
  invite_code   text unique,          -- short code for invite links (null = open queue)
  channel_id    text,                 -- realtime channel name (duel:{id})
  created_at    timestamptz not null default now(),
  started_at    timestamptz,
  completed_at  timestamptz,

  constraint duels_distinct_players check (player_b is null or player_a <> player_b)
);

create index duels_player_a_idx on public.duels (player_a, status);
create index duels_player_b_idx on public.duels (player_b, status);
create index duels_open_queue_idx on public.duels (created_at)
  where status = 'waiting' and invite_code is null;

-- ---------------------------------------------------------------------------
-- 9. duel_rounds — per-round answers/scores/damage within a duel
--    Rows become client-readable only after `revealed_at` is set (so a
--    mid-round opponent answer can never be read out of the database).
-- ---------------------------------------------------------------------------
create table public.duel_rounds (
  duel_id     uuid not null references public.duels (id) on delete cascade,
  round_no    smallint not null check (round_no between 1 and 5),
  round_id    uuid not null references public.rounds (id) on delete restrict,
  answer_a    jsonb,
  answer_b    jsonb,
  score_a     integer check (score_a between 0 and 5000),
  score_b     integer check (score_b between 0 and 5000),
  damage      integer check (damage >= 0),
  damage_to   uuid references public.profiles (id),  -- who took the damage
  started_at  timestamptz,
  revealed_at timestamptz,            -- set by server after both scored
  primary key (duel_id, round_no)
);

-- ---------------------------------------------------------------------------
-- 10. friendships — directed edges; 'accepted' is mirrored by the app layer
-- ---------------------------------------------------------------------------
create table public.friendships (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  friend_id  uuid not null references public.profiles (id) on delete cascade,
  status     public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  constraint friendships_no_self check (user_id <> friend_id)
);

create index friendships_friend_idx on public.friendships (friend_id, status);

-- ---------------------------------------------------------------------------
-- 11. Triggers
-- ---------------------------------------------------------------------------

-- 11a. Auto-create a profile whenever an auth user is created.
--      Handle preference: user_metadata.handle → email local part → random.
--      Collisions get a random 4-char suffix (retry loop, 5 attempts).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_handle text;
  candidate   text;
  attempt     int := 0;
begin
  base_handle := coalesce(
    new.raw_user_meta_data ->> 'handle',
    split_part(new.email, '@', 1),
    'player'
  );
  -- sanitize to the allowed charset & length
  base_handle := regexp_replace(base_handle, '[^a-zA-Z0-9_]', '', 'g');
  base_handle := substr(base_handle, 1, 16);
  if char_length(base_handle) < 3 then
    base_handle := 'player';
  end if;

  candidate := base_handle;
  loop
    begin
      insert into public.profiles (id, handle)
      values (new.id, candidate);
      exit;
    exception when unique_violation then
      attempt := attempt + 1;
      if attempt >= 5 then
        -- last resort: uuid fragment is effectively collision-free
        candidate := 'player_' || replace(substr(gen_random_uuid()::text, 1, 8), '-', '');
      else
        candidate := substr(base_handle, 1, 14) || '_' || substr(md5(random()::text), 1, 4);
      end if;
    end;
  end loop;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 11b. Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger friendships_touch_updated_at
  before update on public.friendships
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 12. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.games            enable row level security;
alter table public.rounds           enable row level security;   -- no policies: server-only
alter table public.runs             enable row level security;
alter table public.round_results    enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.duels            enable row level security;
alter table public.duel_rounds      enable row level security;
alter table public.friendships      enable row level security;

-- profiles: public read (handles/avatars/levels appear on leaderboards & duels);
-- users update only their own row, and only safe columns (see grants below).
create policy "profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- games: catalog is public; writes are server-only.
create policy "active games are publicly readable"
  on public.games for select
  to anon, authenticated
  using (is_active);

-- rounds: NO policies on purpose. Only service role (bypasses RLS) reads truth.

-- runs: owners read their own; recipients of a challenge link can read the
-- parent run they are challenging (head-to-head result view).
create policy "users read own runs"
  on public.runs for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or id in (
      select r.parent_run_id from public.runs r
      where r.user_id = (select auth.uid()) and r.parent_run_id is not null
    )
  );
-- inserts/updates: Edge Functions only (service role) — no policies.

-- round_results: readable through your own (or challenged) runs.
create policy "users read results of visible runs"
  on public.round_results for select
  to authenticated
  using (
    run_id in (
      select r.id from public.runs r
      where r.user_id = (select auth.uid())
    )
    or run_id in (
      select r.parent_run_id from public.runs r
      where r.user_id = (select auth.uid()) and r.parent_run_id is not null
    )
  );

-- daily_challenges: dates + round ids are harmless (rounds are unreadable).
create policy "daily challenges are publicly readable"
  on public.daily_challenges for select
  to anon, authenticated
  using (true);

-- duels: participants only.
create policy "participants read own duels"
  on public.duels for select
  to authenticated
  using (player_a = (select auth.uid()) or player_b = (select auth.uid()));

-- duel_rounds: participants, but only AFTER the server reveals the round —
-- prevents reading the opponent's answer mid-round.
create policy "participants read revealed duel rounds"
  on public.duel_rounds for select
  to authenticated
  using (
    revealed_at is not null
    and duel_id in (
      select d.id from public.duels d
      where d.player_a = (select auth.uid()) or d.player_b = (select auth.uid())
    )
  );

-- friendships: either side reads; requester creates pending; recipient
-- accepts/blocks; either side deletes.
create policy "users read own friendship edges"
  on public.friendships for select
  to authenticated
  using (user_id = (select auth.uid()) or friend_id = (select auth.uid()));

create policy "users send friend requests"
  on public.friendships for insert
  to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');

create policy "recipients respond to friend requests"
  on public.friendships for update
  to authenticated
  using (friend_id = (select auth.uid()))
  with check (friend_id = (select auth.uid()));

create policy "users remove own friendship edges"
  on public.friendships for delete
  to authenticated
  using (user_id = (select auth.uid()) or friend_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 13. Privileges (defense in depth on top of RLS)
--     Supabase grants broad table privileges to anon/authenticated by
--     default; narrow them so even a future overly-permissive policy can't
--     open a write path, and so profile stat columns stay server-owned.
-- ---------------------------------------------------------------------------
revoke insert, update, delete on all tables in schema public from anon, authenticated;

-- profiles: clients may update ONLY handle + avatar_url (xp/level/streak are
-- server-owned). Column-level grant enforces this below RLS.
grant update (handle, avatar_url) on public.profiles to authenticated;

-- friendships: full row writes are fine (policies constrain them).
grant insert, update, delete on public.friendships to authenticated;

-- rounds: belt-and-braces — remove even SELECT from client roles.
revoke select on public.rounds from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 14. Leaderboard views (PRD §7, Epic 07)
--     security_invoker = off on purpose: they must aggregate across ALL
--     users' runs (which RLS hides) while projecting only public fields.
-- ---------------------------------------------------------------------------
create or replace view public.daily_leaderboard
with (security_invoker = off) as
  select
    r.daily_date,
    p.id as user_id,
    p.handle,
    p.avatar_url,
    p.level,
    r.total_score,
    r.completed_at
  from public.runs r
  join public.profiles p on p.id = r.user_id
  where r.mode = 'daily' and r.completed_at is not null;

create or replace view public.weekly_leaderboard
with (security_invoker = off) as
  select
    date_trunc('week', r.completed_at)::date as week_start,
    p.id as user_id,
    p.handle,
    p.avatar_url,
    p.level,
    sum(r.total_score)::bigint as weekly_score,
    count(*)::int as runs_counted
  from public.runs r
  join public.profiles p on p.id = r.user_id
  where r.completed_at is not null
  group by 1, 2, 3, 4, 5;

create or replace view public.alltime_leaderboard
with (security_invoker = off) as
  select
    p.id as user_id,
    p.handle,
    p.avatar_url,
    p.level,
    p.xp,
    max(r.total_score)::int as best_run_score,
    count(r.id)::int as total_runs
  from public.profiles p
  left join public.runs r on r.user_id = p.id and r.completed_at is not null
  group by p.id, p.handle, p.avatar_url, p.level, p.xp;

grant select on public.daily_leaderboard,
                public.weekly_leaderboard,
                public.alltime_leaderboard
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 15. Seed data — game catalog (config values from PRD §5)
-- ---------------------------------------------------------------------------
insert into public.games (slug, name, config) values
  ('kern-duel', 'Kern Duel', jsonb_build_object(
    'timerSeconds', 30,
    'scoring', jsonb_build_object('curve', 'exponential', 'perfectTolerancePx', 1)
  )),
  ('contrast-call', 'Contrast Call', jsonb_build_object(
    'timerSeconds', 15,
    'modes', jsonb_build_array('guess', 'fix'),
    'scoring', jsonb_build_object('curve', 'exponential')
  )),
  ('color-match', 'Color Match', jsonb_build_object(
    'peekSeconds', 3,
    'timerSeconds', 20,
    'scoring', jsonb_build_object('curve', 'deltaE2000', 'perfectDeltaE', 2)
  )),
  ('type-snob', 'Type Snob', jsonb_build_object(
    'timerSeconds', 15,
    'scoring', jsonb_build_object('curve', 'timeScaled', 'partialCredit', true)
  ));

-- ============================================================================
-- Done. Post-run checklist (manual, in Supabase dashboard):
--   1. Auth → Providers: enable Email (magic link) and Google OAuth.
--   2. Auth → URL configuration: add your local + deployed origins.
--   3. Verify RLS: as anon, `select * from rounds;` must return zero rows /
--      permission denied; leaderboard views must return rows.
-- ============================================================================
