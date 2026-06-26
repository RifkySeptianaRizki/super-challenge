import { useState } from "react";
import { getRequiredWins, getSeriesLabel, sanitizeText } from "../../../lib/bracketEngine";
import { AdminButton, AdminPanel, SectionHeader } from "../AdminUI";
import { Save, Settings2 } from "lucide-react";

const boOptions = [1, 3, 5, 7, 9];

export default function SystemSettings({ store, runAction }) {
  const [siteConfig, setSiteConfig] = useState(store.siteConfig);
  const [settings, setSettings] = useState(store.settings);
  const [bestOf, setBestOf] = useState(store.tournamentConfig?.bestOf || 3);

  const save = async () => {
    await store.updateSiteConfig(siteConfig);
    await store.updateSettings(settings);
    if (bestOf !== store.tournamentConfig?.bestOf) {
      const shouldReset = store.hasCompletedResults()
        ? window.confirm("Mengubah format BO akan mereset seluruh hasil pertandingan. Lanjutkan?")
        : true;
      if (shouldReset) {
        await store.updateTournamentSeriesFormat(bestOf, { resetResults: true, keepSchedule: true });
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title="System Settings"
        description="Pengaturan public site dan konfigurasi global turnamen."
        action={
          <AdminButton onClick={() => runAction(save, "Settings saved.")}>
            <Save size={16} /> Save Changes
          </AdminButton>
        }
      />
      
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel title="Tournament Format" caption="Format standar series untuk keseluruhan event." icon={Settings2}>
          <div className="flex flex-col gap-6">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F2D98D]/70">Default Series Format</span>
              <div className="relative mt-2">
                <select
                  value={bestOf}
                  onChange={(event) => setBestOf(Number(event.target.value))}
                  className="w-full appearance-none rounded-xl border border-[#731414]/50 bg-[#120303]/80 px-4 py-3 text-sm font-black text-white outline-none transition-all focus:border-[#F2D98D]"
                >
                  {boOptions.map((option) => (
                    <option key={option} value={option}>{getSeriesLabel(option)} - Requires {getRequiredWins(option)} wins</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                  <div className="border-l border-t border-[#F2D98D] p-1 -rotate-135" />
                </div>
              </div>
            </label>
            
            <label className="relative flex cursor-pointer items-center justify-between rounded-xl border border-[#731414]/30 bg-[#260505]/40 p-5 transition-all hover:border-[#F2D98D]/40">
              <span className="flex flex-col gap-1">
                <span className="text-sm font-black uppercase tracking-wide text-white">Public Admin Button</span>
                <span className="text-xs font-medium text-white/50">Tampilkan tombol Admin di navbar halaman public.</span>
              </span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={Boolean(settings?.showAdminButton)} 
                  onChange={(event) => setSettings({ ...settings, showAdminButton: event.target.checked })} 
                  className="peer sr-only" 
                />
                <div className="h-6 w-11 rounded-full bg-[#120303] border border-[#731414] shadow-inner transition-colors peer-checked:bg-[#F22738]" />
                <div className="absolute left-[3px] top-[3px] h-4.5 w-4.5 rounded-full bg-white/40 transition-all peer-checked:translate-x-5 peer-checked:bg-white" />
              </div>
            </label>
          </div>
        </AdminPanel>

        <AdminPanel title="Public Display" caption="Informasi yang ditampilkan di halaman depan.">
          <div className="flex flex-col gap-5">
            {[
              ["Tournament Name", "tournamentName", "Super Challenge 2026"],
              ["Season / Phase", "season", "Season 1"],
              ["Timezone Label", "timezone", "WIB"],
              ["Hero Title", "heroTitle", "The Ultimate Esports Battle"],
            ].map(([label, key, placeholder]) => (
              <label key={key} className="block relative">
                <span className="absolute -top-2.5 left-3 bg-[#400C0C] px-1 text-[10px] font-black uppercase tracking-widest text-[#F2D98D]/70">{label}</span>
                <input 
                  value={siteConfig?.[key] || ""} 
                  placeholder={placeholder}
                  onChange={(event) => setSiteConfig({ ...siteConfig, [key]: sanitizeText(event.target.value, 80) })} 
                  className="w-full rounded-xl border border-[#731414]/50 bg-[#120303]/60 px-4 py-3.5 text-sm font-bold text-white outline-none transition-all focus:border-[#F2D98D] focus:ring-1 focus:ring-[#F2D98D]/20" 
                />
              </label>
            ))}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
