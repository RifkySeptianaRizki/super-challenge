import { AlertTriangle, CheckCircle2, Shuffle, Users } from "lucide-react";
import {
  AdminButton,
  AdminPanel,
  SectionHeader,
  StatsCard,
} from "../AdminUI";
import { getBracketSize, getByeCount, isPowerOfTwo } from "../../../lib/bracketEngine";
import TeamLogo from "../../TeamLogo";

const byeModes = [
  { value: "seeded", label: "Seeded BYE" },
  { value: "random", label: "Random BYE" },
  { value: "manual", label: "Manual BYE" },
];

export default function ParticipantsFormat({ store, runAction }) {
  const activeParticipants = store.getActiveParticipants();
  const participantIds = new Set(activeParticipants.map((team) => team.id));
  const participantCount = activeParticipants.length;
  const bracketSize = getBracketSize(participantCount) || 0;
  const byeCount = participantCount >= 2 ? getByeCount(participantCount) : 0;
  const canGenerate = participantCount >= 2 && participantCount <= 16;

  const toggleParticipant = (team) => {
    if (team.dropped) return;
    const next = !participantIds.has(team.id);
    return runAction(
      () => store.setTeamParticipantState(team.id, {
        isParticipant: next,
        is_participant: next,
        checkedIn: next ? team.checkedIn !== false : team.checkedIn,
      }),
      next ? `${team.code} added to tournament.` : `${team.code} removed from tournament.`
    );
  };

  const updateFlag = (team, payload, message) => (
    runAction(() => store.setTeamParticipantState(team.id, payload), message)
  );

  return (
    <div className="min-w-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title="Participants & Format"
        description="Pilih peserta aktif 2-16 tim. Sistem menentukan bracket size dan BYE otomatis."
        action={
          <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:justify-end">
            <select
              value={store.byeMode || "seeded"}
              onChange={(event) => store.setByeMode(event.target.value)}
              className="w-full rounded-xl border-2 border-[#731414] bg-[#400C0C] px-4 py-2.5 text-sm font-black text-white outline-none focus:border-[#F2D98D] sm:w-auto"
            >
              {byeModes.map((mode) => (
                <option key={mode.value} value={mode.value}>{mode.label}</option>
              ))}
            </select>
            <AdminButton
              className="w-full sm:w-auto"
              icon={Shuffle}
              disabled={!canGenerate || store.saving}
              onClick={() => runAction(
                () => store.generateFlexibleBracket(store.byeMode || "seeded"),
                "Flexible bracket generated."
              )}
            >
              Generate Flexible Bracket
            </AdminButton>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Active Participants" value={participantCount} caption="Selected teams" tone="red" />
        <StatsCard label="Bracket Size" value={bracketSize || "-"} caption="Next power of two" tone="gold" />
        <StatsCard label="BYE Count" value={byeCount} caption="Auto-advance slots" tone={byeCount ? "gold" : "green"} />
        <StatsCard label="Playable Matches" value={canGenerate ? participantCount - 1 : 0} caption="Team vs team only" tone="green" />
      </div>

      {!canGenerate && (
        <div className="flex gap-3 rounded-2xl border border-[#F2D98D]/35 bg-[#F2D98D]/10 p-4 text-sm font-bold text-[#F2D98D]">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          Pilih minimal 2 dan maksimal 16 peserta aktif sebelum generate bracket.
        </div>
      )}

      {canGenerate && !isPowerOfTwo(participantCount) && (
        <div className="flex gap-3 rounded-2xl border border-[#F2D98D]/35 bg-[#F2D98D]/10 p-4 text-sm font-bold text-[#F2D98D]">
          <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
          Jumlah tim tidak penuh. Sistem akan menambahkan BYE otomatis agar turnamen tetap berjalan.
        </div>
      )}

      <AdminPanel title="Team Participation" caption="Centang tim yang ikut turnamen aktif. Dropped team tidak bisa masuk draw." icon={Users}>
        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {store.teams.map((team) => {
            const selected = participantIds.has(team.id);
            const dropped = Boolean(team.dropped);
            return (
              <div
                key={team.id}
                className={`min-w-0 rounded-2xl border p-4 ${
                  selected
                    ? "border-[#F2D98D]/45 bg-[#F2D98D]/10"
                    : dropped
                      ? "border-[#F22738]/35 bg-[#F22738]/10 opacity-75"
                      : "border-[#731414]/35 bg-[#260505]/45"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <TeamLogo team={team} code={team.code} name={team.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black uppercase text-white">{team.code}</div>
                    <div className="truncate text-[11px] font-semibold text-white/45">{team.name}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={dropped || store.saving}
                    onChange={() => toggleParticipant(team)}
                    className="h-5 w-5 shrink-0 accent-[#F22738]"
                    aria-label={`Toggle ${team.code} participant`}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={store.saving}
                    onClick={() => updateFlag(team, {
                      checkedIn: team.checkedIn === false,
                      checked_in: team.checkedIn === false,
                    }, `${team.code} check-in updated.`)}
                    className={`rounded-lg border px-2 py-2 text-[10px] font-black uppercase ${
                      team.checkedIn === false
                        ? "border-white/10 bg-black/30 text-white/45"
                        : "border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    {team.checkedIn === false ? "Not Present" : "Checked In"}
                  </button>
                  <button
                    type="button"
                    disabled={store.saving}
                    onClick={() => updateFlag(team, {
                      dropped: !dropped,
                      isParticipant: dropped ? team.isParticipant !== false : false,
                      is_participant: dropped ? team.is_participant !== false : false,
                    }, `${team.code} drop status updated.`)}
                    className={`rounded-lg border px-2 py-2 text-[10px] font-black uppercase ${
                      dropped
                        ? "border-[#F22738]/45 bg-[#F22738]/15 text-[#F22738]"
                        : "border-[#731414]/45 bg-[#120303]/45 text-white/55"
                    }`}
                  >
                    {dropped ? "Dropped" : "Active"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </AdminPanel>
    </div>
  );
}
