alter table public.teams
add column if not exists logo_url text;

alter table public.teams
add column if not exists logo_key text;

alter table public.teams
add column if not exists metadata jsonb default '{}'::jsonb;

alter table public.teams
alter column metadata set default '{}'::jsonb;

alter table public.teams
drop constraint if exists teams_logo_url_safe_check;

alter table public.teams
add constraint teams_logo_url_safe_check
check (
  logo_url is null
  or logo_url = ''
  or logo_url like 'https://%'
  or logo_url like '/assets/%'
);
