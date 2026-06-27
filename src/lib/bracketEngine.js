export const BRACKET_SCHEMA_VERSION = 3;
export const BRACKET_FORMAT = "flexible_single_elimination";
export const ALLOWED_BEST_OF = [1, 3, 5, 7, 9];
export const DEFAULT_BEST_OF = 3;
export const SERIES_TYPE = "BO3";
export const BEST_OF = DEFAULT_BEST_OF;
export const REQUIRED_WINS = 2;
export const MIN_PARTICIPANTS = 2;
export const MAX_PARTICIPANTS = 16;
export const BRACKET_SIZES = [2, 4, 8, 16];
export const BYE_SLOT = "__BYE__";

export const ROUND_ORDER = ["R16", "QF", "SF", "GF"];

export const ROUND_LABELS = {
  R16: "Round of 16",
  QF: "Quarter Final",
  SF: "Semi Final",
  GF: "Grand Final",
};

export const ROUND_MATCH_COUNTS = {
  R16: 8,
  QF: 4,
  SF: 2,
  GF: 1,
};

export const SEED_ORDERS = {
  2: [1, 2],
  4: [1, 4, 2, 3],
  8: [1, 8, 4, 5, 2, 7, 3, 6],
  16: [1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11],
};

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

const hasTeam = (slot) => slot?.type === "team" && Boolean(slot.teamId);
const slotIsBye = (slot) => slot?.type === "bye";
const slotIsEmpty = (slot) => !slot || slot.type === "empty";

const sortParticipants = (participants) => (
  [...(Array.isArray(participants) ? participants : [])]
    .filter((team) => team?.id && team.isActive !== false && team.is_participant !== false && team.dropped !== true)
    .sort((a, b) => {
      const seedA = normalizeNumber(a.seedNo ?? a.seed_no ?? a.rank ?? a.sortOrder ?? a.sort_order) ?? Number.MAX_SAFE_INTEGER;
      const seedB = normalizeNumber(b.seedNo ?? b.seed_no ?? b.rank ?? b.sortOrder ?? b.sort_order) ?? Number.MAX_SAFE_INTEGER;
      if (seedA !== seedB) return seedA - seedB;
      return sanitizeTeamCode(a.code).localeCompare(sanitizeTeamCode(b.code));
    })
    .slice(0, MAX_PARTICIPANTS)
);

const makeTeamSlot = (team, seedNo) => ({
  type: "team",
  teamId: normalizeId(team?.id) || normalizeId(team?.teamId) || null,
  seedNo,
  teamCode: sanitizeTeamCode(team?.code || team?.teamCode),
});

const makeByeSlot = (seedNo = null) => ({
  type: "bye",
  teamId: null,
  seedNo,
  teamCode: "BYE",
});

const makeEmptySlot = (seedNo = null) => ({
  type: "empty",
  teamId: null,
  seedNo,
  teamCode: "",
});

const normalizeSlot = (slot, fallbackSeed = null) => {
  if (slot === BYE_SLOT || slot === "BYE" || slot === "__bye__") return makeByeSlot(fallbackSeed);
  if (typeof slot === "string") {
    const teamId = normalizeId(slot);
    return teamId ? { type: "team", teamId, seedNo: fallbackSeed, teamCode: "" } : makeEmptySlot(fallbackSeed);
  }
  if (!slot || typeof slot !== "object") return makeEmptySlot(fallbackSeed);
  const rawType = slot.type || slot.slotType || slot.slot_type;
  const type = rawType === "bye" || slot.isBye || slot.team_is_bye
    ? "bye"
    : rawType === "empty"
      ? "empty"
      : "team";
  if (type === "bye") return makeByeSlot(normalizeNumber(slot.seedNo ?? slot.seed_no) ?? fallbackSeed);
  const teamId = normalizeId(slot.teamId ?? slot.team_id ?? slot.id);
  if (!teamId) return makeEmptySlot(normalizeNumber(slot.seedNo ?? slot.seed_no) ?? fallbackSeed);
  return {
    type: "team",
    teamId,
    seedNo: normalizeNumber(slot.seedNo ?? slot.seed_no) ?? fallbackSeed,
    teamCode: sanitizeTeamCode(slot.teamCode ?? slot.code),
  };
};

export function isPowerOfTwo(value) {
  const parsed = normalizeNumber(value);
  return parsed !== null && parsed > 0 && (parsed & (parsed - 1)) === 0;
}

export function validateParticipantCount(count) {
  const parsed = normalizeNumber(count);
  const errors = [];
  if (parsed === null) errors.push("Jumlah peserta harus berupa angka.");
  else if (parsed < MIN_PARTICIPANTS) errors.push("Minimal peserta aktif adalah 2 tim.");
  else if (parsed > MAX_PARTICIPANTS) errors.push("Maksimal peserta aktif adalah 16 tim.");
  return { valid: errors.length === 0, errors, count: parsed };
}

export function getBracketSize(participantCount) {
  const count = normalizeNumber(participantCount);
  if (count === null || count < MIN_PARTICIPANTS || count > MAX_PARTICIPANTS) return null;
  if (count <= 2) return 2;
  if (count <= 4) return 4;
  if (count <= 8) return 8;
  return 16;
}

export function getByeCount(participantCount) {
  const bracketSize = getBracketSize(participantCount);
  return bracketSize ? bracketSize - Number(participantCount) : 0;
}

export function getSlotCount(bracketSize) {
  const parsed = normalizeNumber(bracketSize);
  return BRACKET_SIZES.includes(parsed) ? parsed : 16;
}

export function getRoundStructure(bracketSize = 16) {
  const size = getSlotCount(bracketSize);
  const rounds = size === 2
    ? ["GF"]
    : size === 4
      ? ["SF", "GF"]
      : size === 8
        ? ["QF", "SF", "GF"]
        : ["R16", "QF", "SF", "GF"];

  const definitions = [];
  let matchNo = 1;
  rounds.forEach((round, roundIndex) => {
    const count = ROUND_MATCH_COUNTS[round];
    for (let order = 1; order <= count; order += 1) {
      const nextRound = rounds[roundIndex + 1] || null;
      const nextOrder = Math.ceil(order / 2);
      const nextMatchId = nextRound ? `${nextRound}-${nextOrder}` : null;
      definitions.push({
        id: `${round}-${order}`,
        round,
        roundLabel: ROUND_LABELS[round],
        roundIndex: ROUND_ORDER.indexOf(round) + 1,
        order,
        matchNo,
        label: `Match ${matchNo}`,
        teamASeed: roundIndex === 0 ? SEED_ORDERS[size][(order - 1) * 2] : null,
        teamBSeed: roundIndex === 0 ? SEED_ORDERS[size][(order - 1) * 2 + 1] : null,
        nextMatchId,
        nextSlot: nextRound ? (order % 2 === 1 ? "A" : "B") : null,
        sourceMatchA: roundIndex === 0 ? null : `${rounds[roundIndex - 1]}-${(order - 1) * 2 + 1}`,
        sourceMatchB: roundIndex === 0 ? null : `${rounds[roundIndex - 1]}-${(order - 1) * 2 + 2}`,
        bracketSize: size,
      });
      matchNo += 1;
    }
  });
  return definitions;
}

export const MATCH_DEFINITIONS = getRoundStructure(16);

const getDefinitionsForMatches = (matches, options = {}) => {
  const explicit = normalizeNumber(options.bracketSize ?? options.bracket_size);
  if (BRACKET_SIZES.includes(explicit)) return getRoundStructure(explicit);
  const fromMatch = (Array.isArray(matches) ? matches : [])
    .map((match) => normalizeNumber(match?.bracketSize ?? match?.bracket_size))
    .find((size) => BRACKET_SIZES.includes(size));
  if (fromMatch) return getRoundStructure(fromMatch);
  const ids = new Set((Array.isArray(matches) ? matches : []).map((match) => match?.id));
  if (ids.has("R16-1")) return getRoundStructure(16);
  if (ids.has("QF-1")) return getRoundStructure(8);
  if (ids.has("SF-1")) return getRoundStructure(4);
  if (ids.has("GF-1")) return getRoundStructure(2);
  return getRoundStructure(16);
};

const definitionById = (definitions) => definitions.reduce((acc, definition) => {
  acc[definition.id] = definition;
  return acc;
}, {});

export function getRequiredWins(bestOf) {
  const parsed = normalizeNumber(bestOf);
  if (!isValidBestOf(parsed)) return REQUIRED_WINS;
  return Math.floor(parsed / 2) + 1;
}

export function isValidBestOf(bestOf) {
  const parsed = normalizeNumber(bestOf);
  return ALLOWED_BEST_OF.includes(parsed);
}

export function getSeriesLabel(bestOf) {
  const safeBestOf = isValidBestOf(bestOf) ? Number(bestOf) : DEFAULT_BEST_OF;
  return `BO${safeBestOf}`;
}

const normalizeScore = (value, requiredWins = REQUIRED_WINS) => {
  const score = normalizeNumber(value);
  return score !== null && score >= 0 && score <= requiredWins ? score : 0;
};

const scoreInputIsAllowed = (scoreA, scoreB, requiredWins = REQUIRED_WINS) => {
  const a = normalizeNumber(scoreA);
  const b = normalizeNumber(scoreB);
  if (a === null || b === null) return false;
  if (a < 0 || b < 0 || a > requiredWins || b > requiredWins) return false;
  if (a === requiredWins && b === requiredWins) return false;
  return true;
};

const getWinnerSlot = (scoreA, scoreB, requiredWins = REQUIRED_WINS) => {
  if (scoreA === requiredWins && scoreB < requiredWins) return "A";
  if (scoreB === requiredWins && scoreA < requiredWins) return "B";
  return null;
};

export function isValidSeriesScore(scoreA, scoreB, bestOf = DEFAULT_BEST_OF) {
  const requiredWins = getRequiredWins(bestOf);
  const a = normalizeNumber(scoreA);
  const b = normalizeNumber(scoreB);
  if (!scoreInputIsAllowed(a, b, requiredWins)) return false;
  return (
    (a === requiredWins && b < requiredWins)
    || (b === requiredWins && a < requiredWins)
  );
}

export function isValidBO3Score(scoreA, scoreB) {
  return isValidSeriesScore(scoreA, scoreB, DEFAULT_BEST_OF);
}

export function getWinnerFromScore(scoreA, scoreB, requiredWins = REQUIRED_WINS) {
  const a = normalizeNumber(scoreA);
  const b = normalizeNumber(scoreB);
  if (a === null || b === null) return null;
  return getWinnerSlot(a, b, requiredWins);
}

export function isByeSlot(slot) {
  return slotIsBye(normalizeSlot(slot));
}

const matchSlots = (match) => ({
  A: {
    type: match.slotAType || match.slot_a_type || (match.teamAIsBye || match.team_a_is_bye ? "bye" : match.teamAId ? "team" : "empty"),
    teamId: match.teamAId || null,
    seedNo: match.teamASeed ?? null,
  },
  B: {
    type: match.slotBType || match.slot_b_type || (match.teamBIsBye || match.team_b_is_bye ? "bye" : match.teamBId ? "team" : "empty"),
    teamId: match.teamBId || null,
    seedNo: match.teamBSeed ?? null,
  },
});

export function isPlayableMatch(match) {
  if (!match) return false;
  const slots = matchSlots(match);
  return hasTeam(slots.A) && hasTeam(slots.B) && !match.autoAdvanced && match.playable !== false;
}

export function isAutoAdvanceMatch(match) {
  return Boolean(match?.autoAdvanced || match?.auto_advanced);
}

export function isSchedulableMatch(match) {
  if (!match || isAutoAdvanceMatch(match)) return false;
  const slots = matchSlots(match);
  return !(slotIsBye(slots.A) && slotIsBye(slots.B));
}

export function getMatchDisplayStatus(match) {
  if (isAutoAdvanceMatch(match)) return "auto";
  return match?.status || "empty";
}

const makeBaseMatch = (definition, options = {}) => {
  const timestamp = options.timestamp || nowIso();
  const bestOf = isValidBestOf(options.bestOf) ? Number(options.bestOf) : DEFAULT_BEST_OF;
  const participantCount = normalizeNumber(options.participantCount ?? options.participant_count) ?? definition.bracketSize;
  const byeCount = normalizeNumber(options.byeCount ?? options.bye_count) ?? Math.max(0, definition.bracketSize - participantCount);
  return {
    id: definition.id,
    round: definition.round,
    roundLabel: definition.roundLabel,
    roundIndex: definition.roundIndex,
    order: definition.order,
    matchNo: definition.matchNo,
    label: definition.label,
    bestOf,
    requiredWins: getRequiredWins(bestOf),
    teamAId: null,
    teamBId: null,
    teamASeed: definition.teamASeed ?? null,
    teamBSeed: definition.teamBSeed ?? null,
    slotAType: "empty",
    slotBType: "empty",
    teamAIsBye: false,
    teamBIsBye: false,
    autoAdvanced: false,
    playable: false,
    bracketSize: definition.bracketSize,
    participantCount,
    byeCount,
    byeReason: "",
    scoreA: 0,
    scoreB: 0,
    winnerTeamId: null,
    loserTeamId: null,
    status: "empty",
    date: "",
    time: "",
    venue: "",
    stage: "",
    streamLink: "",
    nextMatchId: definition.nextMatchId,
    nextSlot: definition.nextSlot,
    sourceMatchA: definition.sourceMatchA,
    sourceMatchB: definition.sourceMatchB,
    locked: false,
    metadata: {},
    updatedAt: timestamp,
  };
};

const setMatchSlot = (match, slotName, slot) => {
  const typeKey = slotName === "A" ? "slotAType" : "slotBType";
  const byeKey = slotName === "A" ? "teamAIsBye" : "teamBIsBye";
  const teamKey = slotName === "A" ? "teamAId" : "teamBId";
  const seedKey = slotName === "A" ? "teamASeed" : "teamBSeed";
  return {
    ...match,
    [typeKey]: slot.type,
    [byeKey]: slot.type === "bye",
    [teamKey]: slot.type === "team" ? slot.teamId : null,
    [seedKey]: slot.seedNo ?? match[seedKey] ?? null,
  };
};

const applyMatchState = (match, timestamp = nowIso()) => {
  const slots = matchSlots(match);
  const aTeam = hasTeam(slots.A);
  const bTeam = hasTeam(slots.B);
  const aBye = slotIsBye(slots.A);
  const bBye = slotIsBye(slots.B);
  const empty = slotIsEmpty(slots.A) || slotIsEmpty(slots.B);

  if ((aTeam && bBye) || (bTeam && aBye)) {
    const winnerTeamId = aTeam ? match.teamAId : match.teamBId;
    return {
      ...match,
      scoreA: 0,
      scoreB: 0,
      winnerTeamId,
      loserTeamId: null,
      status: "completed",
      autoAdvanced: true,
      playable: false,
      byeReason: match.byeReason || "BYE from incomplete bracket",
      updatedAt: timestamp,
    };
  }

  if (aBye && bBye) {
    return {
      ...match,
      scoreA: 0,
      scoreB: 0,
      winnerTeamId: null,
      loserTeamId: null,
      status: "empty",
      autoAdvanced: false,
      playable: false,
      byeReason: match.byeReason || "BYE vs BYE hidden match",
      updatedAt: timestamp,
    };
  }

  if (empty || !aTeam || !bTeam) {
    return {
      ...match,
      scoreA: 0,
      scoreB: 0,
      winnerTeamId: null,
      loserTeamId: null,
      status: "empty",
      autoAdvanced: false,
      playable: false,
      updatedAt: timestamp,
    };
  }

  const scoreA = normalizeScore(match.scoreA, match.requiredWins);
  const scoreB = normalizeScore(match.scoreB, match.requiredWins);
  const winnerSlot = isValidSeriesScore(scoreA, scoreB, match.bestOf)
    ? getWinnerSlot(scoreA, scoreB, match.requiredWins)
    : null;

  return {
    ...match,
    scoreA,
    scoreB,
    autoAdvanced: false,
    playable: true,
    byeReason: "",
    status: winnerSlot ? "completed" : scoreA === 0 && scoreB === 0 ? "upcoming" : "live",
    winnerTeamId: winnerSlot === "A" ? match.teamAId : winnerSlot === "B" ? match.teamBId : null,
    loserTeamId: winnerSlot === "A" ? match.teamBId : winnerSlot === "B" ? match.teamAId : null,
    updatedAt: match.updatedAt || timestamp,
  };
};

const slotsEqual = (left, right) => (
  left.type === right.type
  && (left.teamId || null) === (right.teamId || null)
  && (left.seedNo ?? null) === (right.seedNo ?? null)
);

const resetResultFields = (match, timestamp = nowIso()) => ({
  ...match,
  scoreA: 0,
  scoreB: 0,
  winnerTeamId: null,
  loserTeamId: null,
  status: "empty",
  autoAdvanced: false,
  playable: false,
  updatedAt: timestamp,
});

export function createTournamentConfig(overrides = {}) {
  const safeOverrides = overrides && typeof overrides === "object" && !Array.isArray(overrides)
    ? overrides
    : {};
  const participantCount = normalizeNumber(safeOverrides.participantCount ?? safeOverrides.participant_count ?? safeOverrides.totalTeams ?? safeOverrides.total_teams) ?? 16;
  const bracketSize = getBracketSize(participantCount) || normalizeNumber(safeOverrides.bracketSize ?? safeOverrides.bracket_size) || 16;
  const bestOf = isValidBestOf(safeOverrides.bestOf ?? safeOverrides.best_of)
    ? Number(safeOverrides.bestOf ?? safeOverrides.best_of)
    : DEFAULT_BEST_OF;
  const byeCount = Math.max(0, bracketSize - participantCount);
  return {
    schemaVersion: BRACKET_SCHEMA_VERSION,
    ...safeOverrides,
    format: safeOverrides.format || BRACKET_FORMAT,
    totalTeams: participantCount,
    maxTeams: MAX_PARTICIPANTS,
    minTeams: MIN_PARTICIPANTS,
    totalMatches: Math.max(0, participantCount - 1),
    playableMatches: Math.max(0, participantCount - 1),
    participantCount,
    bracketSize,
    byeCount,
    updatedAt: safeOverrides.updatedAt || safeOverrides.updated_at || nowIso(),
    seriesType: getSeriesLabel(bestOf),
    bestOf,
    requiredWins: getRequiredWins(bestOf),
  };
}

export function createEmptyBracket(bestOf = DEFAULT_BEST_OF, options = {}) {
  const bracketSize = getSlotCount(options.bracketSize ?? options.bracket_size ?? 16);
  const participantCount = normalizeNumber(options.participantCount ?? options.participant_count) ?? bracketSize;
  return getRoundStructure(bracketSize).map((definition) => makeBaseMatch(definition, {
    bestOf,
    participantCount,
    byeCount: Math.max(0, bracketSize - participantCount),
  }));
}

export function createBracketSlots(participants, options = {}) {
  const participantList = sortParticipants(participants);
  const participantCount = normalizeNumber(options.participantCount ?? options.participant_count) ?? participantList.length;
  const validation = validateParticipantCount(participantCount);
  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }
  const bracketSize = getBracketSize(participantCount);
  const byeMode = options.byeMode || options.bye_mode || "seeded";
  const byeCount = bracketSize - participantCount;
  const seedOrder = SEED_ORDERS[bracketSize];

  if (byeMode === "random") {
    return shuffleTeams([
      ...participantList.slice(0, participantCount).map((team, index) => makeTeamSlot(team, index + 1)),
      ...Array.from({ length: byeCount }, (_, index) => makeByeSlot(participantCount + index + 1)),
    ], options.seed);
  }

  const slotsBySeed = Array.from({ length: bracketSize }, (_, index) => {
    const team = participantList[index];
    return team ? makeTeamSlot(team, index + 1) : makeByeSlot(index + 1);
  });

  return seedOrder.map((seedNo) => slotsBySeed[seedNo - 1] || makeEmptySlot(seedNo));
}

export function distributeByes(participants, bracketSize, mode = "seeded") {
  return createBracketSlots(participants, {
    participantCount: Array.isArray(participants) ? participants.length : 0,
    bracketSize,
    byeMode: mode,
  });
}

const createBracketFromSlots = (slots, options = {}) => {
  const normalizedSlots = (Array.isArray(slots) ? slots : []).map((slot, index) => normalizeSlot(slot, index + 1));
  const participantCount = normalizeNumber(options.participantCount ?? options.participant_count)
    ?? normalizedSlots.filter(hasTeam).length;
  const bracketSize = normalizeNumber(options.bracketSize ?? options.bracket_size)
    ?? normalizedSlots.length
    ?? getBracketSize(participantCount)
    ?? 16;
  const bestOf = isValidBestOf(options.bestOf ?? options.best_of) ? Number(options.bestOf ?? options.best_of) : DEFAULT_BEST_OF;
  const definitions = getRoundStructure(bracketSize);
  const firstRound = definitions[0]?.round;
  const byeCount = Math.max(0, bracketSize - participantCount);

  const matches = createEmptyBracket(bestOf, { bracketSize, participantCount }).map((match) => {
    if (match.round !== firstRound) return match;
    const slotIndex = (match.order - 1) * 2;
    return setMatchSlot(
      setMatchSlot(match, "A", normalizedSlots[slotIndex] || makeEmptySlot(slotIndex + 1)),
      "B",
      normalizedSlots[slotIndex + 1] || makeEmptySlot(slotIndex + 2)
    );
  }).map((match) => ({
    ...match,
    bracketSize,
    participantCount,
    byeCount,
    metadata: {
      ...(match.metadata || {}),
      byeMode: options.byeMode || options.bye_mode || "seeded",
    },
  }));

  return recalculateFlexibleBracket(matches, { bracketSize, participantCount, bestOf });
};

export function createFlexibleBracket(participants, options = {}) {
  const participantList = sortParticipants(participants);
  const participantCount = normalizeNumber(options.participantCount ?? options.participant_count) ?? participantList.length;
  const slots = createBracketSlots(participantList.slice(0, participantCount), {
    ...options,
    participantCount,
  });
  return createBracketFromSlots(slots, {
    ...options,
    participantCount,
    bracketSize: getBracketSize(participantCount),
  });
}

export function createFlexibleManualBracket(slots, options = {}) {
  return createBracketFromSlots(slots, options);
}

export function createFlexibleSpinDraw(participants, options = {}) {
  const participantList = sortParticipants(participants);
  const participantCount = normalizeNumber(options.participantCount ?? options.participant_count) ?? participantList.length;
  const bracketSize = getBracketSize(participantCount);
  const byeCount = bracketSize - participantCount;
  const mode = options.byeMode || options.bye_mode || "random";
  const slots = mode === "seeded_then_spin"
    ? createBracketSlots(shuffleTeams(participantList, options.seed), { ...options, participantCount, byeMode: "seeded" })
    : createBracketSlots(participantList, { ...options, participantCount, byeMode: mode === "seeded" ? "seeded" : "random" });
  return {
    slots,
    bracketSize,
    participantCount,
    byeCount,
    byeMode: mode,
    createdAt: nowIso(),
    drawSeed: options.seed || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
  };
}

export function applyByesAndAutoAdvance(matches) {
  return recalculateFlexibleBracket(matches);
}

export function recalculateFlexibleBracket(matches, options = {}) {
  const definitions = getDefinitionsForMatches(matches, options);
  const bracketSize = definitions[0]?.bracketSize || 16;
  const timestamp = nowIso();
  const sourceById = (Array.isArray(matches) ? matches : []).reduce((acc, raw) => {
    if (raw?.id) acc[raw.id] = raw;
    return acc;
  }, {});
  const bestOf = isValidBestOf(options.bestOf ?? options.best_of)
    ? Number(options.bestOf ?? options.best_of)
    : null;
  const participantCount = normalizeNumber(options.participantCount ?? options.participant_count)
    ?? (Array.isArray(matches) ? matches.find((match) => match?.participantCount || match?.participant_count)?.participantCount : null)
    ?? bracketSize;
  const byeCount = Math.max(0, bracketSize - participantCount);
  const byId = {};

  definitions.forEach((definition) => {
    const raw = sourceById[definition.id] || {};
    const matchBestOf = isValidBestOf(raw.bestOf ?? raw.best_of)
      ? Number(raw.bestOf ?? raw.best_of)
      : bestOf || DEFAULT_BEST_OF;
    let next = {
      ...makeBaseMatch(definition, { bestOf: matchBestOf, participantCount, byeCount, timestamp }),
      venue: sanitizeText(raw.venue, 80),
      stage: sanitizeText(raw.stage, 80),
      streamLink: sanitizeText(raw.streamLink || raw.stream_link, 160),
      date: sanitizeText(raw.date || raw.match_date, 40),
      time: sanitizeText(raw.time || raw.match_time, 20),
      locked: Boolean(raw.locked),
      metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : typeof raw.updated_at === "string" ? raw.updated_at : timestamp,
    };

    next = setMatchSlot(next, "A", normalizeSlot({
      type: raw.slotAType || raw.slot_a_type || (raw.teamAIsBye || raw.team_a_is_bye ? "bye" : raw.teamAId || raw.team_a_id ? "team" : "empty"),
      teamId: raw.teamAId ?? raw.team_a_id,
      seedNo: raw.teamASeed ?? raw.team_a_seed ?? next.teamASeed,
    }, next.teamASeed));
    next = setMatchSlot(next, "B", normalizeSlot({
      type: raw.slotBType || raw.slot_b_type || (raw.teamBIsBye || raw.team_b_is_bye ? "bye" : raw.teamBId || raw.team_b_id ? "team" : "empty"),
      teamId: raw.teamBId ?? raw.team_b_id,
      seedNo: raw.teamBSeed ?? raw.team_b_seed ?? next.teamBSeed,
    }, next.teamBSeed));

    if (definition.sourceMatchA) {
      const parent = byId[definition.sourceMatchA];
      const sourceSlot = parent?.status === "completed" && parent.winnerTeamId
        ? {
            type: "team",
            teamId: parent.winnerTeamId,
            seedNo: parent.winnerTeamId === parent.teamAId ? parent.teamASeed : parent.teamBSeed,
          }
        : makeEmptySlot();
      const current = matchSlots(next).A;
      if (!slotsEqual(current, sourceSlot)) {
        next = resetResultFields(setMatchSlot(next, "A", sourceSlot), timestamp);
      }
    }

    if (definition.sourceMatchB) {
      const parent = byId[definition.sourceMatchB];
      const sourceSlot = parent?.status === "completed" && parent.winnerTeamId
        ? {
            type: "team",
            teamId: parent.winnerTeamId,
            seedNo: parent.winnerTeamId === parent.teamAId ? parent.teamASeed : parent.teamBSeed,
          }
        : makeEmptySlot();
      const current = matchSlots(next).B;
      if (!slotsEqual(current, sourceSlot)) {
        next = resetResultFields(setMatchSlot(next, "B", sourceSlot), timestamp);
      }
    }

    next.scoreA = normalizeScore(raw.scoreA ?? raw.score_a, next.requiredWins);
    next.scoreB = normalizeScore(raw.scoreB ?? raw.score_b, next.requiredWins);
    byId[definition.id] = applyMatchState(next, timestamp);
  });

  return definitions.map((definition) => byId[definition.id]);
}

export const recalculateBracket = recalculateFlexibleBracket;

export function createInitialBracketFromSeeds(seeds, bestOf = DEFAULT_BEST_OF) {
  const participants = (Array.isArray(seeds) ? seeds : [])
    .filter((seed) => normalizeId(seed?.teamId ?? seed?.team_id))
    .map((seed, index) => ({
      id: normalizeId(seed.teamId ?? seed.team_id),
      code: sanitizeTeamCode(seed.teamCode ?? seed.code),
      seedNo: normalizeNumber(seed.seedNo ?? seed.seed_no) ?? index + 1,
      is_participant: true,
      dropped: false,
    }));
  return createFlexibleBracket(participants, { bestOf, byeMode: "seeded" });
}

export function createInitialBracketFromTeams(teams, bestOf = DEFAULT_BEST_OF) {
  return createFlexibleBracket(sortParticipants(teams), { bestOf, byeMode: "seeded" });
}

export function createInitialBracketFromStandings(standings, teams, bestOf = DEFAULT_BEST_OF) {
  const teamList = Array.isArray(teams) ? teams : [];
  const ranked = (Array.isArray(standings) ? standings : [])
    .slice()
    .sort((a, b) => {
      const rankA = normalizeNumber(a?.rank);
      const rankB = normalizeNumber(b?.rank);
      if (rankA !== null && rankB !== null && rankA !== rankB) return rankA - rankB;
      if ((b?.matchPoint ?? 0) !== (a?.matchPoint ?? 0)) return (b?.matchPoint ?? 0) - (a?.matchPoint ?? 0);
      return (b?.netGameWin ?? 0) - (a?.netGameWin ?? 0);
    })
    .map((standing, index) => {
      const code = sanitizeTeamCode(standing?.teamCode || standing?.team);
      const team = teamList.find((item) => sanitizeTeamCode(item.code) === code);
      return team ? { ...team, seedNo: index + 1 } : null;
    })
    .filter(Boolean);
  return createFlexibleBracket(ranked.length ? ranked : teamList, { bestOf, byeMode: "seeded" });
}

export function resetDependentMatches(matches, changedMatchId) {
  const normalized = recalculateFlexibleBracket(matches);
  const byId = normalized.reduce((acc, match) => {
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
  return recalculateFlexibleBracket(normalized.map((match) => (
    dependents.has(match.id) ? resetResultFields(match) : match
  )));
}

export function updateMatchResult(matches, matchId, scoreA, scoreB) {
  const current = recalculateFlexibleBracket(matches);
  const oldMatch = current.find((match) => match.id === matchId);
  if (!oldMatch) throw new Error(`Match ${matchId} tidak ditemukan.`);
  if (!isPlayableMatch(oldMatch)) throw new Error("Match BYE/auto-advance tidak bisa diinput skor.");

  const parsedA = normalizeNumber(scoreA);
  const parsedB = normalizeNumber(scoreB);
  if (parsedA === null || parsedB === null) throw new Error("Skor harus berupa angka bulat.");
  if (!scoreInputIsAllowed(parsedA, parsedB, oldMatch.requiredWins)) {
    throw new Error(
      `Skor ${getSeriesLabel(oldMatch.bestOf)} hanya boleh 0 sampai ${oldMatch.requiredWins} dan tidak boleh ${oldMatch.requiredWins}-${oldMatch.requiredWins}.`
    );
  }

  const changed = oldMatch.scoreA !== parsedA
    || oldMatch.scoreB !== parsedB
    || oldMatch.status === "completed";
  const updated = current.map((match) => (
    match.id === matchId
      ? applyMatchState({ ...match, scoreA: parsedA, scoreB: parsedB, updatedAt: nowIso() })
      : match
  ));
  const recalculated = recalculateFlexibleBracket(updated);
  return changed ? resetDependentMatches(recalculated, matchId) : recalculated;
}

export function createValidFinalScores(bestOf = DEFAULT_BEST_OF) {
  const safeBestOf = isValidBestOf(bestOf) ? Number(bestOf) : DEFAULT_BEST_OF;
  const requiredWins = getRequiredWins(safeBestOf);
  const scores = [];
  for (let loserScore = 0; loserScore < requiredWins; loserScore += 1) {
    scores.push({ label: `A ${requiredWins}-${loserScore}`, scoreA: requiredWins, scoreB: loserScore, winnerSlot: "A", bestOf: safeBestOf });
  }
  for (let loserScore = 0; loserScore < requiredWins; loserScore += 1) {
    scores.push({ label: `B ${requiredWins}-${loserScore}`, scoreA: loserScore, scoreB: requiredWins, winnerSlot: "B", bestOf: safeBestOf });
  }
  return scores;
}

export function createQuickWinOptions(match) {
  const disabled = !isPlayableMatch(match);
  const options = createValidFinalScores(match?.bestOf || DEFAULT_BEST_OF).map((option) => ({
    ...option,
    disabled,
  }));
  return [...options, { label: "Clear", scoreA: 0, scoreB: 0, winnerSlot: null, disabled }];
}

export function resetBracketResults(matches, options = {}) {
  const bestOf = isValidBestOf(options.bestOf) ? Number(options.bestOf) : null;
  return recalculateFlexibleBracket((Array.isArray(matches) ? matches : createEmptyBracket(bestOf || DEFAULT_BEST_OF, options)).map((match) => ({
    ...match,
    bestOf: bestOf || match.bestOf || DEFAULT_BEST_OF,
    requiredWins: getRequiredWins(bestOf || match.bestOf || DEFAULT_BEST_OF),
    scoreA: 0,
    scoreB: 0,
    winnerTeamId: null,
    loserTeamId: null,
    status: "empty",
    autoAdvanced: false,
    playable: false,
  })), options);
}

export function applySeriesFormat(matches, bestOf, options = {}) {
  if (!isValidBestOf(bestOf)) throw new Error("Format series harus BO1, BO3, BO5, BO7, atau BO9.");
  const resetResults = options.resetResults !== false;
  const source = Array.isArray(matches) ? matches : createEmptyBracket(bestOf, options);
  return recalculateFlexibleBracket(source.map((match) => ({
    ...match,
    bestOf: Number(bestOf),
    requiredWins: getRequiredWins(bestOf),
    ...(resetResults ? {
      scoreA: 0,
      scoreB: 0,
      winnerTeamId: null,
      loserTeamId: null,
      status: "empty",
    } : {}),
  })), { ...options, bestOf });
}

export function validateFlexibleDrawSlots(slots, participantCount, teams = []) {
  const normalized = (Array.isArray(slots) ? slots : []).map((slot, index) => normalizeSlot(slot, index + 1));
  const countValidation = validateParticipantCount(participantCount);
  const errors = [...countValidation.errors];
  const bracketSize = countValidation.valid ? getBracketSize(participantCount) : normalized.length;
  const byeCount = bracketSize ? bracketSize - participantCount : 0;
  const teamIds = new Set((Array.isArray(teams) ? teams : []).filter((team) => team.dropped !== true).map((team) => team.id));
  const used = new Set();
  const teamSlotCount = normalized.filter(hasTeam).length;
  const byeSlotCount = normalized.filter(slotIsBye).length;

  if (normalized.length !== bracketSize) errors.push(`Draw harus berisi ${bracketSize} slot.`);
  if (normalized.some(slotIsEmpty)) errors.push("Semua slot draw harus berisi team atau BYE.");
  if (teamSlotCount !== participantCount) errors.push(`Jumlah slot team harus ${participantCount}.`);
  if (byeSlotCount !== byeCount) errors.push(`Jumlah BYE harus ${byeCount}.`);

  normalized.forEach((slot, index) => {
    if (!hasTeam(slot)) return;
    if (teamIds.size && !teamIds.has(slot.teamId)) errors.push(`Slot ${index + 1} berisi team yang tidak valid atau dropped.`);
    if (used.has(slot.teamId)) errors.push("Satu team tidak boleh muncul di dua slot.");
    used.add(slot.teamId);
  });

  if (teamSlotCount < 2) errors.push("Minimal dua team harus masuk bracket.");

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    slots: normalized,
    bracketSize,
    participantCount,
    byeCount,
  };
}

export function validateDrawSlots(slots, teams = [], options = {}) {
  const normalized = (Array.isArray(slots) ? slots : []).map((slot, index) => normalizeSlot(slot, index + 1));
  const participantCount = normalizeNumber(options.participantCount ?? options.participant_count)
    ?? normalized.filter(hasTeam).length
    ?? sortParticipants(teams).length;
  return validateFlexibleDrawSlots(normalized, participantCount, teams);
}

export function createManualBracketFromSlots(slots, bestOf = DEFAULT_BEST_OF, options = {}) {
  const participantCount = normalizeNumber(options.participantCount ?? options.participant_count)
    ?? (Array.isArray(slots) ? slots.map(normalizeSlot).filter(hasTeam).length : 0);
  return createFlexibleManualBracket(slots, { ...options, bestOf, participantCount });
}

export function shuffleTeams(teams, seed) {
  const list = [...(Array.isArray(teams) ? teams : [])];
  let state = Number.isInteger(Number(seed)) ? Number(seed) : null;
  const random = () => {
    if (state === null) {
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        const values = new Uint32Array(1);
        crypto.getRandomValues(values);
        return values[0] / 0xffffffff;
      }
      return Math.random();
    }
    state = (state * 1664525 + 1013904223) % 0x100000000;
    return state / 0x100000000;
  };

  for (let index = list.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
  }
  return list;
}

export function createRandomDrawSlots(teams, options = {}) {
  return createFlexibleSpinDraw(teams, { ...options, byeMode: options.byeMode || "random" }).slots;
}

export function getVisibleMatches(matches, bracketSize) {
  const definitions = getRoundStructure(bracketSize || getDefinitionsForMatches(matches)[0]?.bracketSize || 16);
  const ids = new Set(definitions.map((definition) => definition.id));
  return recalculateFlexibleBracket(matches, { bracketSize }).filter((match) => (
    ids.has(match.id)
    && !(match.slotAType === "bye" && match.slotBType === "bye")
  ));
}

export function getPlayableMatches(matches) {
  return recalculateFlexibleBracket(matches).filter(isPlayableMatch);
}

export function getSchedulableMatches(matches, bracketSize) {
  return getVisibleMatches(matches, bracketSize).filter(isSchedulableMatch);
}

export function validateBracketSchema(data) {
  const matches = Array.isArray(data) ? data : data?.bracket;
  const errors = [];
  if (!Array.isArray(matches)) {
    return { valid: false, errors: ["Bracket harus berupa array."], value: [] };
  }
  const definitions = getDefinitionsForMatches(matches);
  const definitionsById = definitionById(definitions);
  const ids = new Set(matches.map((match) => match?.id));
  definitions.forEach((definition) => {
    if (!ids.has(definition.id)) errors.push(`Match ${definition.id} tidak ditemukan.`);
  });
  matches.forEach((match) => {
    const definition = definitionsById[match?.id];
    if (!definition) {
      errors.push(`Match ${match?.id || "UNKNOWN"} tidak dikenal.`);
      return;
    }
    const bestOf = isValidBestOf(match.bestOf) ? Number(match.bestOf) : DEFAULT_BEST_OF;
    const requiredWins = getRequiredWins(bestOf);
    if (!isValidBestOf(match.bestOf) || match.requiredWins !== requiredWins) {
      errors.push(`${match.id} punya format BO tidak valid.`);
    }
    if (!scoreInputIsAllowed(match.scoreA ?? 0, match.scoreB ?? 0, requiredWins)) {
      errors.push(`${match.id} punya skor tidak valid.`);
    }
    if (definition.round !== match.round) errors.push(`${match.id} berada di round yang salah.`);
  });
  const value = recalculateFlexibleBracket(matches);
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
  return createInitialBracketFromTeams(teams);
}

export function getChampion(matches) {
  const bracket = recalculateFlexibleBracket(matches);
  const grandFinal = bracket.find((match) => match.id === "GF-1");
  return grandFinal?.status === "completed" ? grandFinal.winnerTeamId : null;
}
