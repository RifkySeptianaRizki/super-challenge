import { create } from "zustand";
import {
  loadTournamentData,
  saveTournamentData,
  resetTournamentData,
  importTournamentData,
  restoreBackup as restoreTournamentBackup,
  STORAGE_KEYS,
  setStorageItem,
} from "../lib/storage";
import {
  createInitialBracketFromSeeds,
  createInitialBracketFromStandings,
  createInitialBracketFromTeams,
  createTournamentConfig,
  recalculateBracket,
  resetBracketResults as resetBracketResultsEngine,
  updateMatchResult,
} from "../lib/bracketEngine";

const withUpdatedConfig = (state, patch = {}) => ({
  ...patch,
  tournamentConfig: {
    ...createTournamentConfig(state.tournamentConfig || {}),
    updatedAt: new Date().toISOString(),
  },
});

const persistAll = (statePatch) => {
  saveTournamentData(statePatch);
};

const useTournamentStore = create((set, get) => ({
  tournamentConfig: createTournamentConfig(),
  siteConfig: {},
  teams: [],
  matches: [],
  weeks: [],
  standings: [],
  countdown: {},
  grandFinals: {},
  broadcast: {},
  sponsors: [],
  settings: {},
  bracket: [],
  adminOpen: false,

  loadData: () => {
    const data = loadTournamentData();
    set(data);
  },

  updateSiteConfig: (payload) => {
    const patch = withUpdatedConfig(get(), { siteConfig: payload });
    set(patch);
    persistAll(patch);
  },

  updateTeams: (payload) => {
    const patch = withUpdatedConfig(get(), { teams: payload });
    set(patch);
    persistAll(patch);
  },

  updateMatches: (payload) => {
    const patch = withUpdatedConfig(get(), { matches: payload });
    set(patch);
    persistAll(patch);
  },

  updateWeeks: (payload) => {
    const patch = withUpdatedConfig(get(), { weeks: payload });
    set(patch);
    persistAll(patch);
  },

  updateStandings: (payload) => {
    const patch = withUpdatedConfig(get(), { standings: payload });
    set(patch);
    persistAll(patch);
  },

  updateCountdown: (payload) => {
    const patch = withUpdatedConfig(get(), { countdown: payload });
    set(patch);
    persistAll(patch);
  },

  updateGrandFinals: (payload) => {
    const patch = withUpdatedConfig(get(), { grandFinals: payload });
    set(patch);
    persistAll(patch);
  },

  updateBroadcast: (payload) => {
    const patch = withUpdatedConfig(get(), { broadcast: payload });
    set(patch);
    persistAll(patch);
  },

  updateSponsors: (payload) => {
    const patch = withUpdatedConfig(get(), { sponsors: payload });
    set(patch);
    persistAll(patch);
  },

  updateSettings: (payload) => {
    const patch = withUpdatedConfig(get(), { settings: payload });
    set(patch);
    persistAll(patch);
  },

  updateBracket: (payload) => {
    const bracket = recalculateBracket(payload);
    const patch = withUpdatedConfig(get(), { bracket });
    set(patch);
    persistAll(patch);
    return bracket;
  },

  initializeBracketFromTeams: () => {
    const state = get();
    const bracket = createInitialBracketFromTeams(state.teams);
    const patch = withUpdatedConfig(state, { bracket });
    set(patch);
    persistAll(patch);
    return bracket;
  },

  initializeBracketFromStandings: () => {
    const state = get();
    const bracket = createInitialBracketFromStandings(state.standings, state.teams);
    const patch = withUpdatedConfig(state, { bracket });
    set(patch);
    persistAll(patch);
    return bracket;
  },

  updateBracketMatchScore: (matchId, scoreA, scoreB) => {
    const state = get();
    const bracket = updateMatchResult(state.bracket, matchId, scoreA, scoreB);
    const patch = withUpdatedConfig(state, { bracket });
    set(patch);
    persistAll(patch);
    return bracket;
  },

  updateBracketMatchMeta: (matchId, payload) => {
    const state = get();
    const bracket = recalculateBracket(state.bracket.map((match) => (
      match.id === matchId
        ? {
            ...match,
            date: payload.date ?? match.date,
            time: payload.time ?? match.time,
            locked: payload.locked ?? match.locked,
            updatedAt: new Date().toISOString(),
          }
        : match
    )));
    const patch = withUpdatedConfig(state, { bracket });
    set(patch);
    persistAll(patch);
    return bracket;
  },

  resetBracketResults: () => {
    const state = get();
    const bracket = resetBracketResultsEngine(state.bracket);
    const patch = withUpdatedConfig(state, { bracket });
    set(patch);
    persistAll(patch);
    return bracket;
  },

  resetBracketAll: () => {
    const state = get();
    const bracket = createInitialBracketFromTeams(state.teams);
    const patch = withUpdatedConfig(state, { bracket });
    set(patch);
    persistAll(patch);
    return bracket;
  },

  setBracketSeeds: (seeds) => {
    const state = get();
    const bracket = createInitialBracketFromSeeds(seeds);
    const patch = withUpdatedConfig(state, { bracket });
    set(patch);
    persistAll(patch);
    return bracket;
  },

  resetData: () => {
    const data = resetTournamentData();
    set(data);
    return data;
  },

  exportData: () => {
    const state = get();
    return {
      schemaVersion: 2,
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
      exportedAt: new Date().toISOString(),
    };
  },

  importData: (payload) => {
    const data = importTournamentData(payload);
    set(data);
    return data;
  },

  restoreBackup: () => {
    const data = restoreTournamentBackup();
    set(data);
    return data;
  },

  toggleAdmin: () => set((s) => ({ adminOpen: !s.adminOpen })),
  setAdminOpen: (val) => set({ adminOpen: val }),

  setLegacyStorageItem: (key, payload) => {
    setStorageItem(STORAGE_KEYS[key], payload);
  },
}));

export default useTournamentStore;
