import { createQuickWinOptions, getSeriesLabel } from "../../../lib/bracketEngine";
import { AdminButton, AdminPanel, SectionHeader, StatusBadge, TeamPill } from "../AdminUI";
import MiniBracketPreview from "./MiniBracketPreview";

const roundLabels = {
  R16: "Round of 16",
  QF: "Quarter Final",
  SF: "Semi Final",
  GF: "Grand Final",
};

export default function BracketControl({ store, teamsById, runAction, hasDependentResults }) {
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

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title="Bracket Control"
        description={`Input hasil ${store.tournamentConfig?.seriesType || "BO3"}. Winner otomatis maju ke babak berikutnya.`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <AdminButton variant="secondary" onClick={() => runAction(store.resetBracketResults, "Bracket results cleared.")}>
              Reset Results
            </AdminButton>
            <AdminButton variant="danger" onClick={() => window.confirm("Reset seluruh bracket dari daftar team saat ini?") && runAction(store.resetBracketAll, "Bracket regenerated from teams.")}>
              Reset All
            </AdminButton>
          </div>
        }
      />

      <MiniBracketPreview bracket={store.bracket} teamsById={teamsById} champion={teamsById.get(store.bracket.find(m => m.id === "GF-1")?.winnerTeamId)} />

      <div className="space-y-12">
        {["R16", "QF", "SF", "GF"].map((round) => (
          <div key={round} className="relative">
            {/* Visual separator/header for rounds */}
            <div className="mb-6 flex items-center gap-4">
               <h3 className="text-xl font-black uppercase tracking-widest text-[#F2D98D]">{roundLabels[round]}</h3>
               <div className="h-px flex-1 bg-gradient-to-r from-[#F2D98D]/50 to-transparent" />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {store.bracket.filter((match) => match.round === round).map((match) => (
                <AdminPanel key={match.id} className="group hover:border-[#F2D98D]/40">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-[#731414]/30 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black uppercase tracking-wider text-white">{match.id}</span>
                        <StatusBadge status={match.status} />
                      </div>
                      <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-[#F2D98D]/70">
                        {getSeriesLabel(match.bestOf)} <span className="mx-2 opacity-50">•</span> advances {match.nextMatchId ? `to ${match.nextMatchId}` : "to champion"}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                    <TeamPill team={teamsById.get(match.teamAId)} seed={match.teamASeed} muted={!match.teamAId} />
                    
                    <div className="flex shrink-0 items-center justify-center gap-3 rounded-2xl bg-[#120303]/80 p-3 shadow-inner">
                      <select
                        value={match.scoreA}
                        onChange={(event) => updateScore(match, Number(event.target.value), match.scoreB)}
                        className="h-12 w-16 appearance-none rounded-xl border-2 border-[#731414]/50 bg-[#260505] text-center text-xl font-black text-[#F2D98D] shadow-lg outline-none transition-all focus:border-[#F22738] focus:shadow-[0_0_15px_rgba(242,39,56,0.3)]"
                      >
                        {Array.from({ length: (match.requiredWins || 2) + 1 }, (_, score) => <option key={score} value={score}>{score}</option>)}
                      </select>
                      <span className="text-sm font-black uppercase text-[#F22738]">VS</span>
                      <select
                        value={match.scoreB}
                        onChange={(event) => updateScore(match, match.scoreA, Number(event.target.value))}
                        className="h-12 w-16 appearance-none rounded-xl border-2 border-[#731414]/50 bg-[#260505] text-center text-xl font-black text-[#F2D98D] shadow-lg outline-none transition-all focus:border-[#F22738] focus:shadow-[0_0_15px_rgba(242,39,56,0.3)]"
                      >
                        {Array.from({ length: (match.requiredWins || 2) + 1 }, (_, score) => <option key={score} value={score}>{score}</option>)}
                      </select>
                    </div>
                    
                    <TeamPill team={teamsById.get(match.teamBId)} seed={match.teamBSeed} muted={!match.teamBId} />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {createQuickWinOptions(match).map((option) => (
                      <button
                        key={`${match.id}-${option.label}`}
                        disabled={option.disabled}
                        onClick={() => updateScore(match, option.scoreA, option.scoreB)}
                        className="flex-1 rounded-xl border border-[#731414]/50 bg-[#260505]/80 px-3 py-2.5 text-[11px] font-black uppercase tracking-wider text-white/70 transition-all hover:-translate-y-0.5 hover:border-[#F2D98D]/50 hover:bg-[#400C0C] hover:text-[#F2D98D] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-[#731414]/50"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </AdminPanel>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
