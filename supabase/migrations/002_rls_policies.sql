create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and active = true
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.bracket_matches enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_users enable row level security;
alter table public.audit_logs enable row level security;
alter table public.draw_events enable row level security;

drop policy if exists "public can read active tournaments" on public.tournaments;
create policy "public can read active tournaments"
on public.tournaments for select
to anon, authenticated
using (is_active = true);

drop policy if exists "admin can manage tournaments" on public.tournaments;
create policy "admin can manage tournaments"
on public.tournaments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public can read active teams" on public.teams;
create policy "public can read active teams"
on public.teams for select
to anon, authenticated
using (is_active = true);

drop policy if exists "admin can manage teams" on public.teams;
create policy "admin can manage teams"
on public.teams for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public can read bracket" on public.bracket_matches;
create policy "public can read bracket"
on public.bracket_matches for select
to anon, authenticated
using (true);

drop policy if exists "admin can manage bracket" on public.bracket_matches;
create policy "admin can manage bracket"
on public.bracket_matches for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public can read safe settings" on public.site_settings;
create policy "public can read safe settings"
on public.site_settings for select
to anon, authenticated
using (
  key in (
    'active_tournament_slug',
    'show_admin_button',
    'homepage_settings',
    'public_visibility',
    'site_config',
    'matches',
    'weeks',
    'standings',
    'countdown',
    'grand_finals',
    'broadcast',
    'sponsors',
    'settings'
  )
);

drop policy if exists "admin can manage settings" on public.site_settings;
create policy "admin can manage settings"
on public.site_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin can read admin users" on public.admin_users;
create policy "admin can read admin users"
on public.admin_users for select
to authenticated
using (public.is_admin());

drop policy if exists "admin can read audit logs" on public.audit_logs;
create policy "admin can read audit logs"
on public.audit_logs for select
to authenticated
using (public.is_admin());

drop policy if exists "admin can insert audit logs" on public.audit_logs;
create policy "admin can insert audit logs"
on public.audit_logs for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admin can manage draw events" on public.draw_events;
create policy "admin can manage draw events"
on public.draw_events for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.tournaments, public.teams, public.bracket_matches, public.site_settings to anon, authenticated;
grant select, insert, update, delete on public.tournaments, public.teams, public.bracket_matches, public.site_settings to authenticated;
grant select on public.admin_users to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant usage, select on sequence public.audit_logs_id_seq to authenticated;
grant select, insert, update, delete on public.draw_events to authenticated;
