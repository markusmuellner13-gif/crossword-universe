-- Run this SQL in your Supabase SQL editor to create the required table

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  total_points integer not null default 0,
  level integer not null default 1,
  completed_puzzles text[] not null default '{}',
  active_puzzle_id text,
  active_puzzle_state jsonb,
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.user_progress enable row level security;

-- Allow anyone to read/write their own row (by session_id — anonymous users)
create policy "Allow public access" on public.user_progress
  for all using (true) with check (true);
