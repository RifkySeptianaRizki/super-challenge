import { defaultTournamentData } from "../data/defaultData";
import {
  BRACKET_SCHEMA_VERSION,
  createInitialBracketFromTeams,
  createTournamentConfig,
  migrateLegacyBracket,
  recalculateBracket,
  sanitizeTeamCode,
  sanitizeText,
  validateBracketSchema,
} from "./bracketEngine";

const BACKUP_KEY = "superchallenge_backup_last_valid";

const STORAGE_KEYS = {
  tournamentConfig: "superchallenge_tournament_config",
  siteConfig: "superchallenge_site_config",
  teams: "superchallenge_teams",
  matches: "superchallenge_matches",
  weeks: "superchallenge_weeks",
  standings: "superchallenge_standings",
  countdown: "superchallenge_countdown",
  grandFinals: "superchallenge_grand_finals",
  broadcast: "superchallenge_broadcast",
  sponsors: "superchallenge_sponsors",
  settings: "superchallenge_settings",
  bracket: "superchallenge_bracket",
};

const isPlainObject = (value) => (
  value !== null && typeof value === "object" && !Array.isArray(value)
);

const hasStorage = () => typeof localStorage !== "undefined";

const cloneDefault = (value) => JSON.parse(JSON.stringify(value));

const safeString = (value, maxLength = 500) => Array.from(String(value ?? ""))
  .filter((char) => {
    const code = char.charCodeAt(0);
    return code >= 32 && code !== 127;
  })
  .join("")
  .replace(/[<>]/g, "")
  .trim()
  .slice(0, maxLength);

const sanitizeDeep = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (isPlainObject(value)) {
    return Object.entries(value).reduce((acc, [key, item]) => {
      if (typeof item === "function" || typeof item === "symbol") return acc;
      acc[safeString(key, 80)] = sanitizeDeep(item);
      return acc;
    }, {});
  }
  if (typeof value === "string") return safeString(value);
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "boolean" || value === null) return value;
  return null;
};

const sanitizeTeam = (team, index) => {
  const fallback = defaultTournamentData.teams[index] || {};
  const code = sanitizeTeamCode(team?.code || fallback.code || `TEAM${index + 1}`);
  return {
    ...fallback,
    ...sanitizeDeep(team),
    id: safeString(team?.id || fallback.id || code.toLowerCase(), 40),
    code,
    name: sanitizeText(team?.name || fallback.name || code, 60),
    fullName: sanitizeText(team?.fullName || team?.name || fallback.fullName || code, 80),
    rank: Number.isInteger(Number(team?.rank)) ? Number(team.rank) : index + 1,
    logo: safeString(team?.logo || fallback.logo || `/assets/teams/${code.toLowerCase()}.png`, 160),
    color: safeString(team?.color || fallback.color || "#F22738", 20),
    record: safeString(team?.record || fallback.record || "0 - 0", 20),
  };
};

const sanitizeTeams = (teams) => {
  const source = Array.isArray(teams) && teams.length ? teams : defaultTournamentData.teams;
  return source.slice(0, 16).map(sanitizeTeam);
};

const sanitizeStandings = (standings, teams) => {
  const source = Array.isArray(standings) && standings.length
    ? standings
    : defaultTournamentData.standings;
  return source.slice(0, 16).map((row, index) => {
    const fallbackTeam = teams[index] || {};
    const teamCode = sanitizeTeamCode(row?.teamCode || fallbackTeam.code);
    const matchPoint = Number.isFinite(Number(row?.matchPoint)) ? Number(row.matchPoint) : 0;
    const netGameWin = Number.isFinite(Number(row?.netGameWin)) ? Number(row.netGameWin) : 0;
    return {
      ...sanitizeDeep(row),
      rank: index + 1,
      teamCode,
      team: sanitizeText(row?.team || fallbackTeam.name || teamCode, 60),
      matchPoint,
      matchWL: safeString(row?.matchWL || "0 - 0", 20),
      netGameWin,
      gameWL: safeString(row?.gameWL || "0 - 0", 20),
      eliminated: Boolean(row?.eliminated),
    };
  });
};

const sanitizeSchedule = (matches) => {
  if (!Array.isArray(matches)) return cloneDefault(defaultTournamentData.matches);
  return matches.map((day, dayIndex) => ({
    id: safeString(day?.id || `schedule-day-${dayIndex + 1}`, 60),
    week: Number.isFinite(Number(day?.week)) ? Number(day.week) : dayIndex + 1,
    date: safeString(day?.date || "TBA", 80),
    stage: safeString(day?.stage || "Regular Season", 80),
    games: Array.isArray(day?.games)
      ? day.games.map((game, gameIndex) => ({
          id: safeString(game?.id || `match-${dayIndex + 1}-${gameIndex + 1}`, 60),
          time: safeString(game?.time || "TBA", 20),
          teamA: sanitizeTeamCode(game?.teamA || game?.team1?.code || "TBA") || "TBA",
          teamB: sanitizeTeamCode(game?.teamB || game?.team2?.code || "TBA") || "TBA",
          scoreA: Number.isInteger(Number(game?.scoreA)) ? Number(game.scoreA) : 0,
          scoreB: Number.isInteger(Number(game?.scoreB)) ? Number(game.scoreB) : 0,
          status: ["upcoming", "live", "finished", "completed"].includes(game?.status)
            ? game.status
            : "upcoming",
          detailUrl: safeString(game?.detailUrl || "#", 160),
          replayUrl: safeString(game?.replayUrl || "#", 160),
        }))
      : [],
  }));
};

export function safeParseJSON(value, fallback = null) {
  try {
    if (typeof value !== "string") return { ok: false, value: fallback, error: "Value is not a JSON string." };
    return { ok: true, value: JSON.parse(value), error: null };
  } catch (error) {
    return { ok: false, value: fallback, error: error.message };
  }
}

export function getStorageItem(key, fallback) {
  try {
    if (!hasStorage()) return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = safeParseJSON(raw, fallback);
    return parsed.ok ? parsed.value : fallback;
  } catch (error) {
    console.error(`Failed to read localStorage key: ${key}`, error);
    return fallback;
  }
}

export function setStorageItem(key, value) {
  try {
    if (!hasStorage()) return false;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to write localStorage key: ${key}`, error);
    return false;
  }
}

export function removeStorageItem(key) {
  try {
    if (!hasStorage()) return false;
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove localStorage key: ${key}`, error);
    return false;
  }
}

export function clearTournamentStorage() {
  Object.values(STORAGE_KEYS).forEach((key) => removeStorageItem(key));
}

export function migrateLegacyData(data = {}) {
  const source = isPlainObject(data) ? data : {};
  const teams = sanitizeTeams(source.teams);
  const standings = sanitizeStandings(source.standings, teams);
  const bracketValidation = validateBracketSchema(source.bracket);
  const bracket = bracketValidation.valid
    ? recalculateBracket(bracketValidation.value)
    : migrateLegacyBracket(source.bracket, teams);
  const timestamp = new Date().toISOString();
  const sourceConfig = isPlainObject(source.tournamentConfig) ? source.tournamentConfig : {};

  return {
    tournamentConfig: {
      ...createTournamentConfig(sourceConfig),
      schemaVersion: BRACKET_SCHEMA_VERSION,
      updatedAt: timestamp,
    },
    siteConfig: {
      ...cloneDefault(defaultTournamentData.siteConfig),
      ...sanitizeDeep(source.siteConfig),
    },
    teams,
    matches: sanitizeSchedule(source.matches),
    weeks: Array.isArray(source.weeks) ? sanitizeDeep(source.weeks) : cloneDefault(defaultTournamentData.weeks),
    standings,
    countdown: isPlainObject(source.countdown) ? sanitizeDeep(source.countdown) : cloneDefault(defaultTournamentData.countdown),
    grandFinals: isPlainObject(source.grandFinals) ? sanitizeDeep(source.grandFinals) : cloneDefault(defaultTournamentData.grandFinals),
    broadcast: isPlainObject(source.broadcast) ? sanitizeDeep(source.broadcast) : cloneDefault(defaultTournamentData.broadcast),
    sponsors: Array.isArray(source.sponsors) ? sanitizeDeep(source.sponsors) : cloneDefault(defaultTournamentData.sponsors),
    settings: {
      ...cloneDefault(defaultTournamentData.settings),
      ...sanitizeDeep(source.settings),
    },
    bracket: bracket?.length ? bracket : createInitialBracketFromTeams(teams),
  };
}

export function validateImportedData(payload) {
  const parsed = typeof payload === "string" ? safeParseJSON(payload) : { ok: true, value: payload, error: null };
  if (!parsed.ok) {
    return { valid: false, error: `JSON tidak valid: ${parsed.error}`, data: null };
  }
  if (!isPlainObject(parsed.value)) {
    return { valid: false, error: "Import harus berupa object JSON.", data: null };
  }

  const importedVersion = Number(
    parsed.value.tournamentConfig?.schemaVersion
    ?? parsed.value.schemaVersion
    ?? 1
  );
  if (Number.isFinite(importedVersion) && importedVersion > BRACKET_SCHEMA_VERSION) {
    return { valid: false, error: "Schema version import lebih baru dari aplikasi ini.", data: null };
  }

  const incomingBracketValidation = validateBracketSchema(parsed.value.bracket);
  const legacyBracket = Array.isArray(parsed.value.bracket)
    && parsed.value.bracket.some((match) => /^M[1-8]$/.test(match?.id || ""));
  if (parsed.value.bracket && !incomingBracketValidation.valid && !legacyBracket && importedVersion >= BRACKET_SCHEMA_VERSION) {
    return {
      valid: false,
      error: incomingBracketValidation.errors.join(" ") || "Bracket schema tidak valid.",
      data: null,
    };
  }

  const migrated = migrateLegacyData(parsed.value);
  const bracketValidation = validateBracketSchema(migrated.bracket);
  if (!bracketValidation.valid) {
    return {
      valid: false,
      error: bracketValidation.errors.join(" "),
      data: null,
    };
  }

  return {
    valid: true,
    error: null,
    data: {
      ...migrated,
      bracket: bracketValidation.value,
      tournamentConfig: {
        ...migrated.tournamentConfig,
        schemaVersion: BRACKET_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

export function seedDefaultData() {
  Object.entries(STORAGE_KEYS).forEach(([dataKey, storageKey]) => {
    if (!hasStorage()) return;
    const current = localStorage.getItem(storageKey);
    if (!current && defaultTournamentData[dataKey]) {
      setStorageItem(storageKey, defaultTournamentData[dataKey]);
    }
  });
}

export function loadTournamentData() {
  seedDefaultData();

  const rawData = {
    tournamentConfig: getStorageItem(
      STORAGE_KEYS.tournamentConfig,
      defaultTournamentData.tournamentConfig
    ),
    siteConfig: getStorageItem(
      STORAGE_KEYS.siteConfig,
      defaultTournamentData.siteConfig
    ),
    teams: getStorageItem(STORAGE_KEYS.teams, defaultTournamentData.teams),
    matches: getStorageItem(
      STORAGE_KEYS.matches,
      defaultTournamentData.matches
    ),
    weeks: getStorageItem(STORAGE_KEYS.weeks, defaultTournamentData.weeks),
    standings: getStorageItem(
      STORAGE_KEYS.standings,
      defaultTournamentData.standings
    ),
    countdown: getStorageItem(
      STORAGE_KEYS.countdown,
      defaultTournamentData.countdown
    ),
    grandFinals: getStorageItem(
      STORAGE_KEYS.grandFinals,
      defaultTournamentData.grandFinals
    ),
    broadcast: getStorageItem(
      STORAGE_KEYS.broadcast,
      defaultTournamentData.broadcast
    ),
    sponsors: getStorageItem(
      STORAGE_KEYS.sponsors,
      defaultTournamentData.sponsors
    ),
    settings: getStorageItem(
      STORAGE_KEYS.settings,
      defaultTournamentData.settings
    ),
    bracket: getStorageItem(
      STORAGE_KEYS.bracket,
      defaultTournamentData.bracket
    ),
  };

  return migrateLegacyData(rawData);
}

export function createBackup() {
  const snapshot = {
    ...loadTournamentData(),
    backupCreatedAt: new Date().toISOString(),
  };
  setStorageItem(BACKUP_KEY, snapshot);
  return snapshot;
}

export function restoreBackup() {
  const backup = getStorageItem(BACKUP_KEY, null);
  if (!backup) {
    throw new Error("Backup terakhir tidak ditemukan.");
  }
  const validation = validateImportedData(backup);
  if (!validation.valid) {
    throw new Error(validation.error || "Backup tidak valid.");
  }
  saveTournamentData(validation.data);
  return loadTournamentData();
}

export function saveTournamentData(data) {
  if (!isPlainObject(data)) return false;
  const timestamp = new Date().toISOString();
  const sourceConfig = isPlainObject(data.tournamentConfig) ? data.tournamentConfig : {};
  const payload = {
    ...data,
    tournamentConfig: {
      ...createTournamentConfig(sourceConfig),
      updatedAt: timestamp,
    },
  };

  if (payload.tournamentConfig)
    setStorageItem(STORAGE_KEYS.tournamentConfig, payload.tournamentConfig);
  if (payload.siteConfig)
    setStorageItem(STORAGE_KEYS.siteConfig, payload.siteConfig);
  if (payload.teams) setStorageItem(STORAGE_KEYS.teams, payload.teams);
  if (payload.matches) setStorageItem(STORAGE_KEYS.matches, payload.matches);
  if (payload.weeks) setStorageItem(STORAGE_KEYS.weeks, payload.weeks);
  if (payload.standings) setStorageItem(STORAGE_KEYS.standings, payload.standings);
  if (payload.countdown) setStorageItem(STORAGE_KEYS.countdown, payload.countdown);
  if (payload.grandFinals)
    setStorageItem(STORAGE_KEYS.grandFinals, payload.grandFinals);
  if (payload.broadcast) setStorageItem(STORAGE_KEYS.broadcast, payload.broadcast);
  if (payload.sponsors) setStorageItem(STORAGE_KEYS.sponsors, payload.sponsors);
  if (payload.settings) setStorageItem(STORAGE_KEYS.settings, payload.settings);
  if (payload.bracket) setStorageItem(STORAGE_KEYS.bracket, payload.bracket);
  return true;
}

export function resetTournamentData() {
  createBackup();
  clearTournamentStorage();
  seedDefaultData();
  return loadTournamentData();
}

export function exportTournamentData() {
  return loadTournamentData();
}

export function importTournamentData(jsonData) {
  const validation = validateImportedData(jsonData);
  if (!validation.valid) {
    throw new Error(validation.error || "Import data tidak valid.");
  }
  createBackup();
  saveTournamentData(validation.data);
  return loadTournamentData();
}

export { BACKUP_KEY, STORAGE_KEYS };
