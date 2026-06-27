import { defaultTournamentData } from "../data/defaultData";
import { getSupabaseClient } from "../lib/supabaseClient";
import {
  BYE_SLOT,
  SEED_PAIRINGS,
  createInitialBracketFromTeams,
  createTournamentConfig,
  getRoundStructure,
  recalculateBracket,
  sanitizeTeamCode,
  sanitizeText,
} from "../lib/bracketEngine";
import { validateImportedData } from "../lib/storage";
import { sanitizeImageUrl } from "../lib/imageUtils";

const SETTINGS_KEYS = {
  siteConfig: "site_config",
  matches: "matches",
  weeks: "weeks",
  standings: "standings",
  countdown: "countdown",
  grandFinals: "grand_finals",
  broadcast: "broadcast",
  sponsors: "sponsors",
  settings: "settings",
};

const safeArray = (value, fallback) => (Array.isArray(value) ? value : fallback);

function requireClient() {
  return getSupabaseClient();
}

function throwIfError(error, fallbackMessage) {
  if (error) throw new Error(error.message || fallbackMessage);
}

function toTimeString(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

export function normalizeTournament(row) {
  if (!row) return createTournamentConfig(defaultTournamentData.tournamentConfig);
  return createTournamentConfig({
    id: row.id,
    slug: row.slug,
    name: row.name,
    season: row.season,
    format: row.format,
    seriesType: row.series_type,
    bestOf: row.best_of,
    requiredWins: row.required_wins,
    totalTeams: row.total_teams,
    totalMatches: row.total_matches,
    participantCount: row.participant_count ?? row.total_teams,
    participant_count: row.participant_count ?? row.total_teams,
    bracketSize: row.bracket_size ?? row.total_teams,
    bracket_size: row.bracket_size ?? row.total_teams,
    byeCount: row.bye_count ?? 0,
    bye_count: row.bye_count ?? 0,
    maxTeams: row.max_teams ?? 16,
    max_teams: row.max_teams ?? 16,
    minTeams: row.min_teams ?? 2,
    min_teams: row.min_teams ?? 2,
    status: row.status,
    timezone: row.timezone,
    isActive: row.is_active,
    updatedAt: row.updated_at,
  });
}

export function normalizeTeamFromDb(row) {
  if (!row) return null;
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  const logoUrl = sanitizeImageUrl(row.logo_url, { allowRelativeAssets: true }) || "";
  const shortName = sanitizeText(row.short_name || row.name, 80);
  const seedNo = row.seed_no ?? row.sort_order ?? 0;
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    tournament_id: row.tournament_id,
    code: sanitizeTeamCode(row.code),
    name: sanitizeText(row.name, 60),
    shortName,
    short_name: shortName,
    fullName: shortName,
    rank: seedNo,
    seedNo: row.seed_no,
    seed_no: row.seed_no,
    logoUrl,
    logo_url: logoUrl,
    logo: logoUrl,
    image: logoUrl,
    logoKey: row.logo_key || "",
    logo_key: row.logo_key || "",
    city: row.city || "",
    color: metadata.color || "#F22738",
    record: metadata.record || "0 - 0",
    isActive: row.is_active !== false,
    isParticipant: row.is_participant !== false,
    is_participant: row.is_participant !== false,
    checkedIn: row.checked_in !== false,
    checked_in: row.checked_in !== false,
    dropped: Boolean(row.dropped),
    sortOrder: row.sort_order ?? 0,
    metadata,
    updatedAt: row.updated_at,
  };
}

export const normalizeTeam = normalizeTeamFromDb;

export function normalizeMatch(row) {
  if (!row) return null;
  return {
    id: row.id,
    round: row.round,
    roundLabel: row.round_label,
    roundIndex: row.round_index,
    order: row.order_no,
    matchNo: row.match_no,
    label: row.label,
    bestOf: row.best_of,
    requiredWins: row.required_wins,
    teamAId: row.team_a_id,
    teamBId: row.team_b_id,
    teamASeed: row.team_a_seed,
    teamBSeed: row.team_b_seed,
    slotAType: row.slot_a_type || (row.team_a_is_bye ? "bye" : row.team_a_id ? "team" : "empty"),
    slotBType: row.slot_b_type || (row.team_b_is_bye ? "bye" : row.team_b_id ? "team" : "empty"),
    teamAIsBye: Boolean(row.team_a_is_bye),
    teamBIsBye: Boolean(row.team_b_is_bye),
    autoAdvanced: Boolean(row.auto_advanced),
    playable: row.playable !== false,
    bracketSize: row.bracket_size ?? 16,
    participantCount: row.participant_count ?? 16,
    byeReason: row.bye_reason || "",
    scoreA: row.score_a ?? 0,
    scoreB: row.score_b ?? 0,
    winnerTeamId: row.winner_team_id,
    loserTeamId: row.loser_team_id,
    status: row.status,
    date: row.match_date || "",
    time: toTimeString(row.match_time),
    venue: row.venue || "",
    stage: row.stage || "",
    streamLink: row.stream_link || "",
    nextMatchId: row.next_match_id,
    nextSlot: row.next_slot,
    sourceMatchA: row.source_match_a,
    sourceMatchB: row.source_match_b,
    locked: Boolean(row.locked),
    metadata: row.metadata || {},
    updatedAt: row.updated_at,
  };
}

function normalizeSettings(rows = []) {
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

function composeTournamentData({ tournament, teams, bracket, settingsRows, auditLogs = [] }) {
  const siteSettings = normalizeSettings(settingsRows);
  const normalizedTeams = safeArray(teams, []).map(normalizeTeamFromDb).filter(Boolean);
  const normalizedBracket = safeArray(bracket, []).map(normalizeMatch).filter(Boolean);
  const finalTeams = normalizedTeams.length ? normalizedTeams : defaultTournamentData.teams;

  return {
    tournament: tournament || null,
    tournamentConfig: normalizeTournament(tournament),
    siteConfig: {
      ...defaultTournamentData.siteConfig,
      ...(siteSettings[SETTINGS_KEYS.siteConfig] || siteSettings.homepage_settings || {}),
    },
    teams: finalTeams,
    matches: siteSettings[SETTINGS_KEYS.matches] || defaultTournamentData.matches,
    weeks: siteSettings[SETTINGS_KEYS.weeks] || defaultTournamentData.weeks,
    standings: siteSettings[SETTINGS_KEYS.standings] || defaultTournamentData.standings,
    countdown: siteSettings[SETTINGS_KEYS.countdown] || defaultTournamentData.countdown,
    grandFinals: siteSettings[SETTINGS_KEYS.grandFinals] || defaultTournamentData.grandFinals,
    broadcast: siteSettings[SETTINGS_KEYS.broadcast] || defaultTournamentData.broadcast,
    sponsors: siteSettings[SETTINGS_KEYS.sponsors] || defaultTournamentData.sponsors,
    settings: {
      ...defaultTournamentData.settings,
      ...(siteSettings[SETTINGS_KEYS.settings] || {}),
    },
    siteSettings,
    bracket: normalizedBracket.length
      ? recalculateBracket(normalizedBracket, { bracketSize: tournament?.bracket_size, participantCount: tournament?.participant_count })
      : createInitialBracketFromTeams(finalTeams),
    auditLogs,
    lastSyncedAt: new Date().toISOString(),
  };
}

export async function getActiveTournament() {
  const client = requireClient();
  const { data, error } = await client
    .from("tournaments")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  throwIfError(error, "Gagal mengambil tournament aktif.");
  return data;
}

export async function getTeams(tournamentId) {
  const client = requireClient();
  const { data, error } = await client
    .from("teams")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("seed_no", { ascending: true });
  throwIfError(error, "Gagal mengambil teams.");
  return data || [];
}

export async function getBracketMatches(tournamentId) {
  const client = requireClient();
  const { data, error } = await client
    .from("bracket_matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("round_index", { ascending: true })
    .order("order_no", { ascending: true });
  throwIfError(error, "Gagal mengambil bracket.");
  return data || [];
}

export async function getSiteSettings() {
  const client = requireClient();
  const { data, error } = await client
    .from("site_settings")
    .select("key,value,updated_at");
  throwIfError(error, "Gagal mengambil site settings.");
  return data || [];
}

export async function getAuditLogs() {
  const client = requireClient();
  const { data, error } = await client
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  throwIfError(error, "Gagal mengambil audit logs.");
  return data || [];
}

export async function getPublicTournamentData() {
  const tournament = await getActiveTournament();
  if (!tournament) {
    return composeTournamentData({
      tournament: null,
      teams: defaultTournamentData.teams,
      bracket: defaultTournamentData.bracket,
      settingsRows: [],
    });
  }

  const [teams, bracket, settingsRows] = await Promise.all([
    getTeams(tournament.id),
    getBracketMatches(tournament.id),
    getSiteSettings(),
  ]);

  return composeTournamentData({ tournament, teams, bracket, settingsRows });
}

export async function getAdminTournamentData() {
  const tournament = await getActiveTournament();
  if (!tournament) return getPublicTournamentData();

  const [teams, bracket, settingsRows, auditLogs] = await Promise.all([
    getTeams(tournament.id),
    getBracketMatches(tournament.id),
    getSiteSettings(),
    getAuditLogs(),
  ]);

  return composeTournamentData({ tournament, teams, bracket, settingsRows, auditLogs });
}

export function mapTeamToDbPayload(team, tournamentId) {
  const seedNo = Number.isInteger(Number(team.seedNo ?? team.seed_no ?? team.rank))
    ? Number(team.seedNo ?? team.seed_no ?? team.rank)
    : null;
  const sortOrder = Number.isInteger(Number(team.sortOrder ?? team.sort_order ?? seedNo))
    ? Number(team.sortOrder ?? team.sort_order ?? seedNo)
    : 0;
  const logoSource = team.logoUrl ?? team.logo_url ?? team.logo ?? team.image ?? team.avatar ?? team.icon;
  const logoUrl = sanitizeImageUrl(logoSource, { allowRelativeAssets: true });
  const shortName = sanitizeText(
    team.shortName || team.short_name || team.fullName || team.name || team.code,
    80
  );

  return {
    id: team.id,
    tournament_id: tournamentId,
    code: sanitizeTeamCode(team.code),
    name: sanitizeText(team.name || team.fullName || team.code, 60),
    short_name: shortName,
    logo_url: logoUrl,
    logo_key: team.logoKey || team.logo_key || null,
    city: team.city || null,
    seed_no: seedNo,
    sort_order: sortOrder,
    is_active: team.isActive !== false,
    is_participant: team.isParticipant ?? team.is_participant ?? true,
    checked_in: team.checkedIn ?? team.checked_in ?? true,
    dropped: Boolean(team.dropped),
    metadata: {
      ...(team.metadata || {}),
      color: team.color || team.metadata?.color || "#F22738",
      record: team.record || team.metadata?.record || "0 - 0",
    },
  };
}

const toDbTeam = mapTeamToDbPayload;

export async function upsertTeam(team, tournamentId) {
  const client = requireClient();
  const { data, error } = await client
    .from("teams")
    .upsert(toDbTeam(team, tournamentId), { onConflict: "id" })
    .select()
    .single();
  throwIfError(error, "Gagal menyimpan team.");
  return normalizeTeamFromDb(data);
}

export async function updateTeam(teamId, payload) {
  const client = requireClient();
  const tournament = await getActiveTournament();
  if (!tournament) throw new Error("Tournament aktif tidak ditemukan.");

  const { data: existing, error: existingError } = await client
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();
  throwIfError(existingError, "Team tidak ditemukan.");

  const dbPayload = toDbTeam({ ...normalizeTeamFromDb(existing), ...payload, id: teamId }, tournament.id);
  delete dbPayload.id;
  delete dbPayload.tournament_id;

  const { data, error } = await client
    .from("teams")
    .update(dbPayload)
    .eq("id", teamId)
    .select()
    .single();
  throwIfError(error, "Gagal update team.");
  return normalizeTeamFromDb(data);
}

export async function deleteTeam(teamId) {
  const client = requireClient();
  const { error } = await client
    .from("teams")
    .update({ is_active: false })
    .eq("id", teamId);
  throwIfError(error, "Gagal menonaktifkan team.");
}

export async function updateSiteSetting(key, value) {
  const client = requireClient();
  const { data, error } = await client
    .from("site_settings")
    .upsert({ key, value }, { onConflict: "key" })
    .select()
    .single();
  throwIfError(error, "Gagal menyimpan setting.");
  return data;
}

async function rpcBracket(functionName, args) {
  const client = requireClient();
  const { data, error } = await client.rpc(functionName, args);
  throwIfError(error, `RPC ${functionName} gagal.`);
  if (Array.isArray(data)) return recalculateBracket(data.map(normalizeMatch));
  const tournament = await getActiveTournament();
  return getBracketMatches(tournament.id).then((rows) => recalculateBracket(rows.map(normalizeMatch)));
}

export async function updateMatchMeta(matchId, payload) {
  return rpcBracket("update_match_schedule", {
    p_match_id: matchId,
    p_match_date: payload.date || null,
    p_match_time: payload.time || null,
    p_venue: payload.venue || null,
    p_stage: payload.stage || null,
    p_stream_link: payload.streamLink || payload.stream_link || null,
  });
}

export async function setMatchResult(matchId, scoreA, scoreB) {
  return rpcBracket("set_match_result", {
    p_match_id: matchId,
    p_score_a: Number(scoreA),
    p_score_b: Number(scoreB),
  });
}

export async function clearMatchResult(matchId) {
  return rpcBracket("clear_match_result", { p_match_id: matchId });
}

export async function resetBracketResults(tournamentId) {
  return rpcBracket("reset_bracket_results", { p_tournament_id: tournamentId });
}

export async function generateBracketFromSeeds(tournamentId) {
  return rpcBracket("generate_bracket_from_seeds", { p_tournament_id: tournamentId });
}

export async function updateTournamentParticipants(tournamentId, teamIds) {
  const client = requireClient();
  const { data, error } = await client.rpc("update_tournament_participants", {
    p_tournament_id: tournamentId,
    p_team_ids: teamIds,
  });
  throwIfError(error, "Gagal update participants.");
  if (Array.isArray(data)) return recalculateBracket(data.map(normalizeMatch));
  const tournament = await getActiveTournament();
  return getBracketMatches(tournament.id).then((rows) => recalculateBracket(rows.map(normalizeMatch)));
}

export async function generateFlexibleBracket(tournamentId, bestOf, participantTeamIds, byeMode = "seeded") {
  return rpcBracket("generate_flexible_bracket", {
    p_tournament_id: tournamentId,
    p_best_of: Number(bestOf),
    p_participant_team_ids: participantTeamIds,
    p_bye_mode: byeMode,
  });
}

export function seedListToBracketSlots(seedTeamIds) {
  return SEED_PAIRINGS.flatMap((pairing) => [
    seedTeamIds[pairing.seedA - 1],
    seedTeamIds[pairing.seedB - 1],
  ]);
}

export async function applyManualBracketDraw(tournamentId, bestOf, slots, options = {}) {
  if (options.flexible) {
    return rpcBracket("apply_flexible_manual_draw", {
      p_tournament_id: tournamentId,
      p_best_of: Number(bestOf),
      p_participant_team_ids: options.participantTeamIds || [],
      p_slots: slots,
      p_bye_mode: options.byeMode || "seeded",
      p_keep_schedule: options.keepSchedule !== false,
    });
  }
  return rpcBracket("apply_manual_bracket_draw", {
    p_tournament_id: tournamentId,
    p_best_of: Number(bestOf),
    p_slots: slots,
    p_keep_schedule: options.keepSchedule !== false,
  });
}

export async function applyFlexibleManualDraw(tournamentId, bestOf, participantTeamIds, slots, options = {}) {
  return rpcBracket("apply_flexible_manual_draw", {
    p_tournament_id: tournamentId,
    p_best_of: Number(bestOf),
    p_participant_team_ids: participantTeamIds,
    p_slots: slots,
    p_bye_mode: options.byeMode || "manual",
    p_keep_schedule: options.keepSchedule !== false,
  });
}

export async function applySpinBracketDraw(
  tournamentId,
  bestOf,
  slots,
  metadata = {},
  options = {}
) {
  if (options.flexible) {
    return rpcBracket("apply_flexible_spin_draw", {
      p_tournament_id: tournamentId,
      p_best_of: Number(bestOf),
      p_participant_team_ids: options.participantTeamIds || [],
      p_slots: slots,
      p_bye_mode: options.byeMode || "random",
      p_draw_metadata: metadata,
      p_keep_schedule: options.keepSchedule !== false,
    });
  }
  return rpcBracket("apply_spin_bracket_draw", {
    p_tournament_id: tournamentId,
    p_best_of: Number(bestOf),
    p_slots: slots,
    p_draw_metadata: metadata,
    p_keep_schedule: options.keepSchedule !== false,
  });
}

export async function applyFlexibleSpinDraw(
  tournamentId,
  bestOf,
  participantTeamIds,
  slots,
  metadata = {},
  options = {}
) {
  return rpcBracket("apply_flexible_spin_draw", {
    p_tournament_id: tournamentId,
    p_best_of: Number(bestOf),
    p_participant_team_ids: participantTeamIds,
    p_slots: slots,
    p_bye_mode: options.byeMode || "random",
    p_draw_metadata: metadata,
    p_keep_schedule: options.keepSchedule !== false,
  });
}

export async function updateTournamentSeriesFormat(tournamentId, bestOf, options = {}) {
  return rpcBracket("update_tournament_series_format", {
    p_tournament_id: tournamentId,
    p_best_of: Number(bestOf),
    p_reset_results: options.resetResults !== false,
    p_keep_schedule: options.keepSchedule !== false,
  });
}

export async function exportSupabaseData() {
  return getAdminTournamentData();
}

export async function importLegacyData(payload) {
  const validation = validateImportedData(payload);
  if (!validation.valid) {
    throw new Error(validation.error || "Import data tidak valid.");
  }

  const tournament = await getActiveTournament();
  if (!tournament) throw new Error("Tournament aktif tidak ditemukan di Supabase.");
  const data = validation.data;

  await Promise.all(
    data.teams.map((team, index) =>
      upsertTeam({ ...team, seedNo: index + 1, sortOrder: index + 1 }, tournament.id)
    )
  );

  await Promise.all([
    updateSiteSetting(SETTINGS_KEYS.siteConfig, data.siteConfig),
    updateSiteSetting(SETTINGS_KEYS.matches, data.matches),
    updateSiteSetting(SETTINGS_KEYS.weeks, data.weeks),
    updateSiteSetting(SETTINGS_KEYS.standings, data.standings),
    updateSiteSetting(SETTINGS_KEYS.countdown, data.countdown),
    updateSiteSetting(SETTINGS_KEYS.grandFinals, data.grandFinals),
    updateSiteSetting(SETTINGS_KEYS.broadcast, data.broadcast),
    updateSiteSetting(SETTINGS_KEYS.sponsors, data.sponsors),
    updateSiteSetting(SETTINGS_KEYS.settings, data.settings),
  ]);

  const activeParticipantIds = data.teams
    .filter((team) => team.isActive !== false && team.is_participant !== false && team.isParticipant !== false && team.dropped !== true)
    .map((team) => team.id);
  const config = createTournamentConfig({
    ...data.tournamentConfig,
    participantCount: activeParticipantIds.length >= 2 ? activeParticipantIds.length : data.tournamentConfig?.participantCount,
  });
  const firstRound = getRoundStructure(config.bracketSize)[0]?.round || "R16";
  const importedBracket = recalculateBracket(data.bracket, config);
  const firstRoundSlots = importedBracket
    .filter((match) => match.round === firstRound)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .flatMap((match) => [
      match.teamAIsBye || match.slotAType === "bye" ? BYE_SLOT : match.teamAId,
      match.teamBIsBye || match.slotBType === "bye" ? BYE_SLOT : match.teamBId,
    ]);

  await applyManualBracketDraw(
    tournament.id,
    config.bestOf || 3,
    firstRoundSlots,
    {
      flexible: true,
      participantTeamIds: activeParticipantIds,
      byeMode: "manual",
      keepSchedule: true,
    }
  );

  for (const match of data.bracket) {
    if (match.scoreA > 0 || match.scoreB > 0) {
      await setMatchResult(match.id, match.scoreA, match.scoreB);
    }
    if (match.date || match.time || match.venue || match.stage || match.streamLink) {
      await updateMatchMeta(match.id, match);
    }
  }

  const imported = await getAdminTournamentData();
  return {
    ...imported,
    importSummary: data.importSummary || null,
  };
}

export { SETTINGS_KEYS };
