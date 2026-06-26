import { AlertTriangle, DatabaseBackup, Download, FileJson, Upload } from "lucide-react";
import { ActionCard, AdminPanel, SectionHeader } from "../AdminUI";

export default function BackupImportExport({ store, runAction, fileInputRef, exportData, formatImportSummary }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title="Backup & Export"
        description="Amankan data tournament. Import akan divalidasi sebelum menimpa data saat ini."
      />
      
      <div className="grid gap-6 md:grid-cols-3">
        <ActionCard
          title="Export JSON"
          description="Download data terbaru dari Supabase termasuk audit snapshot."
          icon={Download}
          action="Download Backup"
          onClick={exportData}
        />
        <ActionCard
          title="Import JSON"
          description="Migrasikan file JSON backup ke Supabase."
          icon={Upload}
          action="Pilih File"
          onClick={() => fileInputRef.current?.click()}
        />
        <ActionCard
          title="Upload Local"
          description="Ambil data dari localStorage browser saat ini ke Supabase."
          icon={FileJson}
          action="Sync Data"
          onClick={() => runAction(store.importLegacyLocalStorage, formatImportSummary || "Browser localStorage uploaded to Supabase.")}
        />
      </div>

      <AdminPanel 
        title="Danger Zone" 
        caption="Tindakan destruktif yang akan menghapus data." 
        icon={AlertTriangle}
        className="border-[#F22738]/40 shadow-[0_0_20px_rgba(242,39,56,0.15)]"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-medium leading-relaxed text-white/60">
              Aksi reset akan menghapus data yang dipilih. Sistem secara otomatis membuat snapshot backup sebelum proses penghapusan dilakukan sebagai langkah pengamanan.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <button 
              onClick={() => window.confirm("Reset semua hasil bracket?") && runAction(store.resetBracketResults, "Bracket results reset.")} 
              className="rounded-xl border border-[#731414]/50 bg-[#400C0C]/50 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:border-[#F2D98D]/50 hover:bg-[#F2D98D]/10 hover:text-[#F2D98D]"
            >
              Reset Results Only
            </button>
            <button 
              onClick={() => window.confirm("Reset SEMUA data tournament (Teams, Bracket, Standings) ke kondisi default?") && runAction(store.resetData, "All data reset to default.")} 
              className="rounded-xl border-2 border-[#F22738]/50 bg-[#F22738]/10 px-5 py-3 text-xs font-black uppercase tracking-wider text-[#F22738] shadow-[0_0_15px_rgba(242,39,56,0.3)] transition-all hover:bg-[#F22738] hover:text-white"
            >
              Reset All Data
            </button>
          </div>
        </div>
      </AdminPanel>

      <div className="flex items-center justify-between rounded-xl border border-[#731414]/30 bg-[#260505]/40 px-6 py-4 text-xs font-bold uppercase tracking-wider text-white/50">
        <div className="flex items-center gap-2">
           <DatabaseBackup size={16} /> Data Status
        </div>
        <span>
          Last updated: <span className="text-[#F2D98D]">{store.tournamentConfig?.updatedAt ? new Date(store.tournamentConfig.updatedAt).toLocaleString() : "Unknown"}</span>
        </span>
      </div>
    </div>
  );
}
