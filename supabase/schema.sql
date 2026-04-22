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

create policy "Public leaderboard update access"
  on leaderboard for update
  using (true)
  with check (true);

create policy "Public leaderboard delete access"
  on leaderboard for delete
  using (true);

-- 5. Cleanup existing duplicates (Optional: run if you already have duplicate scores)
-- DELETE FROM leaderboard
-- WHERE id NOT IN (
--     SELECT DISTINCT ON (game_id, full_username) id
--     FROM leaderboard
--     ORDER BY game_id, full_username, score DESC
-- );

-- 6. Enforce Unique Score per user per game (Optional: run after deleting duplicates)
-- ALTER TABLE leaderboard ADD CONSTRAINT unique_user_game UNIQUE (game_id, username, user_tag);

-- 7. Phase 3: Multiplayer & Competitive
-- Table: match_sessions (for 1v1 PvP)
create table match_sessions (
  id uuid primary key default uuid_generate_v4(),
  game_id text not null, -- 'contrast-checker' or 'kerning-challenge'
  player1 text not null,
  player2 text,
  player1_score integer default 0,
  player2_score integer default 0,
  player1_ready boolean default false,
  player2_ready boolean default false,
  status text not null default 'waiting', -- 'waiting', 'in_progress', 'completed', 'cancelled'
  questions jsonb not null, -- same questions for both players
  current_round integer default 0,
  started_at timestamp,
  ended_at timestamp,
  created_at timestamp default now()
);

create index idx_match_sessions_status on match_sessions(status, game_id);
create index idx_match_sessions_players on match_sessions(player1, player2);

-- Table: rooms (for Kahoot-style multiplayer)
create table rooms (
  id uuid primary key default uuid_generate_v4(),
  room_code text unique not null, -- 6-char code (e.g., 'ABC123')
  game_id text not null,
  host_username text not null,
  max_players integer default 50,
  status text not null default 'lobby', -- 'lobby', 'in_progress', 'ended'
  questions jsonb not null,
  current_question_index integer default 0,
  time_per_question integer default 20, -- seconds
  created_at timestamp default now(),
  started_at timestamp,
  ended_at timestamp
);

create index idx_rooms_code on rooms(room_code);
create index idx_rooms_status on rooms(status);

-- Table: room_participants
create table room_participants (
  room_id uuid references rooms(id) on delete cascade,
  username text not null,
  score integer default 0,
  answers jsonb default '[]', -- array of {question_index, answer, is_correct, time_taken}
  joined_at timestamp default now(),
  primary key (room_id, username)
);

create index idx_room_participants_room on room_participants(room_id);

-- Enable RLS
alter table match_sessions enable row level security;
alter table rooms enable row level security;
alter table room_participants enable row level security;

-- Match sessions: anyone can read, only participants can update their own data
create policy "Anyone can view matches" on match_sessions for select using (true);
create policy "Players can update their match" on match_sessions for update using (
  player1 = current_setting('request.jwt.claims', true)::json->>'username' 
  or player2 = current_setting('request.jwt.claims', true)::json->>'username'
);

-- Rooms: anyone can read, only host can update
create policy "Anyone can view rooms" on rooms for select using (true);
create policy "Host can update room" on rooms for update using (
  host_username = current_setting('request.jwt.claims', true)::json->>'username'
);

-- Room participants: anyone in room can read, users can update their own data
create policy "Anyone can view participants" on room_participants for select using (true);
create policy "Users can update their own data" on room_participants for update using (
  username = current_setting('request.jwt.claims', true)::json->>'username'
);
