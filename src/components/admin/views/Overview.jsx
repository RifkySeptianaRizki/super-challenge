import { ShieldAlert } from "lucide-react";
import { SectionHeader, StatsCard, adminPanelClass } from "../AdminUI";
import { cn } from "../../../lib/cn";
import MiniBracketPreview from "./MiniBracketPreview";
import TeamLogo from "../../TeamLogo";

export default function Overview({ store, validation, champion, teamsById }) {
  const completed = store.bracket.filter((match) => match.status === "completed").length;
  const live = store.bracket.filter((match) => match.status === "live").length;
  const waiting = store.bracket.filter((match) => match.status === "empty").length;

  return (
    <div className="space-y-5 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title="Tournament Overview"
        description={`Status bracket 16 Team Single Elimination ${store.tournamentConfig?.seriesType || "BO3"} dari Supabase.`}
      />
      {!validation.valid && (
        <div className="flex gap-4 rounded-2xl border-2 border-[#F2D98D]/40 bg-[#F2D98D]/10 p-5 shadow-[0_0_20px_rgba(242,217,141,0.15)]">
          <ShieldAlert className="mt-1 shrink-0 text-[#F2D98D]" size={24} />
          <div>
            <div className="text-sm font-black uppercase tracking-wide text-[#F2D98D]">Bracket warning</div>
            <div className="mt-2 text-sm font-medium leading-relaxed text-[#F2D98D]/80">{validation.errors.join(" ")}</div>
          </div>
        </div>
      )}
      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Registered Teams" value={store.teams.length} caption="Active participants" tone="red" />
        <StatsCard label="Total Matches" value={store.bracket.length} caption="In current bracket" tone="gold" />
        <StatsCard label="Completed" value={completed} caption={`Results locked by ${store.tournamentConfig?.seriesType || "BO3"}`} tone="green" />
        <StatsCard label="Waiting / Live" value={waiting + live} caption="Matches pending resolution" tone="red" />
      </div>
      <div className={cn(adminPanelClass, "relative overflow-hidden p-4 md:p-5")}>
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#F2D98D]/20 blur-[40px]" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#F22738]/10 blur-[40px]" />
        </div>
        <div className="relative z-10">
           <div className="text-[10px] font-bold uppercase tracking-widest text-[#F2D98D]">Current Champion</div>
           <div className="mt-3 flex items-center gap-4">
             <TeamLogo team={champion} code={champion?.code || "TBA"} name={champion?.name || "Complete Grand Final to reveal champion."} size="xl" variant="winner" />
             <div className="min-w-0">
               <div className="truncate text-4xl font-black uppercase tracking-wider text-white drop-shadow-md">{champion?.code || "TBA"}</div>
               <div className="mt-1 truncate text-sm font-medium text-white/50">{champion?.name || "Complete Grand Final to reveal champion."}</div>
             </div>
           </div>
        </div>
      </div>
      <MiniBracketPreview bracket={store.bracket} teamsById={teamsById} champion={champion} />
    </div>
  );
}
