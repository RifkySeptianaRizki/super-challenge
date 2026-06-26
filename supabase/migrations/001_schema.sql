create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null default 'super-challenge',
  name text not null,
  season text,
  format text not null default 'single_elimination_16',
  series_type text not null default 'BO3',
  best_of integer not null default 3,
  required_wins integer not null default 2,
  total_teams integer not null default 16,
  total_matches integer not null default 15,
  status text not null default 'active',
  timezone text default 'Asia/Jakarta',
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint tournaments_format_check check (format = 'single_elimination_16'),
  constraint tournaments_best_of_check check (best_of in (1, 3, 5, 7, 9)),
  constraint tournaments_required_wins_check check (required_wins = ((best_of + 1) / 2)),
  constraint tournaments_size_check check (total_teams = 16 and total_matches = 15),
  constraint tournaments_series_type_check check (series_type = ('BO' || best_of::text))
);

create table if not exists public.teams (
  id text primary key,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  code text not null,
  name text not null,
  short_name text,
  logo_url text,
  logo_key text,
  city text,
  seed_no integer,
  sort_order integer default 0,
  is_active boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint teams_code_format_check check (code = upper(code) and length(code) <= 12 and code ~ '^[A-Z0-9_-]+$'),
  constraint teams_name_length_check check (length(name) <= 60),
  constraint teams_seed_range_check check (seed_no is null or seed_no between 1 and 16),
  constraint teams_tournament_code_unique unique (tournament_id, code)
);

create unique index if not exists teams_tournament_seed_unique
on public.teams(tournament_id, seed_no)
where seed_no is not null;

create table if not exists public.bracket_matches (
  id text primary key,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round text not null,
  round_label text not null,
  round_index integer not null,
  order_no integer not null,
  match_no integer not null,
  label text,
  best_of integer not null default 3,
  required_wins integer not null default 2,
  team_a_id text references public.teams(id) on delete set null,
  team_b_id text references public.teams(id) on delete set null,
  team_a_seed integer,
  team_b_seed integer,
  score_a integer not null default 0,
  score_b integer not null default 0,
  winner_team_id text references public.teams(id) on delete set null,
  loser_team_id text references public.teams(id) on delete set null,
  status text not null default 'empty',
  match_date date,
  match_time time,
  venue text,
  stage text,
  stream_link text,
  next_match_id text,
  next_slot text check (next_slot in ('A','B') or next_slot is null),
  source_match_a text,
  source_match_b text,
  locked boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint bracket_round_check check (round in ('R16', 'QF', 'SF', 'GF')),
  constraint bracket_status_check check (status in ('empty', 'upcoming', 'live', 'completed')),
  constraint bracket_best_of_check check (best_of in (1, 3, 5, 7, 9)),
  constraint bracket_required_wins_check check (required_wins = ((best_of + 1) / 2)),
  constraint bracket_score_range_check check (
    score_a >= 0 and score_b >= 0 and score_a <= required_wins and score_b <= required_wins
  ),
  constraint bracket_not_both_winners_check check (not (score_a = required_wins and score_b = required_wins)),
  constraint bracket_completed_consistency_check check (
    status <> 'completed'
    or (
      team_a_id is not null
      and team_b_id is not null
      and winner_team_id is not null
      and loser_team_id is not null
      and winner_team_id <> loser_team_id
      and (
        (
          score_a = required_wins
          and score_b < required_wins
          and winner_team_id = team_a_id
          and loser_team_id = team_b_id
        )
        or (
          score_b = required_wins
          and score_a < required_wins
          and winner_team_id = team_b_id
          and loser_team_id = team_a_id
        )
      )
    )
  )
);

create unique index if not exists bracket_tournament_match_no_unique
on public.bracket_matches(tournament_id, match_no);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'admin',
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id bigserial primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz default now()
);

create table if not exists public.draw_events (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  mode text not null check (mode in ('manual', 'spin', 'seeded')),
  best_of integer not null check (best_of in (1, 3, 5, 7, 9)),
  draw_payload jsonb not null,
  applied boolean default false,
  created_at timestamptz default now()
);

drop trigger if exists tournaments_set_updated_at on public.tournaments;
create trigger tournaments_set_updated_at before update on public.tournaments
for each row execute function public.set_updated_at();

drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at before update on public.teams
for each row execute function public.set_updated_at();

drop trigger if exists bracket_matches_set_updated_at on public.bracket_matches;
create trigger bracket_matches_set_updated_at before update on public.bracket_matches
for each row execute function public.set_updated_at();

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at before update on public.admin_users
for each row execute function public.set_updated_at();
