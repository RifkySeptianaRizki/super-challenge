const SUPPORTED_BRACKET_SIZES = [2, 4, 8, 16];

export const BRACKET_CARD_WIDTH = 252;
export const BRACKET_CARD_HEIGHT = 116;
export const BRACKET_CHAMPION_WIDTH = 250;

const COLUMN_GAP = 112;
const FIRST_ROUND_GAP = 28;
const CANVAS_PADDING_X = 32;
const CANVAS_PADDING_Y = 56;
const HEADER_TOP = 56;
const HEADER_HEIGHT = 68;
const FIRST_MATCH_TOP = HEADER_TOP + HEADER_HEIGHT;

const MIN_CANVAS_HEIGHT = {
  2: 320,
  4: 440,
  8: 680,
  16: 860,
};

const ROUND_TITLES = {
  R16: "ROUND OF 16",
  QF: "QUARTER FINAL",
  SF: "SEMI FINAL",
  GF: "GRAND FINAL",
  CHAMPION: "CHAMPION",
};

const normalizeInteger = (value) => {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value);
  return null;
};

export function normalizeBracketSize(value) {
  const size = normalizeInteger(value);
  return SUPPORTED_BRACKET_SIZES.includes(size) ? size : null;
}

export function getRoundsForBracketSize(bracketSize) {
  const size = normalizeBracketSize(bracketSize) || 16;

  if (size === 2) return ["GF"];
  if (size === 4) return ["SF", "GF"];
  if (size === 8) return ["QF", "SF", "GF"];
  return ["R16", "QF", "SF", "GF"];
}

export function inferBracketSize(matches) {
  const source = Array.isArray(matches) ? matches : [];
  const explicitSize = source
    .map((match) => normalizeBracketSize(match?.bracketSize ?? match?.bracket_size))
    .find(Boolean);

  if (explicitSize) return explicitSize;

  const rounds = new Set(source.map((match) => match?.round).filter(Boolean));
  const ids = new Set(source.map((match) => match?.id).filter(Boolean));
  const hasIdPrefix = (prefix) => [...ids].some((id) => id.startsWith(`${prefix}-`));

  if (rounds.has("R16") || hasIdPrefix("R16")) return 16;
  if (rounds.has("QF") || hasIdPrefix("QF")) return 8;
  if (rounds.has("SF") || hasIdPrefix("SF")) return 4;
  if (rounds.has("GF") || hasIdPrefix("GF")) return 2;

  return null;
}

export function resolveBracketSize(matches, tournamentConfig = {}) {
  return (
    inferBracketSize(matches)
    || normalizeBracketSize(tournamentConfig.bracketSize ?? tournamentConfig.bracket_size)
    || 16
  );
}

const getMatchOrder = (match) => (
  normalizeInteger(match?.order ?? match?.order_no ?? match?.matchNo ?? match?.match_no)
  ?? normalizeInteger(String(match?.id || "").split("-")[1])
  ?? 0
);

const sortMatches = (left, right) => {
  const leftOrder = getMatchOrder(left);
  const rightOrder = getMatchOrder(right);
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return String(left?.id || "").localeCompare(String(right?.id || ""));
};

export function getRoundMatches(matches, round) {
  return (Array.isArray(matches) ? matches : [])
    .filter((match) => match?.round === round)
    .sort(sortMatches);
}

const getColumnX = (columnIndex) => (
  CANVAS_PADDING_X + columnIndex * (BRACKET_CARD_WIDTH + COLUMN_GAP)
);

const getParentMatchIds = (match, previousRound) => {
  const parents = [match?.sourceMatchA, match?.sourceMatchB].filter(Boolean);

  if (parents.length || !previousRound) return parents;

  const order = getMatchOrder(match);
  if (!order) return [];

  return [
    `${previousRound}-${(order - 1) * 2 + 1}`,
    `${previousRound}-${(order - 1) * 2 + 2}`,
  ];
};

const centerY = (position) => position.y + BRACKET_CARD_HEIGHT / 2;

export function buildConnectorSegments(matches, positions) {
  const matchesById = new Map((Array.isArray(matches) ? matches : []).map((match) => [match.id, match]));
  const connectors = [];

  (Array.isArray(matches) ? matches : []).forEach((match) => {
    if (!match?.nextMatchId) return;
    if (!positions[match.id] || !positions[match.nextMatchId]) return;

    connectors.push({
      from: match.id,
      to: match.nextMatchId,
      active: match.status === "completed",
    });
  });

  const grandFinal = matchesById.get("GF-1");
  if (positions["GF-1"] && positions.CHAMPION) {
    connectors.push({
      from: "GF-1",
      to: "CHAMPION",
      active: grandFinal?.status === "completed",
    });
  }

  return connectors;
}

export function getCanvasSize(bracketSize, rounds, positions) {
  const championX = getColumnX(rounds.length);
  const maxBottom = Math.max(
    FIRST_MATCH_TOP + BRACKET_CARD_HEIGHT,
    ...Object.values(positions).map((position) => position.y + BRACKET_CARD_HEIGHT)
  );

  return {
    width: championX + BRACKET_CHAMPION_WIDTH + CANVAS_PADDING_X,
    height: Math.max(MIN_CANVAS_HEIGHT[bracketSize] || MIN_CANVAS_HEIGHT[16], maxBottom + CANVAS_PADDING_Y),
  };
}

const getLogoPosition = (canvasWidth, canvasHeight) => {
  const width = Math.min(500, Math.max(240, Math.round(canvasWidth * 0.26)));

  return {
    left: Math.max(CANVAS_PADDING_X, canvasWidth - width - CANVAS_PADDING_X),
    top: Math.max(FIRST_MATCH_TOP, Math.round(canvasHeight / 2 - width * 0.34)),
    width,
  };
};

export function buildBracketLayout(matches, bracketSize) {
  const safeSize = normalizeBracketSize(bracketSize) || inferBracketSize(matches) || 16;
  const rounds = getRoundsForBracketSize(safeSize);
  const positions = {};

  rounds.forEach((round, roundIndex) => {
    const roundMatches = getRoundMatches(matches, round);
    const x = getColumnX(roundIndex);

    if (roundIndex === 0) {
      roundMatches.forEach((match, matchIndex) => {
        positions[match.id] = {
          x,
          y: FIRST_MATCH_TOP + matchIndex * (BRACKET_CARD_HEIGHT + FIRST_ROUND_GAP),
        };
      });
      return;
    }

    const previousRound = rounds[roundIndex - 1];
    roundMatches.forEach((match, matchIndex) => {
      const parentPositions = getParentMatchIds(match, previousRound)
        .map((matchId) => positions[matchId])
        .filter(Boolean);
      const fallbackY = FIRST_MATCH_TOP + matchIndex * (BRACKET_CARD_HEIGHT + FIRST_ROUND_GAP);
      const y = parentPositions.length
        ? Math.round(
            parentPositions.reduce((total, position) => total + centerY(position), 0) / parentPositions.length
            - BRACKET_CARD_HEIGHT / 2
          )
        : fallbackY;

      positions[match.id] = { x, y };
    });
  });

  const championX = getColumnX(rounds.length);
  const grandFinalPosition = positions["GF-1"];
  positions.CHAMPION = {
    x: championX,
    y: grandFinalPosition?.y ?? FIRST_MATCH_TOP,
  };

  const canvas = getCanvasSize(safeSize, rounds, positions);
  const roundMeta = [
    ...rounds.map((round, roundIndex) => {
      const count = getRoundMatches(matches, round).length;

      return {
        key: round,
        title: ROUND_TITLES[round],
        subtitle: `${count} ${count === 1 ? "Match" : "Matches"}`,
        x: getColumnX(roundIndex),
        top: HEADER_TOP,
        width: BRACKET_CARD_WIDTH,
      };
    }),
    {
      key: "CHAMPION",
      title: ROUND_TITLES.CHAMPION,
      subtitle: "Winner",
      x: championX,
      top: HEADER_TOP,
      width: BRACKET_CHAMPION_WIDTH,
    },
  ];

  return {
    bracketSize: safeSize,
    rounds,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    positions,
    roundMeta,
    connectors: buildConnectorSegments(matches, positions),
    logo: getLogoPosition(canvas.width, canvas.height),
  };
}

export function getPositionStyle(position) {
  if (!position) return undefined;
  return {
    left: position.x,
    top: position.y,
  };
}
