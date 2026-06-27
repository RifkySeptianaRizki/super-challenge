import { AdminButton, AdminPanel, SectionHeader } from "../AdminUI";
import { RefreshCw, ScrollText } from "lucide-react";
import { useState } from "react";

export default function AuditLogs({ store, runAction }) {
  const [renderedAt] = useState(() => Date.now());

  return (
    <div className="min-w-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title="Audit Logs"
        description="Riwayat perubahan data oleh admin dari Supabase. Data ini tidak diakses oleh public."
        action={
          <AdminButton className="w-full sm:w-auto" variant="secondary" onClick={() => runAction(store.refreshAdminData, "Audit logs refreshed.")}>
            <RefreshCw size={16} /> Refresh Logs
          </AdminButton>
        }
      />
      
      <AdminPanel className="p-0 overflow-hidden" icon={ScrollText}>
        <div className="max-w-full overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[900px] text-left text-sm text-white/80">
            <thead className="bg-[#400C0C]/50 border-b border-[#731414]/50">
              <tr>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-[#F2D98D] text-xs w-48">Timestamp</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-white/50 text-xs w-48">Action</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-white/50 text-xs w-48">Entity</th>
                <th className="px-6 py-4 font-black uppercase tracking-widest text-white/50 text-xs">Entity ID / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#731414]/20">
              {(store.auditLogs || []).map((log) => {
                const date = new Date(log.created_at);
                const isRecent = (renderedAt - date.getTime()) < 3600000;
                
                return (
                  <tr key={log.id} className="transition-colors hover:bg-[#731414]/10 group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white/90">{date.toLocaleDateString()}</span>
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/40">{date.toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                        isRecent 
                          ? "bg-[#F22738]/20 text-[#F22738] border border-[#F22738]/30" 
                          : "bg-[#260505] text-[#F2D98D] border border-[#731414]"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-white/70">
                      {log.entity}
                    </td>
                    <td className="px-6 py-4">
                      <code className="rounded bg-[#120303] px-2 py-1 text-xs font-mono text-white/60">
                        {log.entity_id || "N/A"}
                      </code>
                    </td>
                  </tr>
                );
              })}
              {(!store.auditLogs || store.auditLogs.length === 0) && (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 opacity-50">
                      <ScrollText size={32} className="text-[#F2D98D]" />
                      <p className="text-sm font-bold uppercase tracking-wide">Audit log belum tersedia</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </div>
  );
}
