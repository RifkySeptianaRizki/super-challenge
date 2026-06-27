import { createQuickWinOptions, getRoundStructure, getSeriesLabel, getVisibleMatches, isAutoAdvanceMatch } from "../../../lib/bracketEngine";
import { AdminButton, AdminPanel, SectionHeader, StatusBadge, TeamPill } from "../AdminUI";
import MiniBracketPreview from "./MiniBracketPreview";

const roundLabels = {
  R16: "Round of 16",
  QF: "Quarter Final",
  SF: "Semi Final",
  GF: "Grand Final",
};

export default function BracketControl({ store, teamsById, runAction, hasDependentResults }) {
  const bracketSize = store.tournamentConfig?.bracketSize
    || store.tournamentConfig?.bracket_size
    || store.bracket.find((match) => match.bracketSize)?.bracketSize
    || 16;
  const rounds = getRoundStructure(bracketSize)
    .map((match) => match.round)
    .filter((round, index, list) => list.indexOf(round) === index);
  const matches = getVisibleMatches(store.bracket, bracketSize);

  const updateScore = (match, scoreA, scoreB) => {
    if (isAutoAdvanceMatch(match) || !match.teamAId || !match.teamBId || match.playable === false) {
      throw new Error("Match BYE/menunggu belum bisa diinput skor.");
    }
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

  return (
    <div className="min-w-0 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title="Bracket Control"
        description={`Input hasil ${store.tournamentConfig?.seriesType || "BO3"}. Winner otomatis maju ke babak berikutnya.`}
        action={
          <div className="grid w-full grid-cols-1 items-center gap-3 sm:flex sm:flex-wrap sm:justify-end">
            <AdminButton className="w-full sm:w-auto" variant="secondary" onClick={() => runAction(store.resetBracketResults, "Bracket results cleared.")}>
              Reset Results
            </AdminButton>
            <AdminButton className="w-full sm:w-auto" variant="danger" onClick={() => window.confirm("Reset seluruh bracket dari daftar team saat ini?") && runAction(store.resetBracketAll, "Bracket regenerated from teams.")}>
              Reset All
            </AdminButton>
          </div>
        }
      />

      <MiniBracketPreview bracket={store.bracket} teamsById={teamsById} champion={teamsById.get(store.bracket.find(m => m.id === "GF-1")?.winnerTeamId)} />

      <div className="min-w-0 space-y-12">
        {rounds.map((round) => (
          <div key={round} className="relative min-w-0">
            {/* Visual separator/header for rounds */}
            <div className="mb-6 flex min-w-0 items-center gap-4">
               <h3 className="text-xl font-black uppercase tracking-widest text-[#F2D98D]">{roundLabels[round]}</h3>
               <div className="h-px flex-1 bg-gradient-to-r from-[#F2D98D]/50 to-transparent" />
            </div>

            <div className="grid min-w-0 gap-6 xl:grid-cols-2">
              {matches.filter((match) => match.round === round).map((match) => {
                const scoreEditable = !isAutoAdvanceMatch(match) && match.teamAId && match.teamBId && match.playable !== false;
                const teamA = match.teamAIsBye || match.slotAType === "bye"
                  ? { code: "BYE", name: "Auto advance" }
                  : teamsById.get(match.teamAId);
                const teamB = match.teamBIsBye || match.slotBType === "bye"
                  ? { code: "BYE", name: "Auto advance" }
                  : teamsById.get(match.teamBId);
                return (
                <AdminPanel key={match.id} className="group hover:border-[#F2D98D]/40">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-[#731414]/30 pb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black uppercase tracking-wider text-white">{match.id}</span>
                        <StatusBadge status={isAutoAdvanceMatch(match) ? "auto" : match.status} />
                      </div>
                      <div className="mt-1 break-words text-[11px] font-bold uppercase tracking-widest text-[#F2D98D]/70">
                        {getSeriesLabel(match.bestOf)} <span className="mx-2 opacity-50">•</span> advances {match.nextMatchId ? `to ${match.nextMatchId}` : "to champion"}
                      </div>
                      {isAutoAdvanceMatch(match) && (
                        <div className="mt-2 text-xs font-bold text-white/45">
                          BYE auto-advance. Tidak perlu input skor.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
                    <TeamPill team={teamA} seed={match.teamASeed} muted={!match.teamAId && !match.teamAIsBye && match.slotAType !== "bye"} />
                    
                    <div className="flex shrink-0 items-center justify-center gap-3 rounded-2xl bg-[#120303]/80 p-3 shadow-inner">
                      <select
                        value={match.scoreA}
                        onChange={(event) => updateScore(match, Number(event.target.value), match.scoreB)}
                        disabled={!scoreEditable}
                        className="h-12 w-16 appearance-none rounded-xl border-2 border-[#731414]/50 bg-[#260505] text-center text-xl font-black text-[#F2D98D] shadow-lg outline-none transition-all focus:border-[#F22738] focus:shadow-[0_0_15px_rgba(242,39,56,0.3)]"
                      >
                        {Array.from({ length: (match.requiredWins || 2) + 1 }, (_, score) => <option key={score} value={score}>{score}</option>)}
                      </select>
                      <span className="text-sm font-black uppercase text-[#F22738]">VS</span>
                      <select
                        value={match.scoreB}
                        onChange={(event) => updateScore(match, match.scoreA, Number(event.target.value))}
                        disabled={!scoreEditable}
                        className="h-12 w-16 appearance-none rounded-xl border-2 border-[#731414]/50 bg-[#260505] text-center text-xl font-black text-[#F2D98D] shadow-lg outline-none transition-all focus:border-[#F22738] focus:shadow-[0_0_15px_rgba(242,39,56,0.3)]"
                      >
                        {Array.from({ length: (match.requiredWins || 2) + 1 }, (_, score) => <option key={score} value={score}>{score}</option>)}
                      </select>
                    </div>
                    
                    <TeamPill team={teamB} seed={match.teamBSeed} muted={!match.teamBId && !match.teamBIsBye && match.slotBType !== "bye"} />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {createQuickWinOptions(match).map((option) => (
                      <button
                        key={`${match.id}-${option.label}`}
                        disabled={!scoreEditable || option.disabled}
                        onClick={() => updateScore(match, option.scoreA, option.scoreB)}
                      className="min-w-[120px] flex-1 rounded-xl border border-[#731414]/50 bg-[#260505]/80 px-3 py-2.5 text-[11px] font-black uppercase tracking-wider text-white/70 transition-all hover:-translate-y-0.5 hover:border-[#F2D98D]/50 hover:bg-[#400C0C] hover:text-[#F2D98D] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-[#731414]/50"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </AdminPanel>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
