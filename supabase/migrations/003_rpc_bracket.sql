create or replace function public.assert_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
end;
$$;

create or replace function public.required_wins_for_best_of(p_best_of integer)
returns integer
language sql
immutable
as $$
  select ((p_best_of + 1) / 2);
$$;

create or replace function public.assert_valid_best_of(p_best_of integer)
returns void
language plpgsql
immutable
as $$
begin
  if p_best_of not in (1, 3, 5, 7, 9) then
    raise exception 'best_of must be one of 1, 3, 5, 7, 9';
  end if;
end;
$$;

create or replace function public.match_status_for(
  p_team_a_id text,
  p_team_b_id text,
  p_score_a integer,
  p_score_b integer,
  p_required_wins integer
)
returns text
language sql
immutable
as $$
  select case
    when p_team_a_id is null or p_team_b_id is null then 'empty'
    when (p_score_a = p_required_wins and p_score_b < p_required_wins)
      or (p_score_b = p_required_wins and p_score_a < p_required_wins) then 'completed'
    when p_score_a = 0 and p_score_b = 0 then 'upcoming'
    else 'live'
  end;
$$;

create or replace function public.bracket_for_tournament(p_tournament_id uuid)
returns setof public.bracket_matches
language sql
stable
as $$
  select *
  from public.bracket_matches
  where tournament_id = p_tournament_id
  order by round_index, order_no;
$$;

create or replace function public.reset_downstream_from_match(p_match_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent public.bracket_matches%rowtype;
  v_child public.bracket_matches%rowtype;
begin
  select * into v_parent
  from public.bracket_matches
  where id = p_match_id;

  if v_parent.next_match_id is null then
    return;
  end if;

  select * into v_child
  from public.bracket_matches
  where id = v_parent.next_match_id
  for update;

  if not found then
    return;
  end if;

  if v_parent.next_slot = 'A' then
    update public.bracket_matches
    set team_a_id = null,
        team_a_seed = null,
        score_a = 0,
        score_b = 0,
        winner_team_id = null,
        loser_team_id = null,
        status = public.match_status_for(null, team_b_id, 0, 0, required_wins),
        updated_at = now()
    where id = v_child.id;
  else
    update public.bracket_matches
    set team_b_id = null,
        team_b_seed = null,
        score_a = 0,
        score_b = 0,
        winner_team_id = null,
        loser_team_id = null,
        status = public.match_status_for(team_a_id, null, 0, 0, required_wins),
        updated_at = now()
    where id = v_child.id;
  end if;

  perform public.reset_downstream_from_match(v_child.id);
end;
$$;

create or replace function public.propagate_winner_to_next(p_match_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.bracket_matches%rowtype;
  v_seed integer;
begin
  select * into v_match
  from public.bracket_matches
  where id = p_match_id;

  if v_match.status <> 'completed' or v_match.next_match_id is null then
    return;
  end if;

  v_seed := case
    when v_match.winner_team_id = v_match.team_a_id then v_match.team_a_seed
    else v_match.team_b_seed
  end;

  if v_match.next_slot = 'A' then
    update public.bracket_matches
    set team_a_id = v_match.winner_team_id,
        team_a_seed = v_seed,
        status = public.match_status_for(v_match.winner_team_id, team_b_id, 0, 0, required_wins),
        updated_at = now()
    where id = v_match.next_match_id;
  else
    update public.bracket_matches
    set team_b_id = v_match.winner_team_id,
        team_b_seed = v_seed,
        status = public.match_status_for(team_a_id, v_match.winner_team_id, 0, 0, required_wins),
        updated_at = now()
    where id = v_match.next_match_id;
  end if;
end;
$$;

create or replace function public.set_match_result(
  p_match_id text,
  p_score_a integer,
  p_score_b integer
)
returns setof public.bracket_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.bracket_matches%rowtype;
  v_before jsonb;
  v_status text;
  v_winner text;
  v_loser text;
  v_old_winner text;
begin
  perform public.assert_admin();

  select * into v_match
  from public.bracket_matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'Match % not found', p_match_id;
  end if;

  v_before := to_jsonb(v_match);
  v_old_winner := v_match.winner_team_id;

  if p_score_a is null or p_score_b is null then
    raise exception 'Scores are required';
  end if;
  if p_score_a < 0 or p_score_b < 0 then
    raise exception 'Scores cannot be negative';
  end if;
  if p_score_a > v_match.required_wins or p_score_b > v_match.required_wins then
    raise exception 'Scores cannot exceed required wins';
  end if;
  if p_score_a = v_match.required_wins and p_score_b = v_match.required_wins then
    raise exception 'Both teams cannot reach required wins';
  end if;
  if (p_score_a > 0 or p_score_b > 0) and (v_match.team_a_id is null or v_match.team_b_id is null) then
    raise exception 'Match must have two teams before score can be set';
  end if;

  v_status := public.match_status_for(
    v_match.team_a_id,
    v_match.team_b_id,
    p_score_a,
    p_score_b,
    v_match.required_wins
  );

  if v_status = 'completed' then
    if p_score_a = v_match.required_wins then
      v_winner := v_match.team_a_id;
      v_loser := v_match.team_b_id;
    else
      v_winner := v_match.team_b_id;
      v_loser := v_match.team_a_id;
    end if;
  else
    v_winner := null;
    v_loser := null;
  end if;

  update public.bracket_matches
  set score_a = p_score_a,
      score_b = p_score_b,
      winner_team_id = v_winner,
      loser_team_id = v_loser,
      status = v_status,
      updated_at = now()
  where id = p_match_id;

  if coalesce(v_old_winner, '') <> coalesce(v_winner, '') then
    perform public.reset_downstream_from_match(p_match_id);
  end if;

  if v_winner is not null then
    perform public.propagate_winner_to_next(p_match_id);
  end if;

  insert into public.audit_logs(actor_id, action, entity, entity_id, before_data, after_data)
  select auth.uid(), 'update_match_result', 'bracket_matches', p_match_id, v_before, to_jsonb(bm)
  from public.bracket_matches bm
  where bm.id = p_match_id;

  return query
  select * from public.bracket_for_tournament(v_match.tournament_id);
end;
$$;

create or replace function public.clear_match_result(p_match_id text)
returns setof public.bracket_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.bracket_matches%rowtype;
  v_before jsonb;
begin
  perform public.assert_admin();

  select * into v_match
  from public.bracket_matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'Match % not found', p_match_id;
  end if;

  v_before := to_jsonb(v_match);

  update public.bracket_matches
  set score_a = 0,
      score_b = 0,
      winner_team_id = null,
      loser_team_id = null,
      status = public.match_status_for(team_a_id, team_b_id, 0, 0, required_wins),
      updated_at = now()
  where id = p_match_id;

  perform public.reset_downstream_from_match(p_match_id);

  insert into public.audit_logs(actor_id, action, entity, entity_id, before_data, after_data)
  select auth.uid(), 'clear_match_result', 'bracket_matches', p_match_id, v_before, to_jsonb(bm)
  from public.bracket_matches bm
  where bm.id = p_match_id;

  return query
  select * from public.bracket_for_tournament(v_match.tournament_id);
end;
$$;

create or replace function public.update_match_schedule(
  p_match_id text,
  p_match_date date,
  p_match_time time,
  p_venue text,
  p_stage text,
  p_stream_link text
)
returns setof public.bracket_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.bracket_matches%rowtype;
  v_before jsonb;
begin
  perform public.assert_admin();

  select * into v_match
  from public.bracket_matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'Match % not found', p_match_id;
  end if;

  v_before := to_jsonb(v_match);

  update public.bracket_matches
  set match_date = p_match_date,
      match_time = p_match_time,
      venue = nullif(left(coalesce(p_venue, ''), 120), ''),
      stage = nullif(left(coalesce(p_stage, ''), 120), ''),
      stream_link = nullif(left(coalesce(p_stream_link, ''), 240), ''),
      updated_at = now()
  where id = p_match_id;

  insert into public.audit_logs(actor_id, action, entity, entity_id, before_data, after_data)
  select auth.uid(), 'update_match_schedule', 'bracket_matches', p_match_id, v_before, to_jsonb(bm)
  from public.bracket_matches bm
  where bm.id = p_match_id;

  return query
  select * from public.bracket_for_tournament(v_match.tournament_id);
end;
$$;

create or replace function public.reset_bracket_results(p_tournament_id uuid)
returns setof public.bracket_matches
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();

  update public.bracket_matches
  set score_a = 0,
      score_b = 0,
      winner_team_id = null,
      loser_team_id = null,
      team_a_id = case when round = 'R16' then team_a_id else null end,
      team_b_id = case when round = 'R16' then team_b_id else null end,
      team_a_seed = case when round = 'R16' then team_a_seed else null end,
      team_b_seed = case when round = 'R16' then team_b_seed else null end,
      status = case
        when round = 'R16' and team_a_id is not null and team_b_id is not null then 'upcoming'
        else 'empty'
      end,
      updated_at = now()
  where tournament_id = p_tournament_id;

  insert into public.audit_logs(actor_id, action, entity, entity_id, after_data)
  values (auth.uid(), 'reset_bracket_results', 'tournaments', p_tournament_id::text, jsonb_build_object('tournament_id', p_tournament_id));

  return query
  select * from public.bracket_for_tournament(p_tournament_id);
end;
$$;

create or replace function public.apply_bracket_draw(
  p_tournament_id uuid,
  p_best_of integer,
  p_slots jsonb,
  p_mode text,
  p_draw_metadata jsonb default '{}'::jsonb,
  p_keep_schedule boolean default true
)
returns setof public.bracket_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_required_wins integer;
  v_slot_count integer;
  v_unique_count integer;
  v_valid_count integer;
begin
  perform public.assert_admin();
  perform public.assert_valid_best_of(p_best_of);

  if jsonb_typeof(p_slots) <> 'array' then
    raise exception 'slots must be a JSON array';
  end if;

  v_slot_count := jsonb_array_length(p_slots);
  if v_slot_count <> 16 then
    raise exception 'Draw must contain exactly 16 slots';
  end if;

  select count(distinct value), count(t.id)
  into v_unique_count, v_valid_count
  from jsonb_array_elements_text(p_slots) slot(value)
  left join public.teams t
    on t.id = slot.value
   and t.tournament_id = p_tournament_id
   and t.is_active = true;

  if v_unique_count <> 16 or v_valid_count <> 16 then
    raise exception 'Draw slots must contain 16 unique valid teams';
  end if;

  v_required_wins := public.required_wins_for_best_of(p_best_of);

  update public.tournaments
  set best_of = p_best_of,
      required_wins = v_required_wins,
      series_type = 'BO' || p_best_of::text,
      updated_at = now()
  where id = p_tournament_id;

  update public.bracket_matches bm
  set best_of = p_best_of,
      required_wins = v_required_wins,
      team_a_id = slots.team_a_id,
      team_b_id = slots.team_b_id,
      team_a_seed = ((bm.order_no - 1) * 2 + 1),
      team_b_seed = ((bm.order_no - 1) * 2 + 2),
      score_a = 0,
      score_b = 0,
      winner_team_id = null,
      loser_team_id = null,
      status = 'upcoming',
      metadata = coalesce(bm.metadata, '{}'::jsonb) || jsonb_build_object('drawMode', p_mode),
      match_date = case when p_keep_schedule then bm.match_date else null end,
      match_time = case when p_keep_schedule then bm.match_time else null end,
      venue = case when p_keep_schedule then bm.venue else null end,
      stage = case when p_keep_schedule then bm.stage else null end,
      stream_link = case when p_keep_schedule then bm.stream_link else null end,
      updated_at = now()
  from (
    select
      ((ordinality - 1) / 2 + 1)::integer as order_no,
      max(value) filter (where (ordinality % 2) = 1) as team_a_id,
      max(value) filter (where (ordinality % 2) = 0) as team_b_id
    from jsonb_array_elements_text(p_slots) with ordinality as slot(value, ordinality)
    group by ((ordinality - 1) / 2 + 1)
  ) slots
  where bm.tournament_id = p_tournament_id
    and bm.round = 'R16'
    and bm.order_no = slots.order_no;

  update public.bracket_matches bm
  set best_of = p_best_of,
      required_wins = v_required_wins,
      team_a_id = null,
      team_b_id = null,
      team_a_seed = null,
      team_b_seed = null,
      score_a = 0,
      score_b = 0,
      winner_team_id = null,
      loser_team_id = null,
      status = 'empty',
      metadata = coalesce(bm.metadata, '{}'::jsonb) || jsonb_build_object('drawMode', p_mode),
      match_date = case when p_keep_schedule then bm.match_date else null end,
      match_time = case when p_keep_schedule then bm.match_time else null end,
      venue = case when p_keep_schedule then bm.venue else null end,
      stage = case when p_keep_schedule then bm.stage else null end,
      stream_link = case when p_keep_schedule then bm.stream_link else null end,
      updated_at = now()
  where bm.tournament_id = p_tournament_id
    and bm.round <> 'R16';

  insert into public.draw_events(tournament_id, actor_id, mode, best_of, draw_payload, applied)
  values (
    p_tournament_id,
    auth.uid(),
    p_mode,
    p_best_of,
    jsonb_build_object('slots', p_slots, 'metadata', p_draw_metadata),
    true
  );

  insert into public.audit_logs(actor_id, action, entity, entity_id, after_data)
  values (
    auth.uid(),
    case when p_mode = 'spin' then 'apply_spin_draw' else 'generate_manual_bracket' end,
    'tournaments',
    p_tournament_id::text,
    jsonb_build_object('best_of', p_best_of, 'slots', p_slots, 'metadata', p_draw_metadata)
  );

  return query
  select * from public.bracket_for_tournament(p_tournament_id);
end;
$$;

create or replace function public.apply_manual_bracket_draw(
  p_tournament_id uuid,
  p_best_of integer,
  p_slots jsonb,
  p_keep_schedule boolean default true
)
returns setof public.bracket_matches
language sql
security definer
set search_path = public
as $$
  select * from public.apply_bracket_draw(
    p_tournament_id,
    p_best_of,
    p_slots,
    'manual',
    '{}'::jsonb,
    p_keep_schedule
  );
$$;

create or replace function public.apply_spin_bracket_draw(
  p_tournament_id uuid,
  p_best_of integer,
  p_slots jsonb,
  p_draw_metadata jsonb default '{}'::jsonb,
  p_keep_schedule boolean default true
)
returns setof public.bracket_matches
language sql
security definer
set search_path = public
as $$
  select * from public.apply_bracket_draw(
    p_tournament_id,
    p_best_of,
    p_slots,
    'spin',
    coalesce(p_draw_metadata, '{}'::jsonb),
    p_keep_schedule
  );
$$;

create or replace function public.generate_bracket_from_seeds(p_tournament_id uuid)
returns setof public.bracket_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_best_of integer;
  v_slots jsonb;
begin
  perform public.assert_admin();

  select best_of into v_best_of
  from public.tournaments
  where id = p_tournament_id;

  with seeded as (
    select id, row_number() over (order by seed_no nulls last, sort_order, code) as seed_no
    from public.teams
    where tournament_id = p_tournament_id
      and is_active = true
    order by seed_no nulls last, sort_order, code
    limit 16
  ),
  ordered(pos, seed_no) as (
    values
      (1, 1), (2, 16), (3, 8), (4, 9),
      (5, 4), (6, 13), (7, 5), (8, 12),
      (9, 2), (10, 15), (11, 7), (12, 10),
      (13, 3), (14, 14), (15, 6), (16, 11)
  )
  select jsonb_agg(seeded.id order by ordered.pos)
  into v_slots
  from ordered
  join seeded using (seed_no);

  if coalesce(jsonb_array_length(v_slots), 0) <> 16 then
    raise exception 'Need 16 active teams to generate bracket';
  end if;

  return query
  select * from public.apply_bracket_draw(
    p_tournament_id,
    v_best_of,
    v_slots,
    'seeded',
    '{}'::jsonb,
    true
  );
end;
$$;

create or replace function public.update_tournament_series_format(
  p_tournament_id uuid,
  p_best_of integer,
  p_reset_results boolean default true,
  p_keep_schedule boolean default true
)
returns setof public.bracket_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_required_wins integer;
  v_completed_count integer;
  v_invalid_partial_count integer;
begin
  perform public.assert_admin();
  perform public.assert_valid_best_of(p_best_of);
  v_required_wins := public.required_wins_for_best_of(p_best_of);

  select count(*) into v_completed_count
  from public.bracket_matches
  where tournament_id = p_tournament_id
    and status = 'completed';

  if not p_reset_results and v_completed_count > 0 then
    raise exception 'Cannot change series format without reset after completed matches exist';
  end if;

  select count(*) into v_invalid_partial_count
  from public.bracket_matches
  where tournament_id = p_tournament_id
    and (score_a > v_required_wins or score_b > v_required_wins);

  if not p_reset_results and v_invalid_partial_count > 0 then
    raise exception 'Existing scores exceed new required wins';
  end if;

  update public.tournaments
  set best_of = p_best_of,
      required_wins = v_required_wins,
      series_type = 'BO' || p_best_of::text,
      updated_at = now()
  where id = p_tournament_id;

  update public.bracket_matches
  set best_of = p_best_of,
      required_wins = v_required_wins,
      score_a = case when p_reset_results then 0 else score_a end,
      score_b = case when p_reset_results then 0 else score_b end,
      winner_team_id = case when p_reset_results then null else winner_team_id end,
      loser_team_id = case when p_reset_results then null else loser_team_id end,
      team_a_id = case when p_reset_results and round <> 'R16' then null else team_a_id end,
      team_b_id = case when p_reset_results and round <> 'R16' then null else team_b_id end,
      team_a_seed = case when p_reset_results and round <> 'R16' then null else team_a_seed end,
      team_b_seed = case when p_reset_results and round <> 'R16' then null else team_b_seed end,
      status = case
        when p_reset_results and round = 'R16' and team_a_id is not null and team_b_id is not null then 'upcoming'
        when p_reset_results then 'empty'
        else status
      end,
      match_date = case when p_keep_schedule then match_date else null end,
      match_time = case when p_keep_schedule then match_time else null end,
      venue = case when p_keep_schedule then venue else null end,
      stage = case when p_keep_schedule then stage else null end,
      stream_link = case when p_keep_schedule then stream_link else null end,
      updated_at = now()
  where tournament_id = p_tournament_id;

  insert into public.audit_logs(actor_id, action, entity, entity_id, after_data)
  values (
    auth.uid(),
    'update_series_format',
    'tournaments',
    p_tournament_id::text,
    jsonb_build_object('best_of', p_best_of, 'reset_results', p_reset_results, 'keep_schedule', p_keep_schedule)
  );

  return query
  select * from public.bracket_for_tournament(p_tournament_id);
end;
$$;

grant execute on function public.set_match_result(text, integer, integer) to authenticated;
grant execute on function public.clear_match_result(text) to authenticated;
grant execute on function public.update_match_schedule(text, date, time, text, text, text) to authenticated;
grant execute on function public.reset_bracket_results(uuid) to authenticated;
grant execute on function public.generate_bracket_from_seeds(uuid) to authenticated;
grant execute on function public.apply_manual_bracket_draw(uuid, integer, jsonb, boolean) to authenticated;
grant execute on function public.apply_spin_bracket_draw(uuid, integer, jsonb, jsonb, boolean) to authenticated;
grant execute on function public.update_tournament_series_format(uuid, integer, boolean, boolean) to authenticated;
