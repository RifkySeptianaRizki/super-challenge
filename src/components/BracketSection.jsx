import { useMemo, useState } from "react";
import useTournamentStore from "../store/useTournamentStore";
import { getChampion, validateBracketSchema } from "../lib/bracketEngine";

const EMPTY_BRACKET = [];
const CARD_WIDTH = 236;
const CARD_HEIGHT = 108;
const CHAMPION_WIDTH = 220;
const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 960;

const ROUND_META = [
  { key: "R16", title: "ROUND OF 16", subtitle: "8 Matches", x: 24 },
  { key: "QF", title: "QUARTER FINAL", subtitle: "4 Matches", x: 310 },
  { key: "SF", title: "SEMI FINAL", subtitle: "2 Matches", x: 596 },
  { key: "GF", title: "GRAND FINAL", subtitle: "1 Match", x: 882 },
  { key: "CHAMPION", title: "CHAMPION", subtitle: "Winner", x: 1156 },
];

const POSITIONS = {
  "R16-1": { x: 24, y: 92 },
  "R16-2": { x: 24, y: 196 },
  "R16-3": { x: 24, y: 300 },
  "R16-4": { x: 24, y: 404 },
  "R16-5": { x: 24, y: 508 },
  "R16-6": { x: 24, y: 612 },
  "R16-7": { x: 24, y: 716 },
  "R16-8": { x: 24, y: 820 },
  "QF-1": { x: 310, y: 144 },
  "QF-2": { x: 310, y: 352 },
  "QF-3": { x: 310, y: 560 },
  "QF-4": { x: 310, y: 768 },
  "SF-1": { x: 596, y: 248 },
  "SF-2": { x: 596, y: 664 },
  "GF-1": { x: 882, y: 456 },
  CHAMPION: { x: 1156, y: 456 },
};

const CONNECTORS = [
  ["R16-1", "QF-1"],
  ["R16-2", "QF-1"],
  ["R16-3", "QF-2"],
  ["R16-4", "QF-2"],
  ["R16-5", "QF-3"],
  ["R16-6", "QF-3"],
  ["R16-7", "QF-4"],
  ["R16-8", "QF-4"],
  ["QF-1", "SF-1"],
  ["QF-2", "SF-1"],
  ["QF-3", "SF-2"],
  ["QF-4", "SF-2"],
  ["SF-1", "GF-1"],
  ["SF-2", "GF-1"],
  ["GF-1", "CHAMPION"],
];

const STATUS_LABEL = {
  empty: "Waiting",
  upcoming: "Upcoming",
  live: "Live",
  completed: "Completed",
};

const statusClass = (status) => {
  if (status === "completed") return "border-[#F2D98D]/60 bg-[#F2D98D]/12 text-[#F2D98D]";
  if (status === "live") return "border-[#F22738]/70 bg-[#F22738]/15 text-white";
  if (status === "upcoming") return "border-white/15 bg-white/10 text-white/80";
  return "border-white/10 bg-black/30 text-white/45";
};

const getInitials = (value) => {
  const text = String(value || "?").trim();
  if (!text) return "?";
  return text.slice(0, 2).toUpperCase();
};

function TeamLogo({ team, code }) {
  const [failed, setFailed] = useState(false);
  const logo = team?.logo;
  if (!logo || failed) {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#F2D98D]/25 bg-[#260505] text-[10px] font-black text-[#F2D98D]">
        {getInitials(code)}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={team?.code || code || "Team"}
      className="h-7 w-7 shrink-0 rounded-full bg-white object-contain p-0.5"
      onError={() => setFailed(true)}
    />
  );
}

function MatchCard({ match, teamsById, style }) {
  const getTeam = (teamId) => teamsById.get(teamId) || null;
  const getDisplayTeam = (teamId) => {
    const team = getTeam(teamId);
    if (!teamId) return { code: "TBA", name: "TBA", team: null };
    if (!team) return { code: "UNKNOWN", name: "Unknown Team", team: null };
    return { code: team.code || "UNKNOWN", name: team.name || team.fullName || team.code, team };
  };
  const isWinner = (slot, teamId) => (
    match.status === "completed" && teamId && match.winnerTeamId === teamId
  );

  const renderTeam = (slot) => {
    const teamId = slot === "A" ? match.teamAId : match.teamBId;
    const score = slot === "A" ? match.scoreA : match.scoreB;
    const seed = slot === "A" ? match.teamASeed : match.teamBSeed;
    const display = getDisplayTeam(teamId);
    const winner = isWinner(slot, teamId);
    const isTba = !teamId;

    return (
      <div
        className={[
          "flex h-9 min-w-0 items-center gap-2 border-l-2 px-2 transition-colors",
          winner
            ? "border-[#F2D98D] bg-[#731414]/80 text-white"
            : "border-transparent bg-black/22 text-white/78",
          isTba ? "text-white/45" : "",
        ].join(" ")}
      >
        <TeamLogo team={display.team} code={display.code} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[13px] font-black uppercase leading-none" title={display.name}>
              {display.code}
            </span>
            {winner && (
              <span className="rounded-sm bg-[#F2D98D] px-1.5 py-0.5 text-[9px] font-black uppercase text-[#260505]">
                WIN
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">
            {seed ? `Seed ${seed}` : isTba ? "Waiting" : "Seed TBA"}
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
          {isTba ? "-" : score}
        </div>
      </div>
    );
  };

  return (
    <article
      className={[
        "absolute z-10 overflow-hidden rounded-xl border bg-[#260505]/92 shadow-2xl backdrop-blur transition duration-200 hover:-translate-y-0.5",
        match.status === "live"
          ? "border-[#F22738]/70 shadow-[#F22738]/15"
          : match.status === "completed"
            ? "border-[#F2D98D]/35 shadow-black/40"
            : "border-[#731414]/55 shadow-black/35",
      ].join(" ")}
      style={{ ...style, width: CARD_WIDTH, minHeight: CARD_HEIGHT }}
    >
      <header className="flex h-8 items-center justify-between border-b border-white/10 bg-black/35 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wide text-[#F2D98D]">
            {match.id}
          </span>
          <span className="rounded-sm border border-[#F22738]/35 bg-[#400C0C] px-1.5 py-0.5 text-[10px] font-black text-white/70">
            BO3
          </span>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${statusClass(match.status)}`}>
          {STATUS_LABEL[match.status] || "Waiting"}
        </span>
      </header>
      <div className="space-y-px p-1.5">
        {renderTeam("A")}
        {renderTeam("B")}
      </div>
      {(match.date || match.time) && (
        <footer className="border-t border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">
          {[match.date, match.time].filter(Boolean).join(" • ")}
        </footer>
      )}
    </article>
  );
}

function ChampionCard({ championId, teamsById }) {
  const team = championId ? teamsById.get(championId) : null;
  const code = team?.code || (championId ? "UNKNOWN" : "TBA");
  const name = team?.name || team?.fullName || (championId ? "Unknown Team" : "Complete Grand Final to reveal champion");

  return (
    <article
      className={[
        "absolute z-10 flex min-h-[108px] flex-col justify-between overflow-hidden rounded-2xl border p-4 shadow-2xl",
        championId
          ? "border-[#F2D98D]/70 bg-gradient-to-br from-[#731414] via-[#400C0C] to-black shadow-[#F2D98D]/10"
          : "border-[#731414]/55 bg-[#260505]/85",
      ].join(" ")}
      style={{ left: POSITIONS.CHAMPION.x, top: POSITIONS.CHAMPION.y, width: CHAMPION_WIDTH }}
    >
      <div className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F2D98D]/75">
        {championId ? "SUPER CHALLENGE CHAMPION" : "Champion TBA"}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <TeamLogo team={team} code={code} />
        <div className="min-w-0">
          <div className="truncate text-2xl font-black uppercase leading-none text-white" title={name}>
            {code}
          </div>
          <div className="mt-1 truncate text-xs font-semibold uppercase tracking-wide text-white/55" title={name}>
            {name}
          </div>
        </div>
      </div>
      <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-[#F22738] via-[#F2D98D] to-transparent" />
    </article>
  );
}

function Connector({ from, to, active }) {
  const start = POSITIONS[from];
  const end = POSITIONS[to];
  if (!start || !end) return null;

  const startX = start.x + CARD_WIDTH;
  const startY = start.y + CARD_HEIGHT / 2;
  const endX = end.x;
  const endY = end.y + CARD_HEIGHT / 2;
  const middleX = startX + (endX - startX) / 2;
  const path = `M ${startX} ${startY} H ${middleX} V ${endY} H ${endX}`;

  return (
    <path
      d={path}
      fill="none"
      stroke={active ? "rgba(242,39,56,0.82)" : "rgba(242,217,141,0.25)"}
      strokeWidth={active ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export default function BracketSection() {
  const { bracket = [], teams = [], tournamentConfig = {} } = useTournamentStore();

  const validation = useMemo(() => validateBracketSchema(bracket), [bracket]);
  const safeBracket = useMemo(() => validation.value || EMPTY_BRACKET, [validation]);
  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const matchesById = useMemo(() => new Map(safeBracket.map((match) => [match.id, match])), [safeBracket]);
  const championId = useMemo(() => getChampion(safeBracket), [safeBracket]);

  if (!safeBracket.length) {
    return (
      <section className="relative min-h-screen overflow-hidden bg-[#260505] py-24 text-white">
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="font-bebas text-5xl font-extrabold uppercase italic tracking-normal text-[#F2D98D] md:text-7xl">
            Playoff Bracket
          </h2>
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-[#731414]/60 bg-black/30 p-8">
            <div className="text-xl font-black uppercase">Bracket belum dibuat</div>
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

      <div className="container relative z-10 mx-auto px-4">
        <div className="mb-10 text-center">
          <div className="text-xs font-black uppercase tracking-[0.36em] text-[#F22738]">
            {tournamentConfig.seriesType || "BO3"} • 16 Team Single Elimination
          </div>
          <h2 className="mt-3 font-bebas text-5xl font-extrabold uppercase italic tracking-normal text-transparent bg-clip-text bg-gradient-to-r from-[#F2D98D] via-white to-[#F2D98D] drop-shadow-lg md:text-7xl">
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
            className="relative mx-auto rounded-2xl border border-[#731414]/55 bg-[#400C0C]/42 shadow-2xl backdrop-blur-sm"
            style={{ minWidth: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          >
            <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:82px_82px] opacity-25" />

            {ROUND_META.map((round) => (
              <div key={round.key} className="absolute z-10" style={{ left: round.x, top: 28, width: round.key === "CHAMPION" ? CHAMPION_WIDTH : CARD_WIDTH }}>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-[#F2D98D]">
                  {round.title}
                </div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/38">
                  {round.subtitle}
                </div>
              </div>
            ))}

            <svg
              className="absolute inset-0 z-0 h-full w-full"
              viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {CONNECTORS.map(([from, to]) => {
                const source = matchesById.get(from);
                return (
                  <Connector
                    key={`${from}-${to}`}
                    from={from}
                    to={to}
                    active={source?.status === "completed"}
                  />
                );
              })}
            </svg>

            {safeBracket.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                teamsById={teamsById}
                style={{ left: POSITIONS[match.id]?.x, top: POSITIONS[match.id]?.y }}
              />
            ))}

            <ChampionCard championId={championId} teamsById={teamsById} />
          </div>
        </div>
      </div>
    </section>
  );
}
