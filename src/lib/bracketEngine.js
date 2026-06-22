export const BRACKET_SCHEMA_VERSION = 2;
export const BRACKET_FORMAT = "single_elimination_16";
export const SERIES_TYPE = "BO3";
export const BEST_OF = 3;
export const REQUIRED_WINS = 2;

export const ROUND_ORDER = ["R16", "QF", "SF", "GF"];

export const SEED_PAIRINGS = [
  { id: "R16-1", seedA: 1, seedB: 16, nextMatchId: "QF-1", nextSlot: "A" },
  { id: "R16-2", seedA: 8, seedB: 9, nextMatchId: "QF-1", nextSlot: "B" },
  { id: "R16-3", seedA: 4, seedB: 13, nextMatchId: "QF-2", nextSlot: "A" },
  { id: "R16-4", seedA: 5, seedB: 12, nextMatchId: "QF-2", nextSlot: "B" },
  { id: "R16-5", seedA: 2, seedB: 15, nextMatchId: "QF-3", nextSlot: "A" },
  { id: "R16-6", seedA: 7, seedB: 10, nextMatchId: "QF-3", nextSlot: "B" },
  { id: "R16-7", seedA: 3, seedB: 14, nextMatchId: "QF-4", nextSlot: "A" },
  { id: "R16-8", seedA: 6, seedB: 11, nextMatchId: "QF-4", nextSlot: "B" },
];

export const MATCH_DEFINITIONS = [
  ...SEED_PAIRINGS.map((match, index) => ({
    id: match.id,
    round: "R16",
    roundLabel: "Round of 16",
    roundIndex: 1,
    order: index + 1,
    matchNo: index + 1,
    label: `Match ${index + 1}`,
    teamASeed: match.seedA,
    teamBSeed: match.seedB,
    nextMatchId: match.nextMatchId,
    nextSlot: match.nextSlot,
    sourceMatchA: null,
    sourceMatchB: null,
  })),
  { id: "QF-1", round: "QF", roundLabel: "Quarter Final", roundIndex: 2, order: 1, matchNo: 9, label: "Match 9", nextMatchId: "SF-1", nextSlot: "A", sourceMatchA: "R16-1", sourceMatchB: "R16-2" },
  { id: "QF-2", round: "QF", roundLabel: "Quarter Final", roundIndex: 2, order: 2, matchNo: 10, label: "Match 10", nextMatchId: "SF-1", nextSlot: "B", sourceMatchA: "R16-3", sourceMatchB: "R16-4" },
  { id: "QF-3", round: "QF", roundLabel: "Quarter Final", roundIndex: 2, order: 3, matchNo: 11, label: "Match 11", nextMatchId: "SF-2", nextSlot: "A", sourceMatchA: "R16-5", sourceMatchB: "R16-6" },
  { id: "QF-4", round: "QF", roundLabel: "Quarter Final", roundIndex: 2, order: 4, matchNo: 12, label: "Match 12", nextMatchId: "SF-2", nextSlot: "B", sourceMatchA: "R16-7", sourceMatchB: "R16-8" },
  { id: "SF-1", round: "SF", roundLabel: "Semi Final", roundIndex: 3, order: 1, matchNo: 13, label: "Match 13", nextMatchId: "GF-1", nextSlot: "A", sourceMatchA: "QF-1", sourceMatchB: "QF-2" },
  { id: "SF-2", round: "SF", roundLabel: "Semi Final", roundIndex: 3, order: 2, matchNo: 14, label: "Match 14", nextMatchId: "GF-1", nextSlot: "B", sourceMatchA: "QF-3", sourceMatchB: "QF-4" },
  { id: "GF-1", round: "GF", roundLabel: "Grand Final", roundIndex: 4, order: 1, matchNo: 15, label: "Match 15", nextMatchId: null, nextSlot: null, sourceMatchA: "SF-1", sourceMatchB: "SF-2" },
];

const MATCH_DEFINITION_BY_ID = MATCH_DEFINITIONS.reduce((acc, match) => {
  acc[match.id] = match;
  return acc;
}, {});

const nowIso = () => new Date().toISOString();

const normalizeNumber = (value) => {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) return Number(value);
  return null;
};

const normalizeId = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const normalizeScore = (value) => {
  const score = normalizeNumber(value);
  return score !== null && score >= 0 && score <= REQUIRED_WINS ? score : 0;
};

const hasBothTeams = (match) => Boolean(match?.teamAId && match?.teamBId);

const makeBaseMatch = (definition, timestamp = nowIso()) => ({
  id: definition.id,
  round: definition.round,
  roundLabel: definition.roundLabel,
  roundIndex: definition.roundIndex,
  order: definition.order,
  matchNo: definition.matchNo,
  label: definition.label,
  bestOf: BEST_OF,
  requiredWins: REQUIRED_WINS,
  teamAId: null,
  teamBId: null,
  teamASeed: definition.teamASeed ?? null,
  teamBSeed: definition.teamBSeed ?? null,
  scoreA: 0,
  scoreB: 0,
  winnerTeamId: null,
  loserTeamId: null,
  status: "empty",
  date: "",
  time: "",
  nextMatchId: definition.nextMatchId,
  nextSlot: definition.nextSlot,
  sourceMatchA: definition.sourceMatchA,
  sourceMatchB: definition.sourceMatchB,
  locked: false,
  updatedAt: timestamp,
});

const getWinnerSlot = (scoreA, scoreB, requiredWins = REQUIRED_WINS) => {
  if (scoreA === requiredWins && scoreB < requiredWins) return "A";
  if (scoreB === requiredWins && scoreA < requiredWins) return "B";
  return null;
};

const scoreInputIsAllowed = (scoreA, scoreB) => {
  const a = normalizeNumber(scoreA);
  const b = normalizeNumber(scoreB);
  if (a === null || b === null) return false;
  if (a < 0 || b < 0 || a > REQUIRED_WINS || b > REQUIRED_WINS) return false;
  if (a === REQUIRED_WINS && b === REQUIRED_WINS) return false;
  return true;
};

const applyComputedResult = (match, timestamp = nowIso()) => {
  const status = getMatchStatus(match);
  const winnerSlot = status === "completed"
    ? getWinnerSlot(match.scoreA, match.scoreB, match.requiredWins)
    : null;

  return {
    ...match,
    status,
    winnerTeamId: winnerSlot === "A" ? match.teamAId : winnerSlot === "B" ? match.teamBId : null,
    loserTeamId: winnerSlot === "A" ? match.teamBId : winnerSlot === "B" ? match.teamAId : null,
    updatedAt: match.updatedAt || timestamp,
  };
};

const resetResultFields = (match, timestamp = nowIso()) => ({
  ...match,
  scoreA: 0,
  scoreB: 0,
  winnerTeamId: null,
  loserTeamId: null,
  status: hasBothTeams(match) ? "upcoming" : "empty",
  updatedAt: timestamp,
});

const seedToTeamMap = (seeds) => {
  const map = new Map();
  (Array.isArray(seeds) ? seeds : []).forEach((seed) => {
    const seedNo = normalizeNumber(seed?.seedNo);
    if (!seedNo || seedNo < 1 || seedNo > 16) return;
    map.set(seedNo, {
      seedNo,
      teamId: normalizeId(seed?.teamId),
      teamCode: sanitizeTeamCode(seed?.teamCode),
    });
  });
  return map;
};

const teamCodeMatches = (left, right) => (
  sanitizeTeamCode(left) && sanitizeTeamCode(left) === sanitizeTeamCode(right)
);

const getTeamIdFromStanding = (standing, teams) => {
  if (standing?.teamId) return normalizeId(standing.teamId);
  const team = teams.find((item) => (
    teamCodeMatches(item.code, standing?.teamCode)
    || teamCodeMatches(item.code, standing?.team)
    || sanitizeText(item.name, 80).toLowerCase() === sanitizeText(standing?.team, 80).toLowerCase()
  ));
  return normalizeId(team?.id) || normalizeId(standing?.teamCode);
};

const getTeamSeed = (match, slot) => (slot === "A" ? match.teamASeed : match.teamBSeed);

const sortBracket = (matches) => [...matches].sort((a, b) => {
  if (a.roundIndex !== b.roundIndex) return a.roundIndex - b.roundIndex;
  return a.order - b.order;
});

const normalizeBracketMatches = (matches) => {
  const sourceById = Array.isArray(matches)
    ? matches.reduce((acc, match) => {
        if (match?.id) acc[match.id] = match;
        return acc;
      }, {})
    : {};
  const timestamp = nowIso();

  return MATCH_DEFINITIONS.map((definition) => {
    const raw = sourceById[definition.id] || {};
    const base = makeBaseMatch(definition, timestamp);

    return {
      ...base,
      teamAId: normalizeId(raw.teamAId) ?? normalizeId(raw.teamA) ?? base.teamAId,
      teamBId: normalizeId(raw.teamBId) ?? normalizeId(raw.teamB) ?? base.teamBId,
      teamASeed: normalizeNumber(raw.teamASeed) ?? base.teamASeed,
      teamBSeed: normalizeNumber(raw.teamBSeed) ?? base.teamBSeed,
      scoreA: normalizeScore(raw.scoreA),
      scoreB: normalizeScore(raw.scoreB),
      date: sanitizeText(raw.date, 40),
      time: sanitizeText(raw.time, 20),
      locked: Boolean(raw.locked),
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : base.updatedAt,
    };
  });
};

const collectDependentIds = (matches, changedMatchId) => {
  const byId = matches.reduce((acc, match) => {
    acc[match.id] = match;
    return acc;
  }, {});
  const dependents = new Set();
  const visit = (matchId) => {
    const nextId = byId[matchId]?.nextMatchId;
    if (!nextId || dependents.has(nextId)) return;
    dependents.add(nextId);
    visit(nextId);
  };
  visit(changedMatchId);
  return dependents;
};

export function createTournamentConfig(overrides = {}) {
  const safeOverrides = overrides && typeof overrides === "object" && !Array.isArray(overrides)
    ? overrides
    : {};
  return {
    schemaVersion: BRACKET_SCHEMA_VERSION,
    format: BRACKET_FORMAT,
    seriesType: SERIES_TYPE,
    bestOf: BEST_OF,
    requiredWins: REQUIRED_WINS,
    totalTeams: 16,
    totalMatches: 15,
    updatedAt: nowIso(),
    ...safeOverrides,
  };
}

export function getRequiredWins(bestOf) {
  const parsed = normalizeNumber(bestOf);
  if (!parsed || parsed < 1) return REQUIRED_WINS;
  return Math.floor(parsed / 2) + 1;
}

export function isValidBO3Score(scoreA, scoreB) {
  const a = normalizeNumber(scoreA);
  const b = normalizeNumber(scoreB);
  if (a === null || b === null) return false;
  return (
    (a === REQUIRED_WINS && (b === 0 || b === 1))
    || (b === REQUIRED_WINS && (a === 0 || a === 1))
  );
}

export function getWinnerFromScore(scoreA, scoreB, requiredWins = REQUIRED_WINS) {
  const a = normalizeNumber(scoreA);
  const b = normalizeNumber(scoreB);
  if (a === null || b === null) return null;
  return getWinnerSlot(a, b, requiredWins);
}

export function getMatchStatus(match) {
  if (!hasBothTeams(match)) return "empty";
  const scoreA = normalizeNumber(match?.scoreA);
  const scoreB = normalizeNumber(match?.scoreB);
  if (scoreA === null || scoreB === null) return "upcoming";
  if (isValidBO3Score(scoreA, scoreB)) return "completed";
  if (scoreA === 0 && scoreB === 0) return "upcoming";
  return "live";
}

export function createEmptyBracket() {
  return MATCH_DEFINITIONS.map((definition) => makeBaseMatch(definition));
}

export function createInitialBracketFromSeeds(seeds) {
  const seedMap = seedToTeamMap(seeds);
  const matches = createEmptyBracket().map((match) => {
    if (match.round !== "R16") return match;
    const teamA = seedMap.get(match.teamASeed);
    const teamB = seedMap.get(match.teamBSeed);
    return {
      ...match,
      teamAId: teamA?.teamId || null,
      teamBId: teamB?.teamId || null,
      status: teamA?.teamId && teamB?.teamId ? "upcoming" : "empty",
    };
  });

  return recalculateBracket(matches);
}

export function createInitialBracketFromTeams(teams) {
  const seeds = (Array.isArray(teams) ? teams : [])
    .slice()
    .sort((a, b) => {
      const rankA = normalizeNumber(a?.rank) ?? Number.MAX_SAFE_INTEGER;
      const rankB = normalizeNumber(b?.rank) ?? Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
      return sanitizeTeamCode(a?.code).localeCompare(sanitizeTeamCode(b?.code));
    })
    .slice(0, 16)
    .map((team, index) => ({
      seedNo: index + 1,
      teamId: normalizeId(team?.id),
      teamCode: sanitizeTeamCode(team?.code),
    }));

  return createInitialBracketFromSeeds(seeds);
}

export function createInitialBracketFromStandings(standings, teams) {
  const teamList = Array.isArray(teams) ? teams : [];
  const seeds = (Array.isArray(standings) ? standings : [])
    .slice()
    .sort((a, b) => {
      const rankA = normalizeNumber(a?.rank);
      const rankB = normalizeNumber(b?.rank);
      if (rankA !== null && rankB !== null && rankA !== rankB) return rankA - rankB;
      if ((b?.matchPoint ?? 0) !== (a?.matchPoint ?? 0)) return (b?.matchPoint ?? 0) - (a?.matchPoint ?? 0);
      return (b?.netGameWin ?? 0) - (a?.netGameWin ?? 0);
    })
    .slice(0, 16)
    .map((standing, index) => {
      const teamId = getTeamIdFromStanding(standing, teamList);
      const team = teamList.find((item) => item.id === teamId);
      return {
        seedNo: index + 1,
        teamId,
        teamCode: sanitizeTeamCode(team?.code || standing?.teamCode || standing?.team),
      };
    });

  return createInitialBracketFromSeeds(seeds);
}

export function recalculateBracket(matches) {
  const normalized = normalizeBracketMatches(matches);
  const byId = {};
  const timestamp = nowIso();

  sortBracket(normalized).forEach((match) => {
    const next = { ...match };
    let slotChanged = false;

    if (next.sourceMatchA) {
      const parent = byId[next.sourceMatchA];
      const teamId = parent?.status === "completed" ? parent.winnerTeamId : null;
      const seed = teamId ? getTeamSeed(parent, parent.winnerTeamId === parent.teamAId ? "A" : "B") : null;
      if (next.teamAId !== teamId || next.teamASeed !== seed) {
        next.teamAId = teamId;
        next.teamASeed = seed;
        slotChanged = true;
      }
    }

    if (next.sourceMatchB) {
      const parent = byId[next.sourceMatchB];
      const teamId = parent?.status === "completed" ? parent.winnerTeamId : null;
      const seed = teamId ? getTeamSeed(parent, parent.winnerTeamId === parent.teamAId ? "A" : "B") : null;
      if (next.teamBId !== teamId || next.teamBSeed !== seed) {
        next.teamBId = teamId;
        next.teamBSeed = seed;
        slotChanged = true;
      }
    }

    if (!scoreInputIsAllowed(next.scoreA, next.scoreB)) {
      next.scoreA = 0;
      next.scoreB = 0;
      slotChanged = true;
    }

    const computed = applyComputedResult(slotChanged ? resetResultFields(next, timestamp) : next, timestamp);
    byId[computed.id] = computed;
  });

  return MATCH_DEFINITIONS.map((definition) => byId[definition.id]);
}

export function resetDependentMatches(matches, changedMatchId) {
  const normalized = recalculateBracket(matches);
  const dependentIds = collectDependentIds(normalized, changedMatchId);
  if (!dependentIds.size) return normalized;
  return recalculateBracket(normalized.map((match) => (
    dependentIds.has(match.id) ? resetResultFields(match) : match
  )));
}

export function updateMatchResult(matches, matchId, scoreA, scoreB) {
  const definition = MATCH_DEFINITION_BY_ID[matchId];
  if (!definition) {
    throw new Error(`Match ${matchId} tidak ditemukan.`);
  }

  const parsedA = normalizeNumber(scoreA);
  const parsedB = normalizeNumber(scoreB);
  if (parsedA === null || parsedB === null) {
    throw new Error("Skor harus berupa angka bulat.");
  }
  if (!scoreInputIsAllowed(parsedA, parsedB)) {
    throw new Error("Skor BO3 hanya boleh 0, 1, atau 2 dan tidak boleh 2-2.");
  }

  const current = recalculateBracket(matches);
  const oldMatch = current.find((match) => match.id === matchId);
  if (!oldMatch) {
    throw new Error(`Match ${matchId} tidak ditemukan.`);
  }
  if (!hasBothTeams(oldMatch) && (parsedA !== 0 || parsedB !== 0)) {
    throw new Error("Match belum punya dua tim, skor belum bisa disimpan.");
  }

  const changed = oldMatch.scoreA !== parsedA
    || oldMatch.scoreB !== parsedB
    || oldMatch.status === "completed";

  const updated = current.map((match) => {
    if (match.id !== matchId) return match;
    return applyComputedResult({
      ...match,
      scoreA: parsedA,
      scoreB: parsedB,
      updatedAt: nowIso(),
    });
  });

  const recalculated = recalculateBracket(updated);
  return changed ? resetDependentMatches(recalculated, matchId) : recalculated;
}

export function resetBracketResults(matches) {
  return recalculateBracket((Array.isArray(matches) ? matches : createEmptyBracket()).map((match) => ({
    ...match,
    scoreA: 0,
    scoreB: 0,
    winnerTeamId: null,
    loserTeamId: null,
    status: match.teamAId && match.teamBId ? "upcoming" : "empty",
  })));
}

export function validateBracketSchema(data) {
  const matches = Array.isArray(data) ? data : data?.bracket;
  const errors = [];
  if (!Array.isArray(matches)) {
    return { valid: false, errors: ["Bracket harus berupa array."] };
  }
  if (matches.length !== MATCH_DEFINITIONS.length) {
    errors.push("Bracket harus berisi 15 match.");
  }

  const ids = new Set(matches.map((match) => match?.id));
  MATCH_DEFINITIONS.forEach((definition) => {
    if (!ids.has(definition.id)) errors.push(`Match ${definition.id} tidak ditemukan.`);
  });

  matches.forEach((match) => {
    const definition = MATCH_DEFINITION_BY_ID[match?.id];
    if (!definition) {
      errors.push(`Match ${match?.id || "UNKNOWN"} tidak dikenal.`);
      return;
    }
    if (match.bestOf !== BEST_OF || match.requiredWins !== REQUIRED_WINS) {
      errors.push(`${match.id} wajib BO3.`);
    }
    if (!scoreInputIsAllowed(match.scoreA, match.scoreB)) {
      errors.push(`${match.id} punya skor tidak valid.`);
    }
    if (match.status === "completed" && (!match.teamAId || !match.teamBId)) {
      errors.push(`${match.id} tidak boleh completed tanpa dua tim.`);
    }
    if (match.status === "completed") {
      const winnerSlot = getWinnerSlot(match.scoreA, match.scoreB, match.requiredWins);
      const expectedWinner = winnerSlot === "A" ? match.teamAId : winnerSlot === "B" ? match.teamBId : null;
      if (!expectedWinner || match.winnerTeamId !== expectedWinner) {
        errors.push(`${match.id} punya winner tidak konsisten.`);
      }
    }
    if (definition.round !== match.round) {
      errors.push(`${match.id} berada di round yang salah.`);
    }
  });

  const value = recalculateBracket(matches);
  return { valid: errors.length === 0, errors, value };
}

export function sanitizeTeamCode(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 12);
}

export function sanitizeText(value, maxLength = 60) {
  return Array.from(String(value ?? ""))
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function migrateLegacyBracket(oldBracket, teams) {
  const validation = validateBracketSchema(oldBracket);
  if (validation.valid) return validation.value;

  if (Array.isArray(oldBracket) && oldBracket.some((match) => /^M[1-8]$/.test(match?.id || ""))) {
    return createInitialBracketFromTeams(teams);
  }

  return createInitialBracketFromTeams(teams);
}

export function getChampion(matches) {
  const bracket = recalculateBracket(matches);
  const grandFinal = bracket.find((match) => match.id === "GF-1");
  return grandFinal?.status === "completed" ? grandFinal.winnerTeamId : null;
}
