import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  DatabaseBackup,
  FileJson,
  LayoutDashboard,
  Settings as SettingsIcon,
  Shuffle,
  Swords,
  Users,
} from "lucide-react";

import { AdminShell } from "./admin/AdminUI";
import useTournamentStore from "../store/useTournamentStore";
import { getChampion, validateBracketSchema } from "../lib/bracketEngine";

// Import Views
import Overview from "./admin/views/Overview";
import TeamsAndSeeding from "./admin/views/TeamsAndSeeding";
import DrawAndSeeding from "./admin/views/DrawAndSeeding";
import BracketControl from "./admin/views/BracketControl";
import ScheduleEditor from "./admin/views/ScheduleEditor";
import BackupImportExport from "./admin/views/BackupImportExport";
import SystemSettings from "./admin/views/SystemSettings";
import AuditLogs from "./admin/views/AuditLogs";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "seeding", label: "Teams", icon: Users },
  { id: "draw", label: "Draw & Seeding", icon: Shuffle },
  { id: "bracket", label: "Bracket Control", icon: Swords },
  { id: "schedule", label: "Schedule", icon: CalendarDays },
  { id: "backup", label: "Backup / Export", icon: DatabaseBackup },
  { id: "settings", label: "Settings", icon: SettingsIcon },
  { id: "audit", label: "Audit Logs", icon: FileJson },
];

export default function AdminDashboard({ onLogout, adminUser }) {
  const store = useTournamentStore();
  const refreshAdminData = useTournamentStore((s) => s.refreshAdminData);
  const [activeTab, setActiveTab] = useState("overview");
  const [toast, setToast] = useState(null);
  const [seedIds, setSeedIds] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    refreshAdminData().catch((error) => {
      setToast({ type: "error", message: error.message || "Gagal memuat data admin." });
    });
  }, [refreshAdminData]);

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

  const runAction = async (fn, successMessage) => {
    try {
      const result = await fn();
      showToast("success", typeof successMessage === "function" ? successMessage(result) : successMessage);
      return result;
    } catch (error) {
      showToast("error", error.message || "Action failed.");
      return null;
    }
  };

  const formatImportSummary = (result) => {
    const summary = result?.importSummary;
    if (!summary) return "Data imported and validated.";
    return `Imported ${summary.teams} teams. Logo valid: ${summary.logoValid}, kosong: ${summary.logoEmpty}, invalid: ${summary.logoInvalid}.`;
  };

  const exportData = async () => {
    const data = await store.exportData();
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
      runAction(() => store.importData(readerEvent.target.result), formatImportSummary);
    };
    reader.readAsText(file);
    event.target.value = "";
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
    return store.setBracketSeeds(activeSeedIds.map((teamId, index) => ({
      seedNo: index + 1,
      teamId,
      teamCode: teamsById.get(teamId)?.code || "",
    })));
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

  const selectedCounts = activeSeedIds.reduce((acc, teamId) => {
    if (teamId) acc[teamId] = (acc[teamId] || 0) + 1;
    return acc;
  }, {});

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <Overview store={store} validation={validation} champion={champion} teamsById={teamsById} />;
      case "seeding":
        return <TeamsAndSeeding store={store} teamsById={teamsById} activeSeedIds={activeSeedIds} selectedCounts={selectedCounts} setSeedIds={setSeedIds} runAction={runAction} generateFromSeeds={generateFromSeeds} />;
      case "draw":
        return <DrawAndSeeding store={store} teamsById={teamsById} />;
      case "bracket":
        return <BracketControl store={store} teamsById={teamsById} runAction={runAction} hasDependentResults={hasDependentResults} />;
      case "schedule":
        return <ScheduleEditor store={store} teamsById={teamsById} runAction={runAction} />;
      case "backup":
        return <BackupImportExport store={store} runAction={runAction} fileInputRef={fileInputRef} exportData={exportData} importData={importData} formatImportSummary={formatImportSummary} />;
      case "settings":
        return <SystemSettings store={store} runAction={runAction} />;
      case "audit":
        return <AuditLogs store={store} runAction={runAction} />;
      default:
        return <Overview store={store} validation={validation} champion={champion} teamsById={teamsById} />;
    }
  };

  const activeTabLabel = tabs.find(t => t.id === activeTab)?.label;

  const StatusIndicator = (
    <div className="flex items-center gap-3">
      <div className={`flex h-8 items-center gap-2 rounded-lg border px-3 text-[10px] font-black uppercase tracking-wider ${
        validation.valid 
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" 
          : "border-[#F2D98D]/30 bg-[#F2D98D]/10 text-[#F2D98D]"
      }`}>
        <CheckCircle2 size={14} className={validation.valid ? "" : "animate-pulse"} />
        <span className="hidden sm:inline">{validation.valid ? "Schema Valid" : "Schema Repaired"}</span>
      </div>
      {store.error && (
        <div className="flex h-8 items-center gap-2 rounded-lg border border-[#F22738]/30 bg-[#F22738]/10 px-3 text-[10px] font-black uppercase tracking-wider text-[#F22738]">
          <AlertTriangle size={14} />
          <span className="hidden sm:inline">{store.cacheStatus}: Error</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      <AdminShell
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title={activeTabLabel}
        subtitle={store.tournamentConfig?.tournamentName || "Super Challenge Event"}
        status={StatusIndicator}
        adminEmail={adminUser?.email}
        onLogout={onLogout}
      >
        {renderTab()}
      </AdminShell>

      <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={importData} className="hidden" />
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-right-8 fade-in duration-300 sm:bottom-8 sm:left-auto sm:right-8">
          <div className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 shadow-2xl backdrop-blur-xl sm:w-auto sm:px-6 sm:py-4 ${
            toast.type === "success"
              ? "border-emerald-500/50 bg-[#120303]/90 text-emerald-400 shadow-[0_10px_40px_rgba(16,185,129,0.2)]"
              : "border-[#F22738]/50 bg-[#120303]/90 text-[#F22738] shadow-[0_10px_40px_rgba(242,39,56,0.2)]"
          }`}>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              toast.type === "success" ? "bg-emerald-500/20" : "bg-[#F22738]/20"
            }`}>
              {toast.type === "success" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                {toast.type === "success" ? "Success" : "Error"}
              </span>
              <span className="text-sm font-bold text-white">{toast.message}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
