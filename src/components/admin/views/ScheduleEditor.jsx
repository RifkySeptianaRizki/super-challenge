import { useState } from "react";
import { sanitizeText } from "../../../lib/bracketEngine";
import { AdminButton, AdminPanel, SectionHeader } from "../AdminUI";
import { CalendarDays } from "lucide-react";
import TeamLogo from "../../TeamLogo";

export default function ScheduleEditor({ store, teamsById, runAction }) {
  const [draft, setDraft] = useState(store.bracket);

  const save = async () => {
    for (const match of draft) {
      await store.updateBracketMatchMeta(match.id, {
        date: match.date || null,
        time: match.time || null,
        venue: match.venue || null,
        stage: match.stage || null,
        streamLink: match.streamLink || null,
      });
    }
  };

  const updateDraft = (matchId, payload) => {
    setDraft((current) => current.map((match) => (
      match.id === matchId ? { ...match, ...payload } : match
    )));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title="Schedule Editor"
        description="Atur jadwal pertandingan, venue, stage, dan link stream. Data akan disimpan ke bracket match."
        action={
          <AdminButton onClick={() => runAction(save, "Schedule saved.")}>
            Save Schedule
          </AdminButton>
        }
      />
      <AdminPanel className="p-0 overflow-hidden" icon={CalendarDays}>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[1100px] text-left text-sm text-white/80">
            <thead className="bg-[#400C0C]/50 border-b border-[#731414]/50">
              <tr>
                <th className="px-5 py-4 font-black uppercase tracking-widest text-[#F2D98D] text-xs">Match</th>
                <th className="px-5 py-4 font-black uppercase tracking-widest text-white/50 text-xs">Teams</th>
                <th className="px-5 py-4 font-black uppercase tracking-widest text-white/50 text-xs w-36">Date</th>
                <th className="px-5 py-4 font-black uppercase tracking-widest text-white/50 text-xs w-32">Time</th>
                <th className="px-5 py-4 font-black uppercase tracking-widest text-white/50 text-xs">Venue</th>
                <th className="px-5 py-4 font-black uppercase tracking-widest text-white/50 text-xs">Stage</th>
                <th className="px-5 py-4 font-black uppercase tracking-widest text-white/50 text-xs">Stream Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#731414]/20">
              {draft.map((match) => {
                const teamA = teamsById.get(match.teamAId);
                const teamB = teamsById.get(match.teamBId);
                return (
                  <tr key={match.id} className="transition-colors hover:bg-[#731414]/10 group">
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center justify-center rounded-lg bg-[#260505] px-3 py-1.5 text-xs font-black uppercase text-[#F2D98D] shadow-inner group-hover:bg-[#400C0C]">
                        {match.id}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 font-black text-white/90">
                        <TeamLogo team={teamA} code={teamA?.code || "TBA"} size="xs" />
                        <span className="w-12 truncate">{teamA?.code || "TBA"}</span>
                        <span className="text-[10px] text-[#F22738]">VS</span>
                        <TeamLogo team={teamB} code={teamB?.code || "TBA"} size="xs" />
                        <span className="w-12 truncate">{teamB?.code || "TBA"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <input 
                        type="date" 
                        value={match.date || ""} 
                        onChange={(event) => updateDraft(match.id, { date: event.target.value })} 
                        className="w-full rounded-xl border border-[#731414]/50 bg-[#120303]/60 px-3 py-2 text-sm text-white outline-none transition-all focus:border-[#F2D98D] focus:ring-1 focus:ring-[#F2D98D]/20 [color-scheme:dark]" 
                      />
                    </td>
                    <td className="px-5 py-4">
                      <input 
                        type="time" 
                        value={match.time || ""} 
                        onChange={(event) => updateDraft(match.id, { time: event.target.value })} 
                        className="w-full rounded-xl border border-[#731414]/50 bg-[#120303]/60 px-3 py-2 text-sm text-white outline-none transition-all focus:border-[#F2D98D] focus:ring-1 focus:ring-[#F2D98D]/20 [color-scheme:dark]" 
                      />
                    </td>
                    <td className="px-5 py-4">
                      <input 
                        value={match.venue || ""} 
                        placeholder="Venue"
                        onChange={(event) => updateDraft(match.id, { venue: sanitizeText(event.target.value, 80) })} 
                        className="w-full min-w-[120px] rounded-xl border border-[#731414]/50 bg-[#120303]/60 px-3 py-2 text-sm text-white outline-none transition-all focus:border-[#F2D98D] focus:ring-1 focus:ring-[#F2D98D]/20" 
                      />
                    </td>
                    <td className="px-5 py-4">
                      <input 
                        value={match.stage || ""} 
                        placeholder="Stage"
                        onChange={(event) => updateDraft(match.id, { stage: sanitizeText(event.target.value, 80) })} 
                        className="w-full min-w-[120px] rounded-xl border border-[#731414]/50 bg-[#120303]/60 px-3 py-2 text-sm text-white outline-none transition-all focus:border-[#F2D98D] focus:ring-1 focus:ring-[#F2D98D]/20" 
                      />
                    </td>
                    <td className="px-5 py-4">
                      <input 
                        value={match.streamLink || ""} 
                        placeholder="https://youtube.com/..."
                        onChange={(event) => updateDraft(match.id, { streamLink: sanitizeText(event.target.value, 160) })} 
                        className="w-full min-w-[180px] rounded-xl border border-[#731414]/50 bg-[#120303]/60 px-3 py-2 text-sm text-white outline-none transition-all focus:border-[#F2D98D] focus:ring-1 focus:ring-[#F2D98D]/20" 
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </div>
  );
}
