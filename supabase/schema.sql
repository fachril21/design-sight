-- DesignSight Arcade – Leaderboard Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Create the leaderboard table
create table leaderboard (
  id uuid default uuid_generate_v4() primary key,
  username text not null,
  user_tag text not null,
  full_username text generated always as (username || '#' || user_tag) stored,
  score integer not null,
  streak_best integer not null,
  accuracy real not null,
  questions_answered integer not null,
  game_id text not null default 'contrast-checker',
  created_at timestamp with time zone default now()
);

-- 2. Indexes for fast leaderboard queries
create index idx_leaderboard_game_score
  on leaderboard(game_id, score desc);

create index idx_leaderboard_username
  on leaderboard(full_username);

-- 3. Enable Row Level Security
alter table leaderboard enable row level security;

-- 4. RLS Policies (public, no auth required)
create policy "Public leaderboard read access"
  on leaderboard for select
  using (true);

create policy "Public leaderboard insert access"
  on leaderboard for insert
  with check (true);
