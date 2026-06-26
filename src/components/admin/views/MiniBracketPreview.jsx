import { Eye } from "lucide-react";
import { AdminPanel, StatusBadge } from "../AdminUI";
import TeamLogo from "../../TeamLogo";

const roundLabels = {
  R16: "Round of 16",
  QF: "Quarter Final",
  SF: "Semi Final",
  GF: "Grand Final",
};

export default function MiniBracketPreview({ bracket, teamsById, champion }) {
  const rounds = ["R16", "QF", "SF", "GF"];

  return (
    <AdminPanel 
      title="Mini Bracket Preview" 
      caption="Live bracket state dari Supabase."
      icon={Eye}
    >
      <div className="flex w-full overflow-x-auto pb-4 no-scrollbar">
        <div className="flex min-w-max gap-4 md:gap-6 py-4">
          {rounds.map((round) => (
            <div key={round} className="flex w-64 flex-col h-[580px]">
              <div className="flex items-center gap-2 mb-4 h-6 shrink-0">
                 <div className="h-1.5 w-1.5 rounded-full bg-[#F2D98D]" />
                 <div className="text-[10px] font-black uppercase tracking-widest text-[#F2D98D]">{roundLabels[round]}</div>
              </div>
              <div className="flex flex-1 flex-col justify-around">
                {bracket.filter((match) => match.round === round).map((match) => (
                  <div key={match.id} className="group relative overflow-hidden rounded-xl border border-[#731414]/40 bg-[#260505]/80 p-3 shadow-md transition-all hover:border-[#F2D98D]/50 hover:bg-[#400C0C]">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_forwards]" />
                    <div className="relative z-10 mb-2 flex items-center justify-between border-b border-[#731414]/30 pb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-white/50 group-hover:text-white/80 transition-colors">{match.id}</span>
                      <StatusBadge status={match.status} />
                    </div>
                    <div className="relative z-10 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex min-w-0 items-center gap-2">
                          <TeamLogo team={teamsById.get(match.teamAId)} code={teamsById.get(match.teamAId)?.code || "TBA"} size="xs" />
                          <span className="truncate font-bold tracking-wide text-white">{teamsById.get(match.teamAId)?.code || "TBA"}</span>
                        </div>
                        <span className="font-black text-[#F2D98D] bg-[#F2D98D]/10 px-1.5 py-0.5 rounded">{match.teamAId ? match.scoreA : "-"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex min-w-0 items-center gap-2">
                          <TeamLogo team={teamsById.get(match.teamBId)} code={teamsById.get(match.teamBId)?.code || "TBA"} size="xs" />
                          <span className="truncate font-bold tracking-wide text-white">{teamsById.get(match.teamBId)?.code || "TBA"}</span>
                        </div>
                        <span className="font-black text-[#F2D98D] bg-[#F2D98D]/10 px-1.5 py-0.5 rounded">{match.teamBId ? match.scoreB : "-"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex w-64 flex-col h-[580px]">
            <div className="flex items-center gap-2 mb-4 h-6 shrink-0">
               <div className="h-1.5 w-1.5 rounded-full bg-[#F22738] animate-pulse" />
               <div className="text-[10px] font-black uppercase tracking-widest text-[#F2D98D]">Champion</div>
            </div>
            <div className="flex flex-1 flex-col justify-around">
              <div className="relative overflow-hidden rounded-2xl border-2 border-[#F2D98D]/40 bg-gradient-to-br from-[#400C0C] to-[#260505] p-4 md:p-5 shadow-[0_0_20px_rgba(242,217,141,0.15)]">
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[#F2D98D] opacity-10 blur-xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <TeamLogo team={champion} code={champion?.code || "TBA"} name={champion?.name || "Pending Final"} size="lg" variant="winner" />
                    <div className="min-w-0">
                      <div className="truncate text-2xl font-black uppercase tracking-wider text-white">{champion?.code || "TBA"}</div>
                      <div className="mt-1 truncate text-xs font-semibold text-white/50">{champion?.name || "Pending Final"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminPanel>
  );
}
