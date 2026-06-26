import { useState } from "react";
import { getRequiredWins, getSeriesLabel } from "../../../lib/bracketEngine";
import { AdminButton, AdminPanel, SectionHeader } from "../AdminUI";
import MiniBracketPreview from "./MiniBracketPreview";
import { RefreshCw, Shuffle, CheckCircle2 } from "lucide-react";
import TeamLogo from "../../TeamLogo";

const boOptions = [1, 3, 5, 7, 9];

export default function DrawAndSeeding({ store, teamsById }) {
  const currentSlots = (
    store.bracket
      .filter((match) => match.round === "R16")
      .sort((a, b) => a.order - b.order)
      .flatMap((match) => [match.teamAId || "", match.teamBId || ""])
  );
  const [slots, setSlots] = useState(currentSlots.length === 16 ? currentSlots : Array(16).fill(""));
  const [bestOf, setBestOf] = useState(store.tournamentConfig?.bestOf || 3);
  const [keepSchedule, setKeepSchedule] = useState(true);
  const validation = store.validateDrawSlots(slots);
  const selectedCounts = slots.reduce((acc, teamId) => {
    if (teamId) acc[teamId] = (acc[teamId] || 0) + 1;
    return acc;
  }, {});

  const confirmReset = () => (
    !store.hasCompletedResults()
    || window.confirm("Mengubah posisi bracket akan mereset seluruh hasil pertandingan. Lanjutkan?")
  );

  const applyManual = async () => {
    if (!confirmReset()) return;
    try {
      await store.applyManualDraw(slots, bestOf, { keepSchedule });
      // Add success toast/notification if needed
    } catch (err) {
      alert(err.message || "Action failed");
    }
  };

  const spin = () => {
    store.previewSpinDraw();
  };

  const applySpin = async () => {
    if (!store.spinDrawPreview?.slots?.length) {
      alert("Spin preview belum dibuat.");
      return;
    }
    if (!confirmReset()) return;
    try {
      await store.applySpinDraw(
        store.spinDrawPreview.slots,
        bestOf,
        {
          drawSeed: store.spinDrawPreview.drawSeed,
          previewCreatedAt: store.spinDrawPreview.createdAt,
          appliedBy: "Admin",
        },
        { keepSchedule }
      );
    } catch (err) {
      alert(err.message || "Action failed");
    }
  };

  const renderPairings = (pairingSlots) => (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 8 }, (_, matchIndex) => {
        const teamA = teamsById.get(pairingSlots[matchIndex * 2]);
        const teamB = teamsById.get(pairingSlots[matchIndex * 2 + 1]);
        return (
          <div key={matchIndex} className="group relative overflow-hidden rounded-xl border border-[#731414]/40 bg-gradient-to-r from-[#400C0C]/80 to-[#260505]/80 p-4 shadow-md transition-all hover:border-[#F2D98D]/50 hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(242,217,141,0.15)]">
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#F22738] to-[#F2D98D] opacity-50 transition-opacity group-hover:opacity-100" />
            <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#F2D98D]">
              Match {matchIndex + 1}
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-base font-black text-white">
              <div className="flex min-w-0 items-center gap-2">
                <TeamLogo team={teamA} code={teamA?.code || "TBA"} size="xs" />
                <span className="truncate">{teamA?.code || "TBA"}</span>
              </div>
              <span className="text-xs text-[#F22738]">VS</span>
              <div className="flex min-w-0 items-center justify-end gap-2 text-right">
                <span className="truncate">{teamB?.code || "TBA"}</span>
                <TeamLogo team={teamB} code={teamB?.code || "TBA"} size="xs" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title="Draw & Seeding Room"
        description="Pusat kendali bracket. Gunakan Manual Draw atau Spin Draw (Random)."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={bestOf}
              onChange={(event) => setBestOf(Number(event.target.value))}
              className="appearance-none rounded-xl border-2 border-[#731414] bg-[#400C0C] px-4 py-2.5 text-sm font-black text-white outline-none transition-all focus:border-[#F2D98D] focus:shadow-[0_0_15px_rgba(242,217,141,0.15)]"
            >
              {boOptions.map((option) => (
                <option key={option} value={option}>{getSeriesLabel(option)}</option>
              ))}
            </select>
            <span className="rounded-xl border border-[#F2D98D]/30 bg-[#F2D98D]/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-[#F2D98D]">
              Need {getRequiredWins(bestOf)} wins
            </span>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#731414] bg-[#400C0C] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[#731414]/50">
              <input
                type="checkbox"
                checked={keepSchedule}
                onChange={(event) => setKeepSchedule(event.target.checked)}
                className="h-4 w-4 accent-[#F22738]"
              />
              Keep Schedule
            </label>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <AdminPanel title="Manual Builder" caption="Tentukan posisi secara spesifik untuk tiap slot bracket.">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#731414]/30 pb-6">
            {!validation.valid ? (
              <div className="rounded-xl border border-[#F2D98D]/40 bg-[#F2D98D]/10 px-4 py-2.5 text-xs font-bold text-[#F2D98D]">
                {validation.errors.join(" ")}
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 size={16} /> Valid configuration
              </div>
            )}
            
            <AdminButton
              disabled={!validation.valid || store.saving}
              onClick={applyManual}
            >
              Apply Manual Draw
            </AdminButton>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 8 }, (_, matchIndex) => (
              <div key={matchIndex} className="relative rounded-2xl border border-[#731414]/30 bg-[#260505]/60 p-5 transition-all focus-within:border-[#F22738] focus-within:shadow-[0_0_20px_rgba(242,39,56,0.15)] hover:bg-[#400C0C]/50">
                <div className="mb-4 text-[11px] font-black uppercase tracking-widest text-[#F2D98D]">
                  Match {matchIndex + 1}
                </div>
                <div className="flex flex-col gap-3">
                  {[0, 1].map((slotOffset) => {
                    const slotIndex = matchIndex * 2 + slotOffset;
                    const teamId = slots[slotIndex] || "";
                    const selectedTeam = teamsById.get(teamId);
                    const duplicate = teamId && selectedCounts[teamId] > 1;
                    return (
                      <div key={slotIndex} className="relative">
                        <div className="mb-1.5 flex items-center justify-between px-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-white/40">
                            Slot {slotOffset === 0 ? "A" : "B"}
                          </span>
                          {duplicate && <span className="rounded bg-[#F22738]/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-[#F22738] animate-pulse">Duplicate</span>}
                        </div>
                        <div className="mb-2 flex min-h-8 items-center gap-2 rounded-lg border border-[#731414]/30 bg-[#120303]/50 px-2 py-1.5">
                          <TeamLogo team={selectedTeam} code={selectedTeam?.code || "TBA"} size="xs" />
                          <span className="truncate text-xs font-black uppercase tracking-wide text-white/75">
                            {selectedTeam ? `${selectedTeam.code} - ${selectedTeam.name}` : "TBA"}
                          </span>
                        </div>
                        <select
                          value={teamId}
                          onChange={(event) => {
                            const next = [...slots];
                            next[slotIndex] = event.target.value;
                            setSlots(next);
                            store.setManualDrawSlots(next);
                          }}
                          className="w-full appearance-none rounded-xl border border-[#731414]/50 bg-[#120303]/80 px-4 py-2.5 text-sm font-bold text-white outline-none transition-colors focus:border-[#F2D98D]"
                        >
                          <option value="">-- Select Team --</option>
                          {store.teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.code} - {team.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Spin Draw Preview" caption="Preview acak dengan algoritma Fisher-Yates." icon={Shuffle}>
          <div className="mb-6 flex flex-wrap gap-2 border-b border-[#731414]/30 pb-6">
            <AdminButton variant="secondary" icon={RefreshCw} onClick={spin} className="flex-1">
              Spin Again
            </AdminButton>
            <AdminButton
              onClick={applySpin}
              disabled={!store.spinDrawPreview?.slots?.length || store.saving}
              className="flex-1"
            >
              Apply Draw
            </AdminButton>
            <AdminButton variant="ghost" size="sm" onClick={store.clearDrawPreview} className="w-full">
              Clear
            </AdminButton>
          </div>
          
          <div className="relative">
            {store.spinDrawPreview?.slots?.length ? (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[#400C0C] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#F2D98D]/70">
                  <CheckCircle2 size={12} className="text-[#F2D98D]" /> 
                  Preview Generated: {new Date(store.spinDrawPreview.createdAt).toLocaleTimeString()}
                </div>
                {renderPairings(store.spinDrawPreview.slots)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#731414]/50 bg-[#260505]/50 py-16 text-center">
                <Shuffle size={32} className="mb-4 text-[#731414]" />
                <span className="text-sm font-bold uppercase tracking-wide text-white/50">Ready to spin</span>
                <span className="mt-1 text-xs text-white/30">Klik Spin Again untuk membuat preview.</span>
              </div>
            )}
          </div>
        </AdminPanel>
      </div>

      <MiniBracketPreview bracket={store.bracket} teamsById={teamsById} />
    </div>
  );
}
