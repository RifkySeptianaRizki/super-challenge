import { useMemo } from "react";
import useTournamentStore from "../store/useTournamentStore";
import {
  getChampion,
  getRoundStructure,
  getVisibleMatches,
  isAutoAdvanceMatch,
  validateBracketSchema,
} from "../lib/bracketEngine";
import TeamLogo from "./TeamLogo";

const EMPTY_BRACKET = [];

const CARD_WIDTH = 252;
const CARD_HEIGHT = 116;
const CHAMPION_WIDTH = 250;

const CANVAS_TOP = 150;
const COLUMN_GAP = 350;
const CANVAS_PADDING_X = 32;

// Ganti ke "/super-ml-logo.png" kalau yang dimaksud logo utama turnamen
const MAIN_LOGO_SRC = "/superchallange-lanjang.png";

const ROUND_TITLES = {
  R16: ["ROUND OF 16", "8 Matches"],
  QF: ["QUARTER FINAL", "4 Matches"],
  SF: ["SEMI FINAL", "2 Matches"],
  GF: ["GRAND FINAL", "1 Match"],
  CHAMPION: ["CHAMPION", "Winner"],
};

const STATUS_LABEL = {
  empty: "Waiting",
  upcoming: "Upcoming",
  live: "Live",
  completed: "Completed",
  auto: "Auto Advance",
};

const statusClass = (status) => {
  if (status === "completed") {
    return "border-[#F2D98D]/60 bg-[#F2D98D]/10 text-[#F2D98D]";
  }

  if (status === "live") {
    return "border-[#F22738]/70 bg-[#F22738]/15 text-white";
  }

  if (status === "upcoming") {
    return "border-white/15 bg-white/10 text-white/80";
  }

  if (status === "auto") {
    return "border-[#F2D98D]/35 bg-[#F2D98D]/10 text-[#F2D98D]";
  }

  return "border-white/10 bg-black/30 text-white/45";
};

function buildBracketLayout(matches, bracketSize) {
  const roundKeys = getRoundStructure(bracketSize)
    .map((definition) => definition.round)
    .filter((round, index, list) => list.indexOf(round) === index);
  const columns = [...roundKeys, "CHAMPION"];
  const firstRoundCount = Math.max(1, matches.filter((match) => match.round === roundKeys[0]).length);
  const canvasHeight = Math.max(520, CANVAS_TOP + firstRoundCount * 132 + 80);
  const canvasWidth = CANVAS_PADDING_X * 2 + (columns.length - 1) * COLUMN_GAP + CHAMPION_WIDTH;
  const positions = {};

  columns.forEach((column, columnIndex) => {
    const x = CANVAS_PADDING_X + columnIndex * COLUMN_GAP;
    if (column === "CHAMPION") {
      positions.CHAMPION = {
        x,
        y: Math.round(canvasHeight / 2 - CARD_HEIGHT / 2),
      };
      return;
    }

    const roundMatches = matches
      .filter((match) => match.round === column)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const available = Math.max(CARD_HEIGHT, canvasHeight - CANVAS_TOP - 80);
    roundMatches.forEach((match, index) => {
      const y = CANVAS_TOP + Math.round(((index + 0.5) * available) / roundMatches.length - CARD_HEIGHT / 2);
      positions[match.id] = { x, y };
    });
  });

  const roundMeta = columns.map((column, columnIndex) => {
    const [title, fallbackSubtitle] = ROUND_TITLES[column];
    const count = column === "CHAMPION" ? 1 : matches.filter((match) => match.round === column).length;
    return {
      key: column,
      title,
      subtitle: column === "CHAMPION" ? fallbackSubtitle : `${count} ${count === 1 ? "Match" : "Matches"}`,
      x: CANVAS_PADDING_X + columnIndex * COLUMN_GAP,
    };
  });

  const connectors = matches
    .filter((match) => match.nextMatchId)
    .map((match) => [match.id, match.nextMatchId]);
  connectors.push(["GF-1", "CHAMPION"]);

  return { canvasWidth, canvasHeight, positions, roundMeta, connectors };
}

function MatchCard({ match, teamsById, style }) {
  const getTeam = (teamId) => teamsById.get(teamId) || null;

  const getDisplayTeam = (teamId) => {
    const team = getTeam(teamId);

    if (!teamId) {
      return {
        code: "TBA",
        name: "TBA",
        team: null,
      };
    }

    if (!team) {
      return {
        code: "UNKNOWN",
        name: "Unknown Team",
        team: null,
      };
    }

    return {
      code: team.code || "UNKNOWN",
      name: team.name || team.fullName || team.code,
      team,
    };
  };

  const isWinner = (teamId) => {
    return (
      match.status === "completed" &&
      teamId &&
      match.winnerTeamId === teamId
    );
  };

  const renderTeam = (slot) => {
    const teamId = slot === "A" ? match.teamAId : match.teamBId;
    const score = slot === "A" ? match.scoreA : match.scoreB;
    const seed = slot === "A" ? match.teamASeed : match.teamBSeed;
    const isBye = slot === "A" ? match.teamAIsBye || match.slotAType === "bye" : match.teamBIsBye || match.slotBType === "bye";

    const display = getDisplayTeam(teamId);
    const winner = isWinner(teamId);
    const isTba = !teamId && !isBye;

    return (
      <div
        className={[
          "flex h-9 min-w-0 items-center gap-2 rounded-md border-l-2 px-2 transition-colors",
          winner
            ? "border-[#F2D98D] bg-[#731414]/80 text-white"
            : "border-transparent bg-black/25 text-white/78",
          isTba || isBye ? "text-white/45" : "",
        ].join(" ")}
      >
        {isBye ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#F2D98D]/25 bg-[#F2D98D]/10 text-[9px] font-black text-[#F2D98D]">
            BYE
          </div>
        ) : (
          <TeamLogo team={display.team} code={display.code} name={display.name} size={28} />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className="truncate text-[13px] font-black uppercase leading-none"
              title={display.name}
            >
              {isBye ? "BYE" : display.code}
            </span>

            {winner && (
              <span className="rounded-sm bg-[#F2D98D] px-1.5 py-0.5 text-[9px] font-black uppercase text-[#260505]">
                WIN
              </span>
            )}
          </div>

          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">
            {isBye ? "Auto advance slot" : seed ? `Seed ${seed}` : isTba ? "Waiting" : "Seed TBA"}
          </div>
        </div>

        <div
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-lg font-black leading-none",
            winner
              ? "border-[#F2D98D]/70 bg-[#F2D98D] text-[#260505]"
              : "border-white/10 bg-black/35 text-white/65",
          ].join(" ")}
        >
          {isTba || isBye ? "-" : score}
        </div>
      </div>
    );
  };

  return (
    <article
      className={[
        "absolute z-10 overflow-hidden rounded-xl border bg-[#260505]/95 shadow-2xl backdrop-blur transition duration-200 hover:-translate-y-0.5",
        isAutoAdvanceMatch(match)
          ? "border-[#F2D98D]/45 shadow-[#F2D98D]/10"
          : match.status === "live"
          ? "border-[#F22738]/70 shadow-[#F22738]/20"
          : match.status === "completed"
            ? "border-[#F2D98D]/40 shadow-black/45"
            : "border-[#731414]/55 shadow-black/35",
      ].join(" ")}
      style={{
        ...style,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      }}
    >
      <header className="flex h-8 items-center justify-between border-b border-white/10 bg-black/35 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wide text-[#F2D98D]">
          {match.id}
          </span>

          <span className="rounded-sm border border-[#F22738]/35 bg-[#400C0C] px-1.5 py-0.5 text-[10px] font-black text-white/70">
            BO{match.bestOf || 3}
          </span>
        </div>

        <span
          className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${statusClass(
            isAutoAdvanceMatch(match) ? "auto" : match.status
          )}`}
        >
          {isAutoAdvanceMatch(match) ? STATUS_LABEL.auto : STATUS_LABEL[match.status] || "Waiting"}
        </span>
      </header>

      <div className="space-y-1 p-2">
        {renderTeam("A")}
        {renderTeam("B")}
      </div>
    </article>
  );
}

function ChampionCard({ championId, teamsById, style }) {
  const team = championId ? teamsById.get(championId) : null;
  const code = team?.code || (championId ? "UNKNOWN" : "TBA");

  const name =
    team?.name ||
    team?.fullName ||
    (championId ? "Unknown Team" : "Complete Grand Final to reveal champion");

  return (
    <article
      className={[
        "absolute z-10 flex min-h-[116px] flex-col justify-between overflow-hidden rounded-2xl border p-4 shadow-2xl",
        championId
          ? "border-[#F2D98D]/70 bg-gradient-to-br from-[#731414] via-[#400C0C] to-black shadow-[#F2D98D]/10"
          : "border-[#731414]/55 bg-[#260505]/90",
      ].join(" ")}
      style={{
        ...style,
        width: CHAMPION_WIDTH,
        height: CARD_HEIGHT,
      }}
    >
      <div className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F2D98D]/75">
        {championId ? "SUPER CHALLENGE CHAMPION" : "Champion TBA"}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <TeamLogo team={team} code={code} name={name} size="lg" variant={championId ? "winner" : "default"} />

        <div className="min-w-0">
          <div
            className="truncate text-2xl font-black uppercase leading-none text-white"
            title={name}
          >
            {code}
          </div>

          <div
            className="mt-1 truncate text-xs font-semibold uppercase tracking-wide text-white/55"
            title={name}
          >
            {name}
          </div>
        </div>
      </div>

      <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-[#F22738] via-[#F2D98D] to-transparent" />
    </article>
  );
}

function Connector({ from, to, active, positions }) {
  const start = positions[from];
  const end = positions[to];

  if (!start || !end) return null;

  const startX =
    from === "CHAMPION" ? start.x + CHAMPION_WIDTH : start.x + CARD_WIDTH;

  const startY = start.y + CARD_HEIGHT / 2;
  const endX = end.x;
  const endY = end.y + CARD_HEIGHT / 2;

  const middleX = startX + (endX - startX) / 2;
  const path = `M ${startX} ${startY} H ${middleX} V ${endY} H ${endX}`;

  return (
    <path
      d={path}
      fill="none"
      stroke={active ? "rgba(242,39,56,0.86)" : "rgba(242,217,141,0.24)"}
      strokeWidth={active ? 2.3 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export default function BracketSection() {
  const {
    bracket = [],
    teams = [],
    tournamentConfig = {},
  } = useTournamentStore();

  const validation = useMemo(() => validateBracketSchema(bracket), [bracket]);

  const safeBracket = useMemo(
    () => validation.value || EMPTY_BRACKET,
    [validation]
  );

  const bracketSize = tournamentConfig.bracketSize
    || tournamentConfig.bracket_size
    || safeBracket.find((match) => match.bracketSize)?.bracketSize
    || 16;

  const visibleMatches = useMemo(
    () => getVisibleMatches(safeBracket, bracketSize),
    [safeBracket, bracketSize]
  );

  const layout = useMemo(
    () => buildBracketLayout(visibleMatches, bracketSize),
    [visibleMatches, bracketSize]
  );

  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams]
  );

  const matchesById = useMemo(
    () => new Map(visibleMatches.map((match) => [match.id, match])),
    [visibleMatches]
  );

  const championId = useMemo(() => getChampion(safeBracket), [safeBracket]);

  if (!visibleMatches.length) {
    return (
      <section className="relative min-h-screen overflow-hidden bg-[#260505] py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(242,39,56,0.18),transparent_32%),linear-gradient(180deg,rgba(0,0,0,0.35),rgba(0,0,0,0.78))]" />

        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="font-bebas text-5xl font-extrabold uppercase italic tracking-normal text-[#F2D98D] md:text-7xl">
            Playoff Bracket
          </h2>

          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-[#731414]/60 bg-black/30 p-8">
            <div className="text-xl font-black uppercase">
              Bracket belum dibuat
            </div>

            <p className="mt-2 text-sm text-white/55">
              Silakan generate bracket dari Admin Panel.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#260505] py-24 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(242,39,56,0.18),transparent_32%),linear-gradient(180deg,rgba(0,0,0,0.35),rgba(0,0,0,0.78))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F2D98D]/40 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-[112rem] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="text-xs font-black uppercase tracking-[0.36em] text-[#F22738]">
            {tournamentConfig.seriesType || "BO3"} • {tournamentConfig.participantCount || tournamentConfig.participant_count || 16} Team Flexible Single Elimination
          </div>

          <h2 className="mt-3 bg-gradient-to-r from-[#F2D98D] via-white to-[#F2D98D] bg-clip-text font-bebas text-5xl font-extrabold uppercase italic tracking-normal text-transparent drop-shadow-lg md:text-7xl">
            Playoff Bracket
          </h2>

          <div className="mx-auto mt-5 h-1 w-24 rounded-full bg-[#F22738] shadow-[0_0_16px_rgba(242,39,56,0.55)]" />

          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-white/45 md:hidden">
            Geser untuk melihat bracket lengkap
          </p>
        </div>

        {!validation.valid && (
          <div className="mx-auto mb-6 max-w-3xl rounded-xl border border-[#F2D98D]/25 bg-black/35 px-4 py-3 text-sm text-[#F2D98D]">
            Bracket data diperbaiki otomatis dari state yang tersimpan.
          </div>
        )}

        <div className="w-full overflow-x-auto overflow-y-visible pb-12">
          <div
            className="relative mx-auto overflow-hidden rounded-3xl border border-[#731414]/60 bg-[#400C0C]/42 shadow-2xl backdrop-blur-sm"
            style={{
              minWidth: layout.canvasWidth,
              height: layout.canvasHeight,
            }}
          >
            {/* Background grid */}
            <div className="absolute inset-0 rounded-3xl bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:82px_82px] opacity-25" />

            {/* Big Super logo in empty bracket area */}
            <div
              className="absolute z-[6] pointer-events-none"
              style={{
                left: 1130,
                top: Math.max(210, layout.canvasHeight / 2 - 180),
                width: Math.min(510, Math.max(280, layout.canvasWidth * 0.3)),
              }}
            >
              <div className="absolute inset-0 scale-110 rounded-full bg-[#F22738]/10 blur-3xl" />

              <img
                src={MAIN_LOGO_SRC}
                alt="Super Challenge"
                className="relative w-full object-contain opacity-35 drop-shadow-[0_18px_35px_rgba(0,0,0,0.75)]"
              />
            </div>

            {/* Round headers */}
            {layout.roundMeta.map((round) => (
              <div
                key={round.key}
                className="absolute z-10"
                style={{
                  left: round.x,
                  top: 95,
                  width:
                    round.key === "CHAMPION" ? CHAMPION_WIDTH : CARD_WIDTH,
                }}
              >
                <div className="text-xs font-black uppercase tracking-[0.24em] text-[#F2D98D]">
                  {round.title}
                </div>

                <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/38">
                  {round.subtitle}
                </div>
              </div>
            ))}

            {/* Connector lines */}
            <svg
              className="absolute inset-0 z-0 h-full w-full"
              viewBox={`0 0 ${layout.canvasWidth} ${layout.canvasHeight}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {layout.connectors.map(([from, to]) => {
                const source = matchesById.get(from);

                return (
                  <Connector
                    key={`${from}-${to}`}
                    from={from}
                    to={to}
                    active={source?.status === "completed"}
                    positions={layout.positions}
                  />
                );
              })}
            </svg>

            {/* Match cards */}
            {visibleMatches.map((match) => {
              const position = layout.positions[match.id];

              if (!position) return null;

              return (
                <MatchCard
                  key={match.id}
                  match={match}
                  teamsById={teamsById}
                  style={{
                    left: position.x,
                    top: position.y,
                  }}
                />
              );
            })}

            {/* Champion card */}
            <ChampionCard championId={championId} teamsById={teamsById} style={layout.positions.CHAMPION} />
          </div>
        </div>
      </div>
    </section>
  );
}
