-- Flexible single-elimination support for 2-16 participants with BYE slots.

alter table public.tournaments
  drop constraint if exists tournaments_format_check,
  drop constraint if exists tournaments_size_check;

alter table public.tournaments
  alter column format set default 'flexible_single_elimination';

alter table public.tournaments
  add column if not exists participant_count integer not null default 16,
  add column if not exists bracket_size integer not null default 16,
  add column if not exists bye_count integer not null default 0,
  add column if not exists max_teams integer not null default 16,
  add column if not exists min_teams integer not null default 2;

update public.tournaments
set format = 'flexible_single_elimination',
    participant_count = coalesce(participant_count, total_teams, 16),
    bracket_size = coalesce(bracket_size, total_teams, 16),
    bye_count = greatest(coalesce(bracket_size, total_teams, 16) - coalesce(participant_count, total_teams, 16), 0),
    max_teams = 16,
    min_teams = 2,
    total_teams = coalesce(participant_count, total_teams, 16),
    total_matches = greatest(coalesce(participant_count, total_teams, 16) - 1, 1);

alter table public.tournaments
  add constraint tournaments_format_check
  check (format in ('flexible_single_elimination', 'single_elimination_16')),
  add constraint tournaments_size_check
  check (
    min_teams = 2
    and max_teams = 16
    and participant_count between min_teams and max_teams
    and bracket_size in (2, 4, 8, 16)
    and bracket_size >= participant_count
    and bye_count = bracket_size - participant_count
    and total_teams = participant_count
    and total_matches = participant_count - 1
  );

alter table public.teams
  add column if not exists is_participant boolean not null default true,
  add column if not exists checked_in boolean not null default true,
  add column if not exists dropped boolean not null default false;

update public.teams
set is_participant = coalesce(is_participant, is_active, true),
    checked_in = coalesce(checked_in, true),
    dropped = coalesce(dropped, false);

alter table public.bracket_matches
  drop constraint if exists bracket_completed_consistency_check;

alter table public.bracket_matches
  add column if not exists slot_a_type text not null default 'empty',
  add column if not exists slot_b_type text not null default 'empty',
  add column if not exists team_a_is_bye boolean not null default false,
  add column if not exists team_b_is_bye boolean not null default false,
  add column if not exists auto_advanced boolean not null default false,
  add column if not exists playable boolean not null default false,
  add column if not exists bracket_size integer not null default 16,
  add column if not exists participant_count integer not null default 16,
  add column if not exists bye_reason text not null default '';

update public.bracket_matches bm
set slot_a_type = case when bm.team_a_id is not null then 'team' else 'empty' end,
    slot_b_type = case when bm.team_b_id is not null then 'team' else 'empty' end,
    team_a_is_bye = false,
    team_b_is_bye = false,
    auto_advanced = false,
    playable = bm.team_a_id is not null and bm.team_b_id is not null,
    bracket_size = coalesce(t.bracket_size, 16),
    participant_count = coalesce(t.participant_count, 16),
    bye_reason = ''
from public.tournaments t
where t.id = bm.tournament_id;

alter table public.bracket_matches
  add constraint bracket_slot_type_check
  check (slot_a_type in ('team', 'bye', 'empty') and slot_b_type in ('team', 'bye', 'empty')),
  add constraint bracket_flexible_size_check
  check (
    participant_count between 2 and 16
    and bracket_size in (2, 4, 8, 16)
    and bracket_size >= participant_count
  ),
  add constraint bracket_completed_consistency_check
  check (
    status <> 'completed'
    or (
      auto_advanced = true
      and winner_team_id is not null
      and loser_team_id is null
      and score_a = 0
      and score_b = 0
    )
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
  );

create or replace function public.flexible_bracket_size(p_participant_count integer)
returns integer
language sql
immutable
as $$
  select case
    when p_participant_count between 2 and 2 then 2
    when p_participant_count between 3 and 4 then 4
    when p_participant_count between 5 and 8 then 8
    when p_participant_count between 9 and 16 then 16
    else null
  end;
$$;

create or replace function public.flexible_seed_order(p_bracket_size integer)
returns table(pos integer, seed_no integer)
language sql
immutable
as $$
  select v.pos, v.seed_no
  from (
    values
      (2, 1, 1), (2, 2, 2),
      (4, 1, 1), (4, 2, 4), (4, 3, 2), (4, 4, 3),
      (8, 1, 1), (8, 2, 8), (8, 3, 4), (8, 4, 5),
      (8, 5, 2), (8, 6, 7), (8, 7, 3), (8, 8, 6),
      (16, 1, 1), (16, 2, 16), (16, 3, 8), (16, 4, 9),
      (16, 5, 4), (16, 6, 13), (16, 7, 5), (16, 8, 12),
      (16, 9, 2), (16, 10, 15), (16, 11, 7), (16, 12, 10),
      (16, 13, 3), (16, 14, 14), (16, 15, 6), (16, 16, 11)
  ) as v(bracket_size, pos, seed_no)
  where v.bracket_size = p_bracket_size
  order by v.pos;
$$;

create or replace function public.flexible_match_definitions(p_bracket_size integer)
returns table(
  id text,
  round text,
  round_label text,
  round_index integer,
  order_no integer,
  match_no integer,
  label text,
  next_match_id text,
  next_slot text,
  source_match_a text,
  source_match_b text,
  bracket_size integer
)
language sql
immutable
as $$
  select
    v.id,
    v.round,
    v.round_label,
    v.round_index,
    v.order_no,
    v.match_no,
    'Match ' || v.match_no::text as label,
    v.next_match_id,
    v.next_slot,
    v.source_match_a,
    v.source_match_b,
    v.bracket_size
  from (
    values
      (2, 'GF-1', 'GF', 'Grand Final', 1, 1, 1, null, null, null, null),

      (4, 'SF-1', 'SF', 'Semi Final', 1, 1, 1, 'GF-1', 'A', null, null),
      (4, 'SF-2', 'SF', 'Semi Final', 1, 2, 2, 'GF-1', 'B', null, null),
      (4, 'GF-1', 'GF', 'Grand Final', 2, 1, 3, null, null, 'SF-1', 'SF-2'),

      (8, 'QF-1', 'QF', 'Quarter Final', 1, 1, 1, 'SF-1', 'A', null, null),
      (8, 'QF-2', 'QF', 'Quarter Final', 1, 2, 2, 'SF-1', 'B', null, null),
      (8, 'QF-3', 'QF', 'Quarter Final', 1, 3, 3, 'SF-2', 'A', null, null),
      (8, 'QF-4', 'QF', 'Quarter Final', 1, 4, 4, 'SF-2', 'B', null, null),
      (8, 'SF-1', 'SF', 'Semi Final', 2, 1, 5, 'GF-1', 'A', 'QF-1', 'QF-2'),
      (8, 'SF-2', 'SF', 'Semi Final', 2, 2, 6, 'GF-1', 'B', 'QF-3', 'QF-4'),
      (8, 'GF-1', 'GF', 'Grand Final', 3, 1, 7, null, null, 'SF-1', 'SF-2'),

      (16, 'R16-1', 'R16', 'Round of 16', 1, 1, 1, 'QF-1', 'A', null, null),
      (16, 'R16-2', 'R16', 'Round of 16', 1, 2, 2, 'QF-1', 'B', null, null),
      (16, 'R16-3', 'R16', 'Round of 16', 1, 3, 3, 'QF-2', 'A', null, null),
      (16, 'R16-4', 'R16', 'Round of 16', 1, 4, 4, 'QF-2', 'B', null, null),
      (16, 'R16-5', 'R16', 'Round of 16', 1, 5, 5, 'QF-3', 'A', null, null),
      (16, 'R16-6', 'R16', 'Round of 16', 1, 6, 6, 'QF-3', 'B', null, null),
      (16, 'R16-7', 'R16', 'Round of 16', 1, 7, 7, 'QF-4', 'A', null, null),
      (16, 'R16-8', 'R16', 'Round of 16', 1, 8, 8, 'QF-4', 'B', null, null),
      (16, 'QF-1', 'QF', 'Quarter Final', 2, 1, 9, 'SF-1', 'A', 'R16-1', 'R16-2'),
      (16, 'QF-2', 'QF', 'Quarter Final', 2, 2, 10, 'SF-1', 'B', 'R16-3', 'R16-4'),
      (16, 'QF-3', 'QF', 'Quarter Final', 2, 3, 11, 'SF-2', 'A', 'R16-5', 'R16-6'),
      (16, 'QF-4', 'QF', 'Quarter Final', 2, 4, 12, 'SF-2', 'B', 'R16-7', 'R16-8'),
      (16, 'SF-1', 'SF', 'Semi Final', 3, 1, 13, 'GF-1', 'A', 'QF-1', 'QF-2'),
      (16, 'SF-2', 'SF', 'Semi Final', 3, 2, 14, 'GF-1', 'B', 'QF-3', 'QF-4'),
      (16, 'GF-1', 'GF', 'Grand Final', 4, 1, 15, null, null, 'SF-1', 'SF-2')
  ) as v(bracket_size, id, round, round_label, round_index, order_no, match_no, next_match_id, next_slot, source_match_a, source_match_b)
  where v.bracket_size = p_bracket_size
  order by v.match_no;
$$;

create or replace function public.apply_bye_auto_advance(p_tournament_id uuid)
returns setof public.bracket_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match record;
begin
  perform public.assert_admin();

  update public.bracket_matches
  set winner_team_id = case
        when team_a_id is not null and team_b_is_bye then team_a_id
        when team_b_id is not null and team_a_is_bye then team_b_id
        else winner_team_id
      end,
      loser_team_id = null,
      score_a = 0,
      score_b = 0,
      status = case
        when (team_a_id is not null and team_b_is_bye)
          or (team_b_id is not null and team_a_is_bye)
        then 'completed'
        else status
      end,
      auto_advanced = (
        (team_a_id is not null and team_b_is_bye)
        or (team_b_id is not null and team_a_is_bye)
      ),
      playable = team_a_id is not null
        and team_b_id is not null
        and not team_a_is_bye
        and not team_b_is_bye,
      bye_reason = case
        when (team_a_id is not null and team_b_is_bye)
          or (team_b_id is not null and team_a_is_bye)
        then 'BYE from incomplete bracket'
        else bye_reason
      end,
      updated_at = now()
  where tournament_id = p_tournament_id;

  for v_match in
    select id
    from public.bracket_matches
    where tournament_id = p_tournament_id
      and status = 'completed'
      and auto_advanced = true
    order by round_index, order_no
  loop
    perform public.propagate_winner_to_next(v_match.id);
  end loop;

  update public.bracket_matches
  set slot_a_type = case
        when team_a_is_bye then 'bye'
        when team_a_id is not null then 'team'
        else 'empty'
      end,
      slot_b_type = case
        when team_b_is_bye then 'bye'
        when team_b_id is not null then 'team'
        else 'empty'
      end,
      playable = team_a_id is not null
        and team_b_id is not null
        and auto_advanced = false
        and team_a_is_bye = false
        and team_b_is_bye = false,
      status = case
        when auto_advanced then 'completed'
        when team_a_id is not null and team_b_id is not null and score_a = 0 and score_b = 0 then 'upcoming'
        when team_a_id is null or team_b_id is null then 'empty'
        else status
      end,
      updated_at = now()
  where tournament_id = p_tournament_id;

  return query
  select * from public.bracket_for_tournament(p_tournament_id);
end;
$$;

create or replace function public.apply_flexible_bracket_draw(
  p_tournament_id uuid,
  p_best_of integer,
  p_participant_team_ids text[],
  p_slots jsonb,
  p_mode text,
  p_bye_mode text default 'seeded',
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
  v_participant_count integer;
  v_bracket_size integer;
  v_bye_count integer;
  v_first_round text;
  v_slot_count integer;
  v_team_slot_count integer;
  v_bye_slot_count integer;
  v_unique_team_count integer;
  v_valid_team_count integer;
begin
  perform public.assert_admin();
  perform public.assert_valid_best_of(p_best_of);

  if jsonb_typeof(p_slots) <> 'array' then
    raise exception 'slots must be a JSON array';
  end if;

  select count(distinct id)
  into v_participant_count
  from unnest(coalesce(p_participant_team_ids, array[]::text[])) participant(id)
  where participant.id is not null;

  if v_participant_count = 0 then
    select count(distinct slot_team_id)
    into v_participant_count
    from (
      select case
        when jsonb_typeof(value) = 'object' and value->>'type' = 'team' then value->>'teamId'
        when jsonb_typeof(value) = 'string' and value #>> '{}' <> '__BYE__' then value #>> '{}'
        else null
      end as slot_team_id
      from jsonb_array_elements(p_slots)
    ) slots
    where slot_team_id is not null;
  end if;

  if v_participant_count < 2 or v_participant_count > 16 then
    raise exception 'Jumlah peserta aktif harus 2 sampai 16 tim';
  end if;

  v_bracket_size := public.flexible_bracket_size(v_participant_count);
  v_bye_count := v_bracket_size - v_participant_count;
  v_required_wins := public.required_wins_for_best_of(p_best_of);

  select round into v_first_round
  from public.flexible_match_definitions(v_bracket_size)
  order by round_index
  limit 1;

  v_slot_count := jsonb_array_length(p_slots);
  if v_slot_count <> v_bracket_size then
    raise exception 'Draw must contain exactly % slots', v_bracket_size;
  end if;

  with parsed_slots as (
    select
      ordinality::integer as pos,
      case
        when jsonb_typeof(value) = 'object' then coalesce(value->>'type', 'empty')
        when jsonb_typeof(value) = 'string' and value #>> '{}' = '__BYE__' then 'bye'
        when jsonb_typeof(value) = 'string' and nullif(value #>> '{}', '') is not null then 'team'
        else 'empty'
      end as slot_type,
      case
        when jsonb_typeof(value) = 'object' and coalesce(value->>'type', '') = 'team' then value->>'teamId'
        when jsonb_typeof(value) = 'string' and value #>> '{}' <> '__BYE__' then nullif(value #>> '{}', '')
        else null
      end as team_id
    from jsonb_array_elements(p_slots) with ordinality as slot(value, ordinality)
  )
  select
    count(*) filter (where slot_type = 'team'),
    count(*) filter (where slot_type = 'bye'),
    count(distinct team_id) filter (where slot_type = 'team'),
    count(t.id) filter (where slot_type = 'team')
  into v_team_slot_count, v_bye_slot_count, v_unique_team_count, v_valid_team_count
  from parsed_slots ps
  left join public.teams t
    on t.id = ps.team_id
   and t.tournament_id = p_tournament_id
   and t.is_active = true
   and t.is_participant = true
   and t.dropped = false;

  if v_team_slot_count <> v_participant_count then
    raise exception 'Jumlah slot team harus %', v_participant_count;
  end if;
  if v_bye_slot_count <> v_bye_count then
    raise exception 'Jumlah BYE harus %', v_bye_count;
  end if;
  if v_unique_team_count <> v_participant_count or v_valid_team_count <> v_participant_count then
    raise exception 'Draw slots must contain unique valid active participants';
  end if;

  update public.teams
  set is_participant = id = any(coalesce(p_participant_team_ids, array[]::text[])),
      dropped = case when id = any(coalesce(p_participant_team_ids, array[]::text[])) then false else dropped end,
      updated_at = now()
  where tournament_id = p_tournament_id;

  update public.tournaments
  set format = 'flexible_single_elimination',
      best_of = p_best_of,
      required_wins = v_required_wins,
      series_type = 'BO' || p_best_of::text,
      participant_count = v_participant_count,
      bracket_size = v_bracket_size,
      bye_count = v_bye_count,
      total_teams = v_participant_count,
      total_matches = v_participant_count - 1,
      updated_at = now()
  where id = p_tournament_id;

  with old_matches as materialized (
    select *
    from public.bracket_matches
    where tournament_id = p_tournament_id
  ),
  deleted as (
    delete from public.bracket_matches
    where tournament_id = p_tournament_id
    returning 1
  ),
  parsed_slots as (
    select
      ordinality::integer as pos,
      case
        when jsonb_typeof(value) = 'object' then coalesce(value->>'type', 'empty')
        when jsonb_typeof(value) = 'string' and value #>> '{}' = '__BYE__' then 'bye'
        when jsonb_typeof(value) = 'string' and nullif(value #>> '{}', '') is not null then 'team'
        else 'empty'
      end as slot_type,
      case
        when jsonb_typeof(value) = 'object' and coalesce(value->>'type', '') = 'team' then value->>'teamId'
        when jsonb_typeof(value) = 'string' and value #>> '{}' <> '__BYE__' then nullif(value #>> '{}', '')
        else null
      end as team_id,
      case
        when jsonb_typeof(value) = 'object' and nullif(value->>'seedNo', '') is not null then (value->>'seedNo')::integer
        else ordinality::integer
      end as seed_no
    from jsonb_array_elements(p_slots) with ordinality as slot(value, ordinality)
  ),
  match_slots as (
    select
      ((pos - 1) / 2 + 1)::integer as order_no,
      max(team_id) filter (where pos % 2 = 1) as team_a_id,
      max(team_id) filter (where pos % 2 = 0) as team_b_id,
      max(seed_no) filter (where pos % 2 = 1) as team_a_seed,
      max(seed_no) filter (where pos % 2 = 0) as team_b_seed,
      max(slot_type) filter (where pos % 2 = 1) as slot_a_type,
      max(slot_type) filter (where pos % 2 = 0) as slot_b_type
    from parsed_slots
    group by ((pos - 1) / 2 + 1)
  )
  insert into public.bracket_matches (
    id,
    tournament_id,
    round,
    round_label,
    round_index,
    order_no,
    match_no,
    label,
    best_of,
    required_wins,
    team_a_id,
    team_b_id,
    team_a_seed,
    team_b_seed,
    score_a,
    score_b,
    winner_team_id,
    loser_team_id,
    status,
    match_date,
    match_time,
    venue,
    stage,
    stream_link,
    next_match_id,
    next_slot,
    source_match_a,
    source_match_b,
    locked,
    metadata,
    slot_a_type,
    slot_b_type,
    team_a_is_bye,
    team_b_is_bye,
    auto_advanced,
    playable,
    bracket_size,
    participant_count,
    bye_reason
  )
  select
    d.id,
    p_tournament_id,
    d.round,
    d.round_label,
    d.round_index,
    d.order_no,
    d.match_no,
    d.label,
    p_best_of,
    v_required_wins,
    case when d.round = v_first_round and ms.slot_a_type = 'team' then ms.team_a_id else null end,
    case when d.round = v_first_round and ms.slot_b_type = 'team' then ms.team_b_id else null end,
    case when d.round = v_first_round then ms.team_a_seed else null end,
    case when d.round = v_first_round then ms.team_b_seed else null end,
    0,
    0,
    case
      when d.round = v_first_round and ms.slot_a_type = 'team' and ms.slot_b_type = 'bye' then ms.team_a_id
      when d.round = v_first_round and ms.slot_b_type = 'team' and ms.slot_a_type = 'bye' then ms.team_b_id
      else null
    end,
    null,
    case
      when d.round = v_first_round and ms.slot_a_type = 'team' and ms.slot_b_type = 'team' then 'upcoming'
      when d.round = v_first_round and (
        (ms.slot_a_type = 'team' and ms.slot_b_type = 'bye')
        or (ms.slot_b_type = 'team' and ms.slot_a_type = 'bye')
      ) then 'completed'
      else 'empty'
    end,
    case when p_keep_schedule then old.match_date else null end,
    case when p_keep_schedule then old.match_time else null end,
    case when p_keep_schedule then old.venue else null end,
    case when p_keep_schedule then old.stage else null end,
    case when p_keep_schedule then old.stream_link else null end,
    d.next_match_id,
    d.next_slot,
    d.source_match_a,
    d.source_match_b,
    false,
    coalesce(old.metadata, '{}'::jsonb)
      || jsonb_build_object(
        'drawMode', p_mode,
        'byeMode', p_bye_mode,
        'schemaVersion', 3,
        'drawMetadata', coalesce(p_draw_metadata, '{}'::jsonb)
      ),
    case when d.round = v_first_round then coalesce(ms.slot_a_type, 'empty') else 'empty' end,
    case when d.round = v_first_round then coalesce(ms.slot_b_type, 'empty') else 'empty' end,
    d.round = v_first_round and coalesce(ms.slot_a_type, 'empty') = 'bye',
    d.round = v_first_round and coalesce(ms.slot_b_type, 'empty') = 'bye',
    d.round = v_first_round and (
      (ms.slot_a_type = 'team' and ms.slot_b_type = 'bye')
      or (ms.slot_b_type = 'team' and ms.slot_a_type = 'bye')
    ),
    d.round = v_first_round and ms.slot_a_type = 'team' and ms.slot_b_type = 'team',
    v_bracket_size,
    v_participant_count,
    case
      when d.round = v_first_round and (
        (ms.slot_a_type = 'team' and ms.slot_b_type = 'bye')
        or (ms.slot_b_type = 'team' and ms.slot_a_type = 'bye')
      ) then 'BYE from incomplete bracket'
      when d.round = v_first_round and ms.slot_a_type = 'bye' and ms.slot_b_type = 'bye' then 'BYE vs BYE hidden match'
      else ''
    end
  from public.flexible_match_definitions(v_bracket_size) d
  cross join (select count(*) from deleted) deleted_count
  left join match_slots ms
    on ms.order_no = d.order_no
   and d.round = v_first_round
  left join old_matches old
    on old.id = d.id
  order by d.match_no;

  perform public.apply_bye_auto_advance(p_tournament_id);

  insert into public.draw_events(tournament_id, actor_id, mode, best_of, draw_payload, applied)
  values (
    p_tournament_id,
    auth.uid(),
    case when p_mode = 'spin' then 'spin' when p_mode = 'seeded' then 'seeded' else 'manual' end,
    p_best_of,
    jsonb_build_object(
      'slots', p_slots,
      'participantTeamIds', p_participant_team_ids,
      'byeMode', p_bye_mode,
      'metadata', coalesce(p_draw_metadata, '{}'::jsonb)
    ),
    true
  );

  insert into public.audit_logs(actor_id, action, entity, entity_id, after_data)
  values (
    auth.uid(),
    case when p_mode = 'spin' then 'apply_flexible_spin_draw' else 'apply_flexible_manual_draw' end,
    'tournaments',
    p_tournament_id::text,
    jsonb_build_object(
      'best_of', p_best_of,
      'participant_count', v_participant_count,
      'bracket_size', v_bracket_size,
      'bye_count', v_bye_count,
      'mode', p_mode
    )
  );

  return query
  select * from public.bracket_for_tournament(p_tournament_id);
end;
$$;

create or replace function public.apply_flexible_manual_draw(
  p_tournament_id uuid,
  p_best_of integer,
  p_participant_team_ids text[],
  p_slots jsonb,
  p_bye_mode text default 'manual',
  p_keep_schedule boolean default true
)
returns setof public.bracket_matches
language sql
security definer
set search_path = public
as $$
  select * from public.apply_flexible_bracket_draw(
    p_tournament_id,
    p_best_of,
    p_participant_team_ids,
    p_slots,
    'manual',
    coalesce(p_bye_mode, 'manual'),
    '{}'::jsonb,
    p_keep_schedule
  );
$$;

create or replace function public.apply_flexible_spin_draw(
  p_tournament_id uuid,
  p_best_of integer,
  p_participant_team_ids text[],
  p_slots jsonb,
  p_bye_mode text default 'random',
  p_draw_metadata jsonb default '{}'::jsonb,
  p_keep_schedule boolean default true
)
returns setof public.bracket_matches
language sql
security definer
set search_path = public
as $$
  select * from public.apply_flexible_bracket_draw(
    p_tournament_id,
    p_best_of,
    p_participant_team_ids,
    p_slots,
    'spin',
    coalesce(p_bye_mode, 'random'),
    coalesce(p_draw_metadata, '{}'::jsonb),
    p_keep_schedule
  );
$$;

create or replace function public.update_tournament_participants(
  p_tournament_id uuid,
  p_team_ids text[]
)
returns setof public.bracket_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_count integer;
  v_bracket_size integer;
begin
  perform public.assert_admin();

  select count(distinct id)
  into v_participant_count
  from unnest(coalesce(p_team_ids, array[]::text[])) participant(id)
  join public.teams t
    on t.id = participant.id
   and t.tournament_id = p_tournament_id
   and t.is_active = true;

  if v_participant_count < 2 or v_participant_count > 16 then
    raise exception 'Jumlah peserta aktif harus 2 sampai 16 tim';
  end if;

  v_bracket_size := public.flexible_bracket_size(v_participant_count);

  update public.teams
  set is_participant = id = any(p_team_ids),
      dropped = case when id = any(p_team_ids) then false else dropped end,
      updated_at = now()
  where tournament_id = p_tournament_id;

  update public.tournaments
  set format = 'flexible_single_elimination',
      participant_count = v_participant_count,
      bracket_size = v_bracket_size,
      bye_count = v_bracket_size - v_participant_count,
      total_teams = v_participant_count,
      total_matches = v_participant_count - 1,
      updated_at = now()
  where id = p_tournament_id;

  insert into public.audit_logs(actor_id, action, entity, entity_id, after_data)
  values (
    auth.uid(),
    'update_tournament_participants',
    'tournaments',
    p_tournament_id::text,
    jsonb_build_object('participantTeamIds', p_team_ids, 'participantCount', v_participant_count)
  );

  return query
  select * from public.bracket_for_tournament(p_tournament_id);
end;
$$;

create or replace function public.generate_flexible_bracket(
  p_tournament_id uuid,
  p_best_of integer,
  p_participant_team_ids text[] default null,
  p_bye_mode text default 'seeded'
)
returns setof public.bracket_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_ids text[];
  v_participant_count integer;
  v_bracket_size integer;
  v_slots jsonb;
begin
  perform public.assert_admin();
  perform public.assert_valid_best_of(p_best_of);

  if p_participant_team_ids is null or array_length(p_participant_team_ids, 1) is null then
    select array_agg(id order by seed_no nulls last, sort_order, code)
    into v_team_ids
    from public.teams
    where tournament_id = p_tournament_id
      and is_active = true
      and is_participant = true
      and dropped = false;
  else
    v_team_ids := p_participant_team_ids;
  end if;

  select count(distinct id)
  into v_participant_count
  from unnest(coalesce(v_team_ids, array[]::text[])) participant(id)
  join public.teams t
    on t.id = participant.id
   and t.tournament_id = p_tournament_id
   and t.is_active = true
   and t.dropped = false;

  if v_participant_count < 2 or v_participant_count > 16 then
    raise exception 'Jumlah peserta aktif harus 2 sampai 16 tim';
  end if;

  v_bracket_size := public.flexible_bracket_size(v_participant_count);

  if coalesce(p_bye_mode, 'seeded') = 'random' then
    with slot_source as (
      select t.id as value, row_number() over (order by random()) as rn
      from unnest(v_team_ids) participant(id)
      join public.teams t
        on t.id = participant.id
       and t.tournament_id = p_tournament_id
      union all
      select '__BYE__' as value, v_participant_count + ordinality::integer as rn
      from generate_series(1, v_bracket_size - v_participant_count) with ordinality
    )
    select jsonb_agg(value order by random())
    into v_slots
    from slot_source;
  else
    with seeded as (
      select
        t.id,
        row_number() over (order by t.seed_no nulls last, t.sort_order, t.code) as seed_no
      from unnest(v_team_ids) participant(id)
      join public.teams t
        on t.id = participant.id
       and t.tournament_id = p_tournament_id
      order by t.seed_no nulls last, t.sort_order, t.code
    ),
    slots_by_seed as (
      select
        seed_order.seed_no,
        coalesce(seeded.id, '__BYE__') as value
      from generate_series(1, v_bracket_size) seed_order(seed_no)
      left join seeded using (seed_no)
    )
    select jsonb_agg(slots_by_seed.value order by seed_order.pos)
    into v_slots
    from public.flexible_seed_order(v_bracket_size) seed_order
    join slots_by_seed using (seed_no);
  end if;

  return query
  select * from public.apply_flexible_bracket_draw(
    p_tournament_id,
    p_best_of,
    v_team_ids,
    v_slots,
    'seeded',
    coalesce(p_bye_mode, 'seeded'),
    '{}'::jsonb,
    true
  );
end;
$$;

create or replace function public.reset_bracket_results(p_tournament_id uuid)
returns setof public.bracket_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first_round_index integer;
begin
  perform public.assert_admin();

  select min(round_index)
  into v_first_round_index
  from public.bracket_matches
  where tournament_id = p_tournament_id;

  update public.bracket_matches
  set score_a = 0,
      score_b = 0,
      winner_team_id = null,
      loser_team_id = null,
      team_a_id = case when round_index = v_first_round_index then team_a_id else null end,
      team_b_id = case when round_index = v_first_round_index then team_b_id else null end,
      team_a_seed = case when round_index = v_first_round_index then team_a_seed else null end,
      team_b_seed = case when round_index = v_first_round_index then team_b_seed else null end,
      slot_a_type = case when round_index = v_first_round_index then slot_a_type else 'empty' end,
      slot_b_type = case when round_index = v_first_round_index then slot_b_type else 'empty' end,
      team_a_is_bye = case when round_index = v_first_round_index then team_a_is_bye else false end,
      team_b_is_bye = case when round_index = v_first_round_index then team_b_is_bye else false end,
      auto_advanced = false,
      playable = false,
      status = 'empty',
      updated_at = now()
  where tournament_id = p_tournament_id;

  update public.bracket_matches
  set status = case
        when (team_a_id is not null and team_b_is_bye)
          or (team_b_id is not null and team_a_is_bye)
        then 'completed'
        when team_a_id is not null and team_b_id is not null then 'upcoming'
        else 'empty'
      end,
      auto_advanced = (
        (team_a_id is not null and team_b_is_bye)
        or (team_b_id is not null and team_a_is_bye)
      ),
      playable = team_a_id is not null
        and team_b_id is not null
        and team_a_is_bye = false
        and team_b_is_bye = false,
      winner_team_id = case
        when team_a_id is not null and team_b_is_bye then team_a_id
        when team_b_id is not null and team_a_is_bye then team_b_id
        else null
      end,
      bye_reason = case
        when (team_a_id is not null and team_b_is_bye)
          or (team_b_id is not null and team_a_is_bye)
        then 'BYE from incomplete bracket'
        else ''
      end,
      updated_at = now()
  where tournament_id = p_tournament_id
    and round_index = v_first_round_index;

  perform public.apply_bye_auto_advance(p_tournament_id);

  insert into public.audit_logs(actor_id, action, entity, entity_id, after_data)
  values (auth.uid(), 'reset_bracket_results', 'tournaments', p_tournament_id::text, '{}'::jsonb);

  return query
  select * from public.bracket_for_tournament(p_tournament_id);
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
begin
  perform public.assert_admin();
  perform public.assert_valid_best_of(p_best_of);
  v_required_wins := public.required_wins_for_best_of(p_best_of);

  select count(*)
  into v_completed_count
  from public.bracket_matches
  where tournament_id = p_tournament_id
    and status = 'completed'
    and auto_advanced = false;

  if not p_reset_results and v_completed_count > 0 then
    raise exception 'Cannot change series format without reset after completed matches exist';
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
      match_date = case when p_keep_schedule then match_date else null end,
      match_time = case when p_keep_schedule then match_time else null end,
      venue = case when p_keep_schedule then venue else null end,
      stage = case when p_keep_schedule then stage else null end,
      stream_link = case when p_keep_schedule then stream_link else null end,
      updated_at = now()
  where tournament_id = p_tournament_id;

  if p_reset_results then
    return query
    select * from public.reset_bracket_results(p_tournament_id);
    return;
  end if;

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

grant execute on function public.flexible_bracket_size(integer) to authenticated;
grant execute on function public.flexible_seed_order(integer) to authenticated;
grant execute on function public.flexible_match_definitions(integer) to authenticated;
grant execute on function public.apply_bye_auto_advance(uuid) to authenticated;
grant execute on function public.update_tournament_participants(uuid, text[]) to authenticated;
grant execute on function public.generate_flexible_bracket(uuid, integer, text[], text) to authenticated;
grant execute on function public.apply_flexible_manual_draw(uuid, integer, text[], jsonb, text, boolean) to authenticated;
grant execute on function public.apply_flexible_spin_draw(uuid, integer, text[], jsonb, text, jsonb, boolean) to authenticated;
