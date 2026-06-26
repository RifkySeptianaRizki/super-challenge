import { create } from "zustand";
import { defaultTournamentData } from "../data/defaultData";
import {
  CACHE_KEYS,
  STORAGE_KEYS,
  clearCachedTournamentData,
  loadCachedTournamentData,
  readLegacyLocalStorageSnapshot,
  saveCachedTournamentData,
  setStorageItem,
} from "../lib/storage";
import {
  createInitialBracketFromStandings,
  createInitialBracketFromTeams,
  createRandomDrawSlots,
  createTournamentConfig,
  recalculateBracket,
  resetBracketResults as resetBracketResultsEngine,
  updateMatchResult,
  validateDrawSlots as validateDrawSlotsEngine,
} from "../lib/bracketEngine";
import {
  SETTINGS_KEYS,
  applyManualBracketDraw,
  applySpinBracketDraw,
  clearMatchResult,
  exportSupabaseData,
  generateBracketFromSeeds as generateBracketFromSeedsApi,
  getAdminTournamentData,
  getPublicTournamentData,
  importLegacyData,
  resetBracketResults as resetBracketResultsApi,
  seedListToBracketSlots,
  setMatchResult,
  updateMatchMeta,
  updateSiteSetting,
  updateTeam,
  deleteTeam as deleteTeamApi,
  updateTournamentSeriesFormat as updateTournamentSeriesFormatApi,
  upsertTeam,
} from "../services/tournamentApi";

const initialData = loadCachedTournamentData() || defaultTournamentData;

const sliceTournamentState = (state) => ({
  tournament: state.tournament || null,
  tournamentConfig: state.tournamentConfig,
  siteConfig: state.siteConfig,
  teams: state.teams,
  matches: state.matches,
  weeks: state.weeks,
  standings: state.standings,
  countdown: state.countdown,
  grandFinals: state.grandFinals,
  broadcast: state.broadcast,
  sponsors: state.sponsors,
  settings: state.settings,
  bracket: state.bracket,
  siteSettings: state.siteSettings || {},
  auditLogs: state.auditLogs || [],
  lastSyncedAt: state.lastSyncedAt || null,
});

const withDefaultState = (data = {}) => ({
  tournament: data.tournament || null,
  tournamentConfig: createTournamentConfig(data.tournamentConfig || defaultTournamentData.tournamentConfig),
  siteConfig: data.siteConfig || defaultTournamentData.siteConfig,
  teams: data.teams || defaultTournamentData.teams,
  matches: data.matches || defaultTournamentData.matches,
  weeks: data.weeks || defaultTournamentData.weeks,
  standings: data.standings || defaultTournamentData.standings,
  countdown: data.countdown || defaultTournamentData.countdown,
  grandFinals: data.grandFinals || defaultTournamentData.grandFinals,
  broadcast: data.broadcast || defaultTournamentData.broadcast,
  sponsors: data.sponsors || defaultTournamentData.sponsors,
  settings: data.settings || defaultTournamentData.settings,
  bracket: data.bracket || defaultTournamentData.bracket,
  siteSettings: data.siteSettings || {},
  auditLogs: data.auditLogs || [],
  lastSyncedAt: data.lastSyncedAt || null,
});

const syncCache = (data) => {
  saveCachedTournamentData(sliceTournamentState(data));
};

const hasCompletedResults = (bracket) => (
  Array.isArray(bracket) && bracket.some((match) => match.status === "completed")
);

const getTournamentId = (state) => state.tournament?.id || state.tournamentConfig?.id;

const normalizeSeedNo = (value, fallback) => {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 16) return parsed;
  return fallback;
};

const useTournamentStore = create((set, get) => ({
  ...withDefaultState(initialData),
  loading: false,
  saving: false,
  error: null,
  isOnlineMode: true,
  cacheStatus: initialData?.cacheUpdatedAt ? "cache" : "default",
  drawMode: "manual",
  manualDrawSlots: [],
  spinDrawPreview: null,
  adminOpen: false,

  saveCache: () => {
    const snapshot = sliceTournamentState(get());
    syncCache(snapshot);
    set({ cacheStatus: "fresh" });
    return snapshot;
  },

  loadCache: () => {
    const cached = loadCachedTournamentData();
    if (!cached) return null;
    set({ ...withDefaultState(cached), cacheStatus: "cache" });
    return cached;
  },

  clearCache: () => {
    clearCachedTournamentData();
    set({ cacheStatus: "cleared" });
  },

  hydrateFromSupabase: async () => {
    const cached = loadCachedTournamentData();
    if (cached) {
      set({ ...withDefaultState(cached), loading: true, cacheStatus: "cache" });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const data = await getPublicTournamentData();
      const next = { ...withDefaultState(data), loading: false, error: null, isOnlineMode: true, cacheStatus: "fresh" };
      set(next);
      syncCache(next);
      return next;
    } catch (error) {
      const fallback = cached || defaultTournamentData;
      const next = {
        ...withDefaultState(fallback),
        loading: false,
        error: error.message || "Gagal mengambil data Supabase.",
        isOnlineMode: false,
        cacheStatus: cached ? "cache" : "default",
      };
      set(next);
      return next;
    }
  },

  refreshTournamentData: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getPublicTournamentData();
      const next = { ...withDefaultState(data), loading: false, error: null, isOnlineMode: true, cacheStatus: "fresh" };
      set(next);
      syncCache(next);
      return next;
    } catch (error) {
      set({ loading: false, error: error.message || "Gagal refresh data Supabase.", isOnlineMode: false });
      throw error;
    }
  },

  refreshAdminData: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getAdminTournamentData();
      const next = { ...withDefaultState(data), loading: false, error: null, isOnlineMode: true, cacheStatus: "fresh" };
      set(next);
      syncCache(next);
      return next;
    } catch (error) {
      set({ loading: false, error: error.message || "Gagal mengambil data admin.", isOnlineMode: false });
      throw error;
    }
  },

  loadData: () => get().hydrateFromSupabase(),

  updateSiteConfig: async (payload) => {
    set({ saving: true, error: null });
    try {
      await updateSiteSetting(SETTINGS_KEYS.siteConfig, payload);
      set({ siteConfig: payload, saving: false });
      get().saveCache();
    } catch (error) {
      set({ saving: false, error: error.message });
      throw error;
    }
  },

  updateTeams: async (payload) => {
    const state = get();
    const tournamentId = getTournamentId(state);
    if (!tournamentId) throw new Error("Tournament aktif tidak ditemukan.");
    set({ saving: true, error: null });
    try {
      await Promise.all(payload.map((team, index) => {
        const seedNo = normalizeSeedNo(team.seedNo ?? team.seed_no ?? team.rank, index + 1);
        const sortOrder = normalizeSeedNo(team.sortOrder ?? team.sort_order ?? seedNo, seedNo);
        return upsertTeam({ ...team, seedNo, sortOrder, rank: seedNo }, tournamentId);
      }));
      await get().refreshAdminData();
    } catch (error) {
      set({ saving: false, error: error.message });
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  upsertTeam: async (team) => {
    const state = get();
    const tournamentId = getTournamentId(state);
    if (!tournamentId) throw new Error("Tournament aktif tidak ditemukan.");
    set({ saving: true, error: null });
    try {
      await upsertTeam(team, tournamentId);
      await get().refreshAdminData();
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  addTeam: async (team) => get().upsertTeam(team),

  updateTeam: async (teamId, payload) => {
    set({ saving: true, error: null });
    try {
      await updateTeam(teamId, payload);
      await get().refreshAdminData();
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  deleteTeam: async (teamId) => {
    set({ saving: true, error: null });
    try {
      if (get().isOnlineMode) {
        await deleteTeamApi(teamId);
        await get().refreshAdminData();
      } else {
        // Offline mode: just filter the teams and save to cache
        const newTeams = get().teams.filter(t => t.id !== teamId);
        set({ teams: newTeams });
        get().saveCache();
      }
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  updateMatches: async (payload) => {
    await updateSiteSetting(SETTINGS_KEYS.matches, payload);
    set({ matches: payload });
    get().saveCache();
  },

  updateWeeks: async (payload) => {
    await updateSiteSetting(SETTINGS_KEYS.weeks, payload);
    set({ weeks: payload });
    get().saveCache();
  },

  updateStandings: async (payload) => {
    await updateSiteSetting(SETTINGS_KEYS.standings, payload);
    set({ standings: payload });
    get().saveCache();
  },

  updateCountdown: async (payload) => {
    await updateSiteSetting(SETTINGS_KEYS.countdown, payload);
    set({ countdown: payload });
    get().saveCache();
  },

  updateGrandFinals: async (payload) => {
    await updateSiteSetting(SETTINGS_KEYS.grandFinals, payload);
    set({ grandFinals: payload });
    get().saveCache();
  },

  updateBroadcast: async (payload) => {
    await updateSiteSetting(SETTINGS_KEYS.broadcast, payload);
    set({ broadcast: payload });
    get().saveCache();
  },

  updateSponsors: async (payload) => {
    await updateSiteSetting(SETTINGS_KEYS.sponsors, payload);
    set({ sponsors: payload });
    get().saveCache();
  },

  updateSettings: async (payload) => {
    await updateSiteSetting(SETTINGS_KEYS.settings, payload);
    set({ settings: payload });
    get().saveCache();
  },

  updateBracket: (payload) => {
    const bracket = recalculateBracket(payload);
    set({ bracket });
    get().saveCache();
    return bracket;
  },

  initializeBracketFromTeams: async () => {
    const state = get();
    const bracket = createInitialBracketFromTeams(state.teams, state.tournamentConfig.bestOf);
    const slots = bracket
      .filter((match) => match.round === "R16")
      .flatMap((match) => [match.teamAId, match.teamBId]);
    return get().applyManualDraw(slots, state.tournamentConfig.bestOf, { keepSchedule: true });
  },

  initializeBracketFromStandings: async () => {
    const state = get();
    const bracket = createInitialBracketFromStandings(state.standings, state.teams, state.tournamentConfig.bestOf);
    const slots = bracket
      .filter((match) => match.round === "R16")
      .flatMap((match) => [match.teamAId, match.teamBId]);
    return get().applyManualDraw(slots, state.tournamentConfig.bestOf, { keepSchedule: true });
  },

  updateBracketMatchScore: async (matchId, scoreA, scoreB) => {
    set({ saving: true, error: null });
    try {
      const bracket = await setMatchResult(matchId, scoreA, scoreB);
      set({ bracket, saving: false });
      await get().refreshTournamentData();
      return get().bracket;
    } catch (error) {
      set({ saving: false, error: error.message });
      throw error;
    }
  },

  setBracketMatchResult: (...args) => get().updateBracketMatchScore(...args),

  clearBracketMatchResult: async (matchId) => {
    set({ saving: true, error: null });
    try {
      const bracket = await clearMatchResult(matchId);
      set({ bracket, saving: false });
      await get().refreshTournamentData();
      return get().bracket;
    } catch (error) {
      set({ saving: false, error: error.message });
      throw error;
    }
  },

  updateBracketMatchMeta: async (matchId, payload) => {
    set({ saving: true, error: null });
    try {
      const bracket = await updateMatchMeta(matchId, payload);
      set({ bracket, saving: false });
      await get().refreshTournamentData();
      return get().bracket;
    } catch (error) {
      set({ saving: false, error: error.message });
      throw error;
    }
  },

  updateMatchSchedule: (...args) => get().updateBracketMatchMeta(...args),

  resetBracketResults: async () => {
    const tournamentId = getTournamentId(get());
    if (!tournamentId) throw new Error("Tournament aktif tidak ditemukan.");
    set({ saving: true, error: null });
    try {
      const bracket = await resetBracketResultsApi(tournamentId);
      set({ bracket, saving: false });
      await get().refreshTournamentData();
      return get().bracket;
    } catch (error) {
      set({ saving: false, error: error.message });
      throw error;
    }
  },

  resetBracketAll: async () => {
    return get().initializeBracketFromTeams();
  },

  setBracketSeeds: async (seeds) => {
    const seedTeamIds = Array(16).fill("");
    seeds.forEach((seed) => {
      const seedNo = Number(seed.seedNo);
      if (seedNo >= 1 && seedNo <= 16) seedTeamIds[seedNo - 1] = seed.teamId;
    });
    const slots = seedListToBracketSlots(seedTeamIds);
    return get().applyManualDraw(slots, get().tournamentConfig.bestOf, { keepSchedule: true });
  },

  generateBracketFromSeeds: async () => {
    const tournamentId = getTournamentId(get());
    if (!tournamentId) throw new Error("Tournament aktif tidak ditemukan.");
    set({ saving: true, error: null });
    try {
      const bracket = await generateBracketFromSeedsApi(tournamentId);
      set({ bracket, saving: false });
      await get().refreshAdminData();
      return get().bracket;
    } catch (error) {
      set({ saving: false, error: error.message });
      throw error;
    }
  },

  updateTournamentSeriesFormat: async (bestOf, options = {}) => {
    const tournamentId = getTournamentId(get());
    if (!tournamentId) throw new Error("Tournament aktif tidak ditemukan.");
    set({ saving: true, error: null });
    try {
      await updateTournamentSeriesFormatApi(tournamentId, bestOf, options);
      await get().refreshAdminData();
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  setDrawMode: (drawMode) => set({ drawMode }),

  setManualDrawSlots: (manualDrawSlots) => set({ manualDrawSlots }),

  validateDrawSlots: (slots = get().manualDrawSlots) => (
    validateDrawSlotsEngine(slots, get().teams)
  ),

  previewSpinDraw: () => {
    const slots = createRandomDrawSlots(get().teams);
    const preview = {
      slots,
      createdAt: new Date().toISOString(),
      drawSeed: typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),
    };
    set({ spinDrawPreview: preview });
    return preview;
  },

  shuffleSpinDraw: () => get().previewSpinDraw(),

  clearDrawPreview: () => set({ spinDrawPreview: null }),

  applyManualDraw: async (slots, bestOf, options = {}) => {
    const state = get();
    const tournamentId = getTournamentId(state);
    if (!tournamentId) throw new Error("Tournament aktif tidak ditemukan.");
    const validation = validateDrawSlotsEngine(slots, state.teams);
    if (!validation.valid) throw new Error(validation.errors.join(" "));
    set({ saving: true, error: null });
    try {
      const bracket = await applyManualBracketDraw(tournamentId, bestOf, validation.slots, options);
      set({ bracket, manualDrawSlots: validation.slots, saving: false });
      await get().refreshAdminData();
      return get().bracket;
    } catch (error) {
      set({ saving: false, error: error.message });
      throw error;
    }
  },

  applySpinDraw: async (slots, bestOf, metadata = {}, options = {}) => {
    const state = get();
    const tournamentId = getTournamentId(state);
    if (!tournamentId) throw new Error("Tournament aktif tidak ditemukan.");
    const validation = validateDrawSlotsEngine(slots, state.teams);
    if (!validation.valid) throw new Error(validation.errors.join(" "));
    set({ saving: true, error: null });
    try {
      const bracket = await applySpinBracketDraw(tournamentId, bestOf, validation.slots, metadata, options);
      set({ bracket, spinDrawPreview: null, saving: false });
      await get().refreshAdminData();
      return get().bracket;
    } catch (error) {
      set({ saving: false, error: error.message });
      throw error;
    }
  },

  importLegacyLocalStorage: async () => {
    const snapshot = readLegacyLocalStorageSnapshot();
    const data = await importLegacyData(snapshot);
    set({ ...withDefaultState(data), cacheStatus: "fresh" });
    syncCache(get());
    return data;
  },

  exportData: async () => {
    try {
      return await exportSupabaseData();
    } catch {
      return sliceTournamentState(get());
    }
  },

  importData: async (payload) => {
    const data = await importLegacyData(payload);
    set({ ...withDefaultState(data), cacheStatus: "fresh" });
    syncCache(get());
    return data;
  },

  restoreBackup: async (payload) => {
    if (!payload) throw new Error("Pilih file backup Supabase JSON untuk restore.");
    return get().importData(payload);
  },

  resetData: async () => {
    const data = await importLegacyData(defaultTournamentData);
    set({ ...withDefaultState(data), cacheStatus: "fresh" });
    syncCache(get());
    return data;
  },

  getLocalPreviewBracket: (matchId, scoreA, scoreB) => (
    updateMatchResult(get().bracket, matchId, scoreA, scoreB)
  ),

  getLocalResetBracket: () => resetBracketResultsEngine(get().bracket),

  toggleAdmin: () => set((s) => ({ adminOpen: !s.adminOpen })),
  setAdminOpen: (val) => set({ adminOpen: val }),

  setLegacyStorageItem: (key, payload) => {
    setStorageItem(STORAGE_KEYS[key], payload);
  },

  cacheKeys: CACHE_KEYS,
  hasCompletedResults: () => hasCompletedResults(get().bracket),
}));

export default useTournamentStore;
