import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  DatabaseBackup,
  Download,
  Eye,
  FileJson,
  Home,
  LayoutDashboard,
  Save,
  Settings as SettingsIcon,
  ShieldAlert,
  Swords,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import useTournamentStore from "../store/useTournamentStore";
import {
  SEED_PAIRINGS,
  getChampion,
  sanitizeTeamCode,
  sanitizeText,
  validateBracketSchema,
} from "../lib/bracketEngine";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "seeding", label: "Teams & Seeding", icon: Users },
  { id: "bracket", label: "Bracket Control", icon: Swords },
  { id: "schedule", label: "Schedule", icon: CalendarDays },
  { id: "standings", label: "Standings", icon: Trophy },
  { id: "backup", label: "Backup / Import / Export", icon: DatabaseBackup },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const roundLabels = {
  R16: "Round of 16",
  QF: "Quarter Final",
  SF: "Semi Final",
  GF: "Grand Final",
};

const scoreOptions = [0, 1, 2];

const cardClass = "rounded-2xl border border-white/10 bg-[#140404] shadow-xl shadow-black/20";

function SectionHeader({ title, description, action }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#140404] p-5 shadow-xl shadow-black/20 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-wide text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-white/45">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function StatusBadge({ status }) {
  const label = status === "empty" ? "Waiting" : status;
  const tone = {
    completed: "border-[#F2D98D]/40 bg-[#F2D98D]/10 text-[#F2D98D]",
    live: "border-[#F22738]/50 bg-[#F22738]/15 text-white",
    upcoming: "border-white/15 bg-white/10 text-white/70",
    empty: "border-white/10 bg-black/30 text-white/40",
  }[status] || "border-white/10 bg-white/5 text-white/50";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${tone}`}>
      {label}
    </span>
  );
}

function TeamPill({ teamId, seed, teamsById, muted = false }) {
  const team = teamId ? teamsById.get(teamId) : null;
  const code = team?.code || (teamId ? "UNKNOWN" : "TBA");
  const name = team?.name || team?.fullName || (teamId ? "Unknown Team" : "Waiting");

  return (
    <div className={`min-w-0 rounded-lg border px-3 py-2 ${muted ? "border-white/10 bg-black/25 text-white/45" : "border-white/10 bg-black/30 text-white"}`}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="truncate text-sm font-black uppercase" title={name}>{code}</span>
        {seed && <span className="shrink-0 text-[10px] font-bold text-[#F2D98D]/75">S{seed}</span>}
      </div>
      <div className="mt-0.5 truncate text-[11px] text-white/38" title={name}>{name}</div>
    </div>
  );
}

function MiniBracketPreview({ bracket, teamsById }) {
  const rounds = ["R16", "QF", "SF", "GF"];
  const championId = getChampion(bracket);
  const champion = championId ? teamsById.get(championId) : null;

  return (
    <div className={`${cardClass} p-4`}>
      <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white">
        <Eye size={16} className="text-[#F2D98D]" />
        Mini Bracket Preview
      </div>
      <div className="grid min-w-[760px] grid-cols-5 gap-3 overflow-x-auto">
        {rounds.map((round) => (
          <div key={round} className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#F2D98D]">{roundLabels[round]}</div>
            {bracket.filter((match) => match.round === round).map((match) => (
              <div key={match.id} className="rounded-lg border border-white/10 bg-black/25 p-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-black text-white/45">{match.id}</span>
                  <StatusBadge status={match.status} />
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-bold text-white/75">{teamsById.get(match.teamAId)?.code || "TBA"}</span>
                  <span className="font-black text-[#F2D98D]">{match.teamAId ? match.scoreA : "-"}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-bold text-white/75">{teamsById.get(match.teamBId)?.code || "TBA"}</span>
                  <span className="font-black text-[#F2D98D]">{match.teamBId ? match.scoreB : "-"}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-[#F2D98D]">Champion</div>
          <div className="rounded-xl border border-[#F2D98D]/25 bg-[#400C0C] p-3">
            <div className="text-xl font-black uppercase text-white">{champion?.code || "TBA"}</div>
            <div className="mt-1 text-xs text-white/45">{champion?.name || "Complete GF-1"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const store = useTournamentStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [toast, setToast] = useState(null);
  const [seedIds, setSeedIds] = useState(null);
  const fileInputRef = useRef(null);

  const teamsById = useMemo(() => new Map(store.teams.map((team) => [team.id, team])), [store.teams]);
  const validation = useMemo(() => validateBracketSchema(store.bracket), [store.bracket]);
  const championId = useMemo(() => getChampion(store.bracket), [store.bracket]);
  const champion = championId ? teamsById.get(championId) : null;

  const currentSeeds = useMemo(() => {
    const seeds = Array(16).fill("");
    store.bracket
      .filter((match) => match.round === "R16")
      .forEach((match) => {
        if (match.teamASeed) seeds[match.teamASeed - 1] = match.teamAId || "";
        if (match.teamBSeed) seeds[match.teamBSeed - 1] = match.teamBId || "";
      });
    return seeds;
  }, [store.bracket]);

  const activeSeedIds = seedIds || currentSeeds;

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3200);
  };

  const runAction = (fn, successMessage) => {
    try {
      fn();
      showToast("success", successMessage);
    } catch (error) {
      showToast("error", error.message || "Action failed.");
    }
  };

  const exportData = () => {
    const data = store.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `superchallenge-data-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("success", "Data exported.");
  };

  const importData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      runAction(() => store.importData(readerEvent.target.result), "Data imported and validated.");
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const hasDependentResults = (matchId) => {
    const byId = new Map(store.bracket.map((match) => [match.id, match]));
    let cursor = byId.get(matchId)?.nextMatchId;
    while (cursor) {
      const match = byId.get(cursor);
      if (!match) return false;
      if (match.scoreA > 0 || match.scoreB > 0 || match.winnerTeamId) return true;
      cursor = match.nextMatchId;
    }
    return false;
  };

  const updateScore = (match, scoreA, scoreB) => {
    const willReset = hasDependentResults(match.id)
      && (match.scoreA !== scoreA || match.scoreB !== scoreB);
    if (willReset && !window.confirm("Mengubah hasil match ini akan mereset babak setelahnya. Lanjutkan?")) {
      return;
    }
    runAction(
      () => store.updateBracketMatchScore(match.id, scoreA, scoreB),
      `${match.id} updated.`
    );
  };

  const generateFromSeeds = () => {
    const selected = activeSeedIds.filter(Boolean);
    const unique = new Set(selected);
    if (selected.length !== 16) {
      throw new Error("Semua 16 seed harus dipilih sebelum generate bracket.");
    }
    if (unique.size !== selected.length) {
      throw new Error("Satu tim tidak boleh dipilih di lebih dari satu seed.");
    }
    store.setBracketSeeds(activeSeedIds.map((teamId, index) => ({
      seedNo: index + 1,
      teamId,
      teamCode: teamsById.get(teamId)?.code || "",
    })));
  };

  const Overview = () => {
    const completed = store.bracket.filter((match) => match.status === "completed").length;
    const live = store.bracket.filter((match) => match.status === "live").length;
    const waiting = store.bracket.filter((match) => match.status === "empty").length;

    return (
      <div className="space-y-6">
        <SectionHeader
          title="Tournament Overview"
          description="Status bracket 16 Team Single Elimination BO3 dan kondisi data lokal."
        />
        {!validation.valid && (
          <div className="flex gap-3 rounded-2xl border border-[#F2D98D]/25 bg-[#F2D98D]/8 p-4 text-[#F2D98D]">
            <ShieldAlert className="mt-0.5 shrink-0" size={20} />
            <div>
              <div className="font-black uppercase">Bracket warning</div>
              <div className="mt-1 text-sm text-[#F2D98D]/75">{validation.errors.join(" ")}</div>
            </div>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Teams", store.teams.length, "Registered teams"],
            ["Matches", store.bracket.length, "Total bracket matches"],
            ["Completed", completed, "Results locked by BO3"],
            ["Waiting", waiting + live, "Waiting or live matches"],
          ].map(([label, value, caption]) => (
            <div key={label} className={`${cardClass} p-5`}>
              <div className="text-xs font-black uppercase tracking-widest text-white/38">{label}</div>
              <div className="mt-3 text-4xl font-black text-white">{value}</div>
              <div className="mt-1 text-xs text-white/40">{caption}</div>
            </div>
          ))}
        </div>
        <div className={`${cardClass} p-5`}>
          <div className="text-xs font-black uppercase tracking-widest text-[#F2D98D]">Champion</div>
          <div className="mt-3 text-3xl font-black uppercase text-white">{champion?.code || "TBA"}</div>
          <div className="mt-1 text-sm text-white/45">{champion?.name || "Complete GF-1 to reveal champion."}</div>
        </div>
        <MiniBracketPreview bracket={store.bracket} teamsById={teamsById} />
      </div>
    );
  };

  const TeamsAndSeeding = () => {
    const selectedCounts = activeSeedIds.reduce((acc, teamId) => {
      if (teamId) acc[teamId] = (acc[teamId] || 0) + 1;
      return acc;
    }, {});
    const [teamsDraft, setTeamsDraft] = useState(store.teams);

    const saveTeams = () => {
      store.updateTeams(teamsDraft.map((team, index) => ({
        ...team,
        code: sanitizeTeamCode(team.code),
        name: sanitizeText(team.name, 60),
        fullName: sanitizeText(team.fullName || team.name, 80),
        rank: index + 1,
      })));
    };

    return (
      <div className="space-y-6">
        <SectionHeader
          title="Teams & Seeding"
          description="Atur 16 seed dengan dropdown. Bracket pairing mengikuti standar 1 vs 16, 8 vs 9, dan seterusnya."
          action={
            <div className="flex flex-wrap gap-2">
              <button onClick={() => runAction(generateFromSeeds, "Bracket generated from seed list.")} className="rounded-lg bg-[#F22738] px-4 py-2 text-sm font-black uppercase text-white">
                Generate Bracket
              </button>
              <button onClick={() => runAction(store.initializeBracketFromStandings, "Bracket generated from standings.")} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-black uppercase text-white/75 hover:bg-white/10">
                Generate From Standings
              </button>
              <button onClick={() => setSeedIds(Array(16).fill(""))} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-black uppercase text-white/55 hover:bg-white/10">
                Clear Seeds
              </button>
            </div>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className={`${cardClass} overflow-hidden`}>
            <div className="grid gap-px bg-white/5 sm:grid-cols-2">
              {Array.from({ length: 16 }, (_, index) => {
                const seedNo = index + 1;
                const teamId = activeSeedIds[index] || "";
                const duplicate = teamId && selectedCounts[teamId] > 1;
                return (
                  <label key={seedNo} className="block bg-[#140404] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-[#F2D98D]">Seed {seedNo}</span>
                      {duplicate && <span className="text-[10px] font-bold uppercase text-[#F22738]">Duplicate</span>}
                    </div>
                    <select
                      value={teamId}
                      onChange={(event) => {
                        const next = [...activeSeedIds];
                        next[index] = event.target.value;
                        setSeedIds(next);
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm font-bold text-white outline-none focus:border-[#F2D98D]"
                    >
                      <option value="">Select team</option>
                      {store.teams.map((team) => (
                        <option
                          key={team.id}
                          value={team.id}
                          disabled={Boolean(activeSeedIds.includes(team.id) && team.id !== teamId)}
                        >
                          {team.code} - {team.name}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
          </div>

          <div className={`${cardClass} p-4`}>
            <div className="text-sm font-black uppercase tracking-wide text-white">Pairing Preview</div>
            <div className="mt-4 space-y-2">
              {SEED_PAIRINGS.map((pairing) => {
                const teamA = teamsById.get(activeSeedIds[pairing.seedA - 1]);
                const teamB = teamsById.get(activeSeedIds[pairing.seedB - 1]);
                return (
                  <div key={pairing.id} className="rounded-lg border border-white/10 bg-black/25 p-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#F2D98D]">{pairing.id}</div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-sm font-bold text-white">
                      <span className="truncate">S{pairing.seedA} {teamA?.code || "TBA"}</span>
                      <span className="text-[#F22738]">VS</span>
                      <span className="truncate text-right">S{pairing.seedB} {teamB?.code || "TBA"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`${cardClass} p-5`}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-black uppercase tracking-wide text-white">Team Master Data</div>
              <div className="mt-1 text-xs text-white/40">Team code disanitasi uppercase, maksimal 12 karakter.</div>
            </div>
            <button onClick={() => runAction(saveTeams, "Teams saved.")} className="rounded-lg bg-[#F22738] px-4 py-2 text-sm font-black uppercase text-white">
              Save Teams
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {teamsDraft.map((team, index) => (
              <div key={team.id || index} className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 sm:grid-cols-[90px_1fr]">
                <input
                  value={team.code || ""}
                  onChange={(event) => {
                    const next = [...teamsDraft];
                    next[index] = { ...team, code: sanitizeTeamCode(event.target.value) };
                    setTeamsDraft(next);
                  }}
                  className="rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm font-black uppercase text-white outline-none focus:border-[#F2D98D]"
                />
                <input
                  value={team.name || ""}
                  onChange={(event) => {
                    const next = [...teamsDraft];
                    next[index] = { ...team, name: sanitizeText(event.target.value, 60) };
                    setTeamsDraft(next);
                  }}
                  className="rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-[#F2D98D]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const BracketControl = () => (
    <div className="space-y-6">
      <SectionHeader
        title="Bracket Control"
        description="Input hasil BO3 dengan score 0, 1, atau 2. Winner otomatis maju ke babak berikutnya."
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={() => runAction(store.resetBracketResults, "Bracket results cleared.")} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-black uppercase text-white/70 hover:bg-white/10">
              Reset Results
            </button>
            <button onClick={() => window.confirm("Reset seluruh bracket dari daftar team saat ini?") && runAction(store.resetBracketAll, "Bracket regenerated from teams.")} className="rounded-lg bg-[#F22738] px-4 py-2 text-sm font-black uppercase text-white">
              Reset Bracket All
            </button>
          </div>
        }
      />

      <MiniBracketPreview bracket={store.bracket} teamsById={teamsById} />

      {["R16", "QF", "SF", "GF"].map((round) => (
        <div key={round} className="space-y-3">
          <div className="text-sm font-black uppercase tracking-[0.22em] text-[#F2D98D]">{roundLabels[round]}</div>
          <div className="grid gap-4 xl:grid-cols-2">
            {store.bracket.filter((match) => match.round === round).map((match) => (
              <div key={match.id} className={`${cardClass} p-4`}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-black uppercase text-white">{match.id}</div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-white/38">BO3 • Winner advances {match.nextMatchId ? `to ${match.nextMatchId}` : "to champion"}</div>
                  </div>
                  <StatusBadge status={match.status} />
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_96px_1fr] md:items-center">
                  <TeamPill teamId={match.teamAId} seed={match.teamASeed} teamsById={teamsById} muted={!match.teamAId} />
                  <div className="flex items-center justify-center gap-2">
                    <select
                      value={match.scoreA}
                      onChange={(event) => updateScore(match, Number(event.target.value), match.scoreB)}
                      className="h-10 w-12 rounded-lg border border-white/10 bg-black/40 text-center font-black text-[#F2D98D] outline-none focus:border-[#F2D98D]"
                    >
                      {scoreOptions.map((score) => <option key={score} value={score}>{score}</option>)}
                    </select>
                    <span className="text-xs font-black text-[#F22738]">VS</span>
                    <select
                      value={match.scoreB}
                      onChange={(event) => updateScore(match, match.scoreA, Number(event.target.value))}
                      className="h-10 w-12 rounded-lg border border-white/10 bg-black/40 text-center font-black text-[#F2D98D] outline-none focus:border-[#F2D98D]"
                    >
                      {scoreOptions.map((score) => <option key={score} value={score}>{score}</option>)}
                    </select>
                  </div>
                  <TeamPill teamId={match.teamBId} seed={match.teamBSeed} teamsById={teamsById} muted={!match.teamBId} />
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-5">
                  {[
                    ["A 2-0", match.teamAId ? [2, 0] : null],
                    ["A 2-1", match.teamAId ? [2, 1] : null],
                    ["B 2-0", match.teamBId ? [0, 2] : null],
                    ["B 2-1", match.teamBId ? [1, 2] : null],
                    ["Clear", [0, 0]],
                  ].map(([label, scores]) => (
                    <button
                      key={label}
                      disabled={!scores}
                      onClick={() => scores && updateScore(match, scores[0], scores[1])}
                      className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-black uppercase text-white/65 transition hover:border-[#F2D98D]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <input
                    value={match.date || ""}
                    placeholder="Date"
                    onChange={(event) => store.updateBracketMatchMeta(match.id, { date: event.target.value })}
                    className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-[#F2D98D]"
                  />
                  <input
                    value={match.time || ""}
                    placeholder="Time"
                    onChange={(event) => store.updateBracketMatchMeta(match.id, { time: event.target.value })}
                    className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-[#F2D98D]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const ScheduleEditor = () => {
    const [matches, setMatches] = useState(store.matches);

    const save = () => store.updateMatches(matches);
    const addDay = () => setMatches([...matches, { id: `schedule-${Date.now()}`, week: matches.length + 1, date: "New Date", stage: "Regular Season", games: [] }]);
    const addGame = (dayIndex) => {
      const next = matches.map((day, index) => index === dayIndex
        ? { ...day, games: [...(day.games || []), { id: `match-${Date.now()}`, time: "12:00", teamA: "TBA", scoreA: 0, teamB: "TBA", scoreB: 0, status: "upcoming" }] }
        : day);
      setMatches(next);
    };

    return (
      <div className="space-y-6">
        <SectionHeader
          title="Schedule"
          description="Editor jadwal public tetap terpisah dari bracket tournament."
          action={
            <div className="flex gap-2">
              <button onClick={addDay} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-black uppercase text-white/70 hover:bg-white/10">Add Day</button>
              <button onClick={() => runAction(save, "Schedule saved.")} className="rounded-lg bg-[#F22738] px-4 py-2 text-sm font-black uppercase text-white">Save</button>
            </div>
          }
        />
        <div className="space-y-4">
          {matches.map((day, dayIndex) => (
            <div key={day.id || dayIndex} className={`${cardClass} p-4`}>
              <div className="grid gap-3 md:grid-cols-[1fr_180px_120px]">
                <input value={day.date || ""} onChange={(event) => {
                  const next = [...matches];
                  next[dayIndex] = { ...day, date: event.target.value };
                  setMatches(next);
                }} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-bold text-white outline-none focus:border-[#F2D98D]" />
                <input value={day.stage || ""} onChange={(event) => {
                  const next = [...matches];
                  next[dayIndex] = { ...day, stage: event.target.value };
                  setMatches(next);
                }} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#F2D98D]" />
                <button onClick={() => addGame(dayIndex)} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-black uppercase text-white/70">Add Match</button>
              </div>
              <div className="mt-4 space-y-2">
                {(day.games || []).map((game, gameIndex) => (
                  <div key={game.id || gameIndex} className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 md:grid-cols-[90px_1fr_70px_1fr_130px]">
                    <input value={game.time || ""} onChange={(event) => {
                      const next = [...matches];
                      next[dayIndex].games[gameIndex] = { ...game, time: event.target.value };
                      setMatches(next);
                    }} className="rounded-lg border border-white/10 bg-black/35 px-2 py-2 text-center text-white outline-none focus:border-[#F2D98D]" />
                    <input value={game.teamA || ""} onChange={(event) => {
                      const next = [...matches];
                      next[dayIndex].games[gameIndex] = { ...game, teamA: sanitizeTeamCode(event.target.value) };
                      setMatches(next);
                    }} className="rounded-lg border border-white/10 bg-black/35 px-3 py-2 font-bold text-white outline-none focus:border-[#F2D98D]" />
                    <div className="flex items-center justify-center text-xs font-black text-[#F22738]">VS</div>
                    <input value={game.teamB || ""} onChange={(event) => {
                      const next = [...matches];
                      next[dayIndex].games[gameIndex] = { ...game, teamB: sanitizeTeamCode(event.target.value) };
                      setMatches(next);
                    }} className="rounded-lg border border-white/10 bg-black/35 px-3 py-2 font-bold text-white outline-none focus:border-[#F2D98D]" />
                    <select value={game.status || "upcoming"} onChange={(event) => {
                      const next = [...matches];
                      next[dayIndex].games[gameIndex] = { ...game, status: event.target.value };
                      setMatches(next);
                    }} className="rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-white outline-none focus:border-[#F2D98D]">
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const StandingsEditor = () => {
    const [standings, setStandings] = useState(store.standings);

    const save = () => {
      const sorted = [...standings]
        .sort((a, b) => (b.matchPoint - a.matchPoint) || (b.netGameWin - a.netGameWin))
        .map((row, index) => ({ ...row, rank: index + 1, teamCode: sanitizeTeamCode(row.teamCode), team: sanitizeText(row.team, 60) }));
      store.updateStandings(sorted);
      setStandings(sorted);
    };

    return (
      <div className="space-y-6">
        <SectionHeader
          title="Standings"
          description="Standings dapat dipakai untuk generate seed tournament."
          action={<button onClick={() => runAction(save, "Standings saved and sorted.")} className="rounded-lg bg-[#F22738] px-4 py-2 text-sm font-black uppercase text-white">Save & Sort</button>}
        />
        <div className={`${cardClass} overflow-x-auto`}>
          <table className="w-full min-w-[900px] text-left text-sm text-white/70">
            <thead className="bg-black/35 text-[10px] uppercase tracking-widest text-white/38">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Match Point</th>
                <th className="px-4 py-3">Match W-L</th>
                <th className="px-4 py-3">Net Game Win</th>
                <th className="px-4 py-3">Game W-L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {standings.map((row, index) => (
                <tr key={row.teamCode || index}>
                  <td className="px-4 py-3 font-black text-[#F2D98D]">{index + 1}</td>
                  <td className="px-4 py-3">
                    <input value={row.teamCode || ""} onChange={(event) => {
                      const next = [...standings];
                      next[index] = { ...row, teamCode: sanitizeTeamCode(event.target.value) };
                      setStandings(next);
                    }} className="w-24 rounded-lg border border-white/10 bg-black/30 px-2 py-2 font-black text-white outline-none focus:border-[#F2D98D]" />
                  </td>
                  <td className="px-4 py-3">
                    <input value={row.team || ""} onChange={(event) => {
                      const next = [...standings];
                      next[index] = { ...row, team: sanitizeText(event.target.value, 60) };
                      setStandings(next);
                    }} className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-white outline-none focus:border-[#F2D98D]" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" value={row.matchPoint ?? 0} onChange={(event) => {
                      const next = [...standings];
                      next[index] = { ...row, matchPoint: Number(event.target.value) };
                      setStandings(next);
                    }} className="w-24 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-white outline-none focus:border-[#F2D98D]" />
                  </td>
                  <td className="px-4 py-3">
                    <input value={row.matchWL || ""} onChange={(event) => {
                      const next = [...standings];
                      next[index] = { ...row, matchWL: sanitizeText(event.target.value, 20) };
                      setStandings(next);
                    }} className="w-28 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-white outline-none focus:border-[#F2D98D]" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" value={row.netGameWin ?? 0} onChange={(event) => {
                      const next = [...standings];
                      next[index] = { ...row, netGameWin: Number(event.target.value) };
                      setStandings(next);
                    }} className="w-24 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-white outline-none focus:border-[#F2D98D]" />
                  </td>
                  <td className="px-4 py-3">
                    <input value={row.gameWL || ""} onChange={(event) => {
                      const next = [...standings];
                      next[index] = { ...row, gameWL: sanitizeText(event.target.value, 20) };
                      setStandings(next);
                    }} className="w-28 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-white outline-none focus:border-[#F2D98D]" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const BackupPanel = () => (
    <div className="space-y-6">
      <SectionHeader
        title="Backup / Import / Export"
        description="Import divalidasi sebelum overwrite. Reset dan import membuat backup terakhir otomatis."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <button onClick={exportData} className={`${cardClass} flex flex-col items-start gap-3 p-5 text-left transition hover:border-[#F2D98D]/35`}>
          <Download className="text-[#F2D98D]" />
          <span className="font-black uppercase text-white">Export JSON</span>
          <span className="text-sm text-white/42">Download seluruh tournament data termasuk bracket.</span>
        </button>
        <button onClick={() => fileInputRef.current?.click()} className={`${cardClass} flex flex-col items-start gap-3 p-5 text-left transition hover:border-[#F2D98D]/35`}>
          <Upload className="text-[#F22738]" />
          <span className="font-black uppercase text-white">Import JSON</span>
          <span className="text-sm text-white/42">Reject otomatis jika JSON/schema rusak.</span>
        </button>
        <button onClick={() => runAction(store.restoreBackup, "Backup restored.")} className={`${cardClass} flex flex-col items-start gap-3 p-5 text-left transition hover:border-[#F2D98D]/35`}>
          <FileJson className="text-white/70" />
          <span className="font-black uppercase text-white">Restore Backup</span>
          <span className="text-sm text-white/42">Pulihkan snapshot valid terakhir.</span>
        </button>
      </div>
      <div className="rounded-2xl border border-[#F22738]/30 bg-[#F22738]/8 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-[#F22738]" />
          <div className="flex-1">
            <div className="font-black uppercase text-white">Danger Zone</div>
            <div className="mt-1 text-sm text-white/45">Aksi reset tetap membuat backup otomatis terlebih dahulu.</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => window.confirm("Reset semua hasil bracket?") && runAction(store.resetBracketResults, "Bracket results reset.")} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-black uppercase text-white/70 hover:bg-white/10">
                Reset Bracket Results Only
              </button>
              <button onClick={() => window.confirm("Reset semua data tournament ke default?") && runAction(store.resetData, "All data reset to default.")} className="rounded-lg bg-[#F22738] px-4 py-2 text-sm font-black uppercase text-white">
                Reset All Tournament Data
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className={`${cardClass} p-4 text-sm text-white/45`}>
        Last updated: <span className="font-bold text-white/70">{store.tournamentConfig?.updatedAt || "Unknown"}</span>
      </div>
    </div>
  );

  const SettingsPanel = () => {
    const [siteConfig, setSiteConfig] = useState(store.siteConfig);
    const [settings, setSettings] = useState(store.settings);

    const save = () => {
      store.updateSiteConfig(siteConfig);
      store.updateSettings(settings);
    };

    return (
      <div className="space-y-6">
        <SectionHeader
          title="Settings"
          description="Pengaturan public site dan admin visibility."
          action={<button onClick={() => runAction(save, "Settings saved.")} className="rounded-lg bg-[#F22738] px-4 py-2 text-sm font-black uppercase text-white"><Save size={16} className="inline" /> Save</button>}
        />
        <div className={`${cardClass} grid gap-4 p-5 md:grid-cols-2`}>
          {[
            ["Tournament Name", "tournamentName"],
            ["Season", "season"],
            ["Timezone", "timezone"],
            ["Hero Title", "heroTitle"],
          ].map(([label, key]) => (
            <label key={key} className="block">
              <span className="text-xs font-black uppercase tracking-widest text-white/38">{label}</span>
              <input value={siteConfig?.[key] || ""} onChange={(event) => setSiteConfig({ ...siteConfig, [key]: sanitizeText(event.target.value, 80) })} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#F2D98D]" />
            </label>
          ))}
          <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4">
            <span>
              <span className="block font-black uppercase text-white">Show Admin Button</span>
              <span className="text-sm text-white/40">Toggle tombol admin jika dipakai di navbar.</span>
            </span>
            <input type="checkbox" checked={Boolean(settings?.showAdminButton)} onChange={(event) => setSettings({ ...settings, showAdminButton: event.target.checked })} className="h-5 w-5 accent-[#F22738]" />
          </label>
        </div>
      </div>
    );
  };

  const renderTab = () => {
    if (activeTab === "overview") return <Overview />;
    if (activeTab === "seeding") return <TeamsAndSeeding />;
    if (activeTab === "bracket") return <BracketControl />;
    if (activeTab === "schedule") return <ScheduleEditor />;
    if (activeTab === "standings") return <StandingsEditor />;
    if (activeTab === "backup") return <BackupPanel />;
    return <SettingsPanel />;
  };

  return (
    <div className="min-h-screen bg-[#090202] text-white lg:flex">
      <aside className="border-b border-white/10 bg-[#110303] p-4 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r lg:p-6">
        <Link to="/" className="flex items-center gap-3">
          <img src="/superchallange-lanjang.png" alt="Super Challenge" className="h-9 object-contain" />
        </Link>
        <div className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-[#F2D98D]/45">Tournament CMS</div>
        <nav className="mt-4 grid gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-black uppercase transition",
                  active ? "bg-[#F22738] text-white shadow-lg shadow-[#F22738]/20" : "text-white/55 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <span className="flex items-center gap-3"><Icon size={18} /> {tab.label}</span>
                {active && <ChevronRight size={16} />}
              </button>
            );
          })}
        </nav>
        <Link to="/" className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-black uppercase text-white/55 transition hover:text-white">
          <Home size={18} /> Back to Website
        </Link>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 border-b border-white/10 bg-[#090202]/92 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F2D98D]/55">Admin Panel</div>
              <h1 className="text-2xl font-black uppercase tracking-wide text-white">{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-white/45">
              <CheckCircle2 size={16} className={validation.valid ? "text-green-400" : "text-[#F2D98D]"} />
              {validation.valid ? "Schema valid" : "Schema repaired in memory"}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl p-5 lg:p-8">
          {renderTab()}
        </div>
      </main>

      <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={importData} className="hidden" />
      {toast && (
        <div
          className={[
            "fixed bottom-6 right-6 z-50 flex max-w-sm items-center gap-3 rounded-xl border px-5 py-4 text-sm font-bold shadow-2xl",
            toast.type === "success"
              ? "border-green-400/30 bg-green-500 text-white"
              : "border-[#F22738]/40 bg-[#400C0C] text-white",
          ].join(" ")}
        >
          {toast.type === "success" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
