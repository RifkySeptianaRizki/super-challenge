import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "../../lib/cn";
import TeamLogo from "../TeamLogo";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import AdminShell from "./AdminShell";

export { AdminSidebar, AdminTopbar, AdminShell };

export const adminPanelClass =
  "rounded-2xl border border-[#731414]/20 bg-[#120303]/60 shadow-[0_20px_60px_-15px_rgba(242,39,56,0.1)] backdrop-blur-md transition-all duration-300";

export const adminFieldClass =
  "min-h-11 w-full rounded-xl border border-[#731414]/50 bg-[#260505]/80 px-4 text-sm font-semibold text-white outline-none transition-all placeholder:text-white/30 focus:border-[#F22738] focus:bg-[#400C0C] focus:ring-4 focus:ring-[#F22738]/20 disabled:cursor-not-allowed disabled:opacity-50";

export function AdminButton({
  children,
  className,
  icon: Icon,
  variant = "primary",
  size = "md",
  loading = false,
  ...props
}) {
  const variants = {
    primary: "border-[#F22738] bg-[#F22738] text-white shadow-[0_0_15px_rgba(242,39,56,0.4)] hover:shadow-[0_0_25px_rgba(242,39,56,0.6)] hover:bg-white hover:border-white hover:text-[#260505]",
    secondary: "border-[#731414] bg-[#400C0C] text-white hover:border-[#F2D98D] hover:bg-[#F2D98D]/10 hover:text-[#F2D98D]",
    ghost: "border-transparent bg-transparent text-white/60 hover:bg-[#731414]/40 hover:text-white",
    danger: "border-[#F22738]/50 bg-[#F22738]/10 text-[#F22738] hover:bg-[#F22738] hover:text-white",
    gold: "border-[#F2D98D] bg-[#F2D98D] text-[#260505] shadow-[0_0_15px_rgba(242,217,141,0.4)] hover:bg-white hover:border-white",
  };
  const sizes = {
    sm: "min-h-9 px-4 text-xs",
    md: "min-h-11 px-5 text-sm",
    lg: "min-h-12 px-6 text-sm",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border-2 font-black uppercase tracking-wider transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={18} /> : null}
      {children}
    </button>
  );
}

export function AdminInput({ className, ...props }) {
  return <input className={cn(adminFieldClass, className)} {...props} />;
}

export function AdminSelect({ className, children, ...props }) {
  return (
    <select className={cn(adminFieldClass, "appearance-none pr-10 bg-no-repeat bg-[url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23F2D98D\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"></polyline></svg>')] bg-[position:calc(100%-12px)_center] bg-[length:16px_16px]", className)} {...props}>
      {children}
    </select>
  );
}


export function AdminPageHeader({ eyebrow, title, description, action, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="max-w-xl space-y-2">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#F2D98D]/80">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold text-white lg:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-white/60">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="relative flex-shrink-0">
          {action}
        </div>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function AdminPanel({ children, className, title, caption, action, icon: Icon }) {
  return (
    <div className={cn(adminPanelClass, "flex flex-col p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-5 flex flex-col gap-3 border-b border-[#731414]/30 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F22738]/10 text-[#F22738]">
                 <Icon size={20} />
              </div>
            )}
            <div>
              {title && <h3 className="text-lg font-bold text-white">{title}</h3>}
              {caption && <p className="mt-0.5 text-xs text-[#F2D98D]/70">{caption}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function StatsCard({ label, value, caption, icon: Icon, tone = "red" }) {
  const toneStyles = {
    red: { 
      wrapper: "bg-gradient-to-br from-[#F22738]/15 via-[#F22738]/5 to-[#120303]/60 border-[#F22738]/30",
      icon: "text-[#F22738]", 
      dot: "bg-[#F22738]/70"
    },
    gold: { 
      wrapper: "bg-gradient-to-br from-[#F2D98D]/15 via-[#F2D98D]/5 to-[#120303]/60 border-[#F2D98D]/30",
      icon: "text-[#F2D98D]", 
      dot: "bg-[#F2D98D]/70"
    },
    green: { 
      wrapper: "bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-[#120303]/60 border-emerald-500/30",
      icon: "text-emerald-500", 
      dot: "bg-emerald-400/70"
    }
  };
  const t = toneStyles[tone] || toneStyles.red;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 md:p-6",
        "shadow-[0_22px_55px_-32px_rgba(242,39,56,0.3)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5",
        t.wrapper
      )}
    >
      {/* highlight glas */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -right-6 -top-8 h-16 w-16 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 left-0 h-20 w-20 rounded-full bg-white/5 blur-2xl" />
      </div>

      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
            <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />
            <span>{label}</span>
          </p>
          <p className="mt-2 text-2xl md:text-3xl font-black text-white">{value}</p>
          {caption && <p className="mt-1 text-[10px] text-white/40">{caption}</p>}
        </div>
        {Icon ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 shadow-inner">
            <Icon className={cn("h-5 w-5", t.icon)} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ActionCard({ title, description, icon: Icon, action, tone = "default", onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        adminPanelClass,
        "group relative flex min-h-[140px] w-full flex-col items-start gap-3 p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(242,39,56,0.15)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:-translate-y-0 disabled:hover:shadow-none",
        tone === "danger" ? "border-[#F22738]/30 hover:border-[#F22738]/60" : "hover:border-[#F2D98D]/40"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      
      <div className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
        tone === "danger" ? "bg-[#F22738]/20 text-[#F22738]" : "bg-[#F2D98D]/15 text-[#F2D98D]"
      )}>
        {Icon && <Icon size={20} />}
      </div>
      
      <div className="relative mt-1">
        <h4 className="text-base font-bold text-white">{title}</h4>
        <p className="mt-1 text-xs leading-relaxed text-white/50">{description}</p>
      </div>
      
      {action && (
        <div className={cn(
          "relative mt-auto text-[10px] font-bold uppercase tracking-wider transition-colors",
          tone === "danger" ? "text-[#F22738] group-hover:text-[#ff4d5e]" : "text-[#F2D98D] group-hover:text-white"
        )}>
          {action} &rarr;
        </div>
      )}
    </button>
  );
}

export function SyncStatusChip({ online, cacheStatus, error }) {
  return (
    <div
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-[10px] font-black uppercase tracking-wider shadow-inner transition-all",
        online
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]"
          : "border-[#F2D98D]/40 bg-[#F2D98D]/10 text-[#F2D98D] shadow-[inset_0_0_10px_rgba(242,217,141,0.15)]"
      )}
      title={error || ""}
    >
      {online ? <CheckCircle2 size={14} className="animate-pulse" /> : <AlertTriangle size={14} />}
      <span>{online ? "Connected" : cacheStatus || "Cache Mode"}</span>
    </div>
  );
}

export function StatusBadge({ status }) {
  const normalized = (status || "waiting").toLowerCase();
  
  const styles = {
    completed: "border-[#F2D98D]/50 bg-[#F2D98D]/15 text-[#F2D98D] shadow-[0_0_10px_rgba(242,217,141,0.2)]",
    live: "border-[#F22738] bg-[#F22738] text-white shadow-[0_0_10px_rgba(242,39,56,0.5)] animate-pulse",
    upcoming: "border-blue-400/40 bg-blue-400/15 text-blue-300",
    waiting: "border-white/20 bg-white/10 text-white/60",
    empty: "border-white/20 bg-white/10 text-white/60",
    active: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
  };

  const currentStyle = styles[normalized] || styles.waiting;

  return (
    <span className={cn("inline-flex h-6 items-center justify-center rounded-lg border px-2.5 text-[9px] font-black uppercase tracking-widest", currentStyle)}>
      {normalized === 'empty' ? 'waiting' : normalized}
    </span>
  );
}

export function SearchField({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
      <AdminInput
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pl-11"
      />
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon = ShieldCheck }) {
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#731414]/50 bg-[#400C0C]/30 px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#731414]/30 text-[#F2D98D]">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-black uppercase tracking-wide text-white">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm font-medium text-white/50">{description}</p>}
    </div>
  );
}

export function AdminModal({ open, title, description, children, footer, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[#F22738]/30 bg-gradient-to-br from-[#260505] to-[#120303] shadow-[0_20px_70px_rgba(0,0,0,0.7)]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDMiLz4KPC9zdmc+')] mix-blend-overlay" />
        
        <div className="relative z-10 flex items-start justify-between border-b border-[#731414]/50 bg-[#400C0C]/40 px-6 py-5">
          <div>
            <h2 className="text-xl font-black uppercase tracking-wide text-white">{title}</h2>
            {description && <p className="mt-1 text-sm font-medium text-[#F2D98D]/70">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition-all hover:bg-[#F22738]/20 hover:text-[#F22738]"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="relative z-10 max-h-[60vh] overflow-y-auto p-6 no-scrollbar">
          {children}
        </div>
        
        {footer && (
          <div className="relative z-10 flex flex-wrap justify-end gap-3 border-t border-[#731414]/50 bg-[#400C0C]/40 px-6 py-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", tone = "danger", onCancel, onConfirm }) {
  return (
    <AdminModal
      open={open}
      title={title}
      description={message}
      onClose={onCancel}
      footer={
        <>
          <AdminButton variant="ghost" onClick={onCancel}>Cancel</AdminButton>
          <AdminButton variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </AdminButton>
        </>
      }
    >
      <div className="flex gap-4 rounded-xl border border-[#F22738]/30 bg-[#F22738]/10 p-5">
        <AlertTriangle className="shrink-0 text-[#F22738]" size={24} />
        <div>
          <h4 className="text-sm font-black uppercase tracking-wide text-[#F22738]">Perhatian</h4>
          <p className="mt-1 text-sm font-medium leading-relaxed text-white/70">Aksi ini bersifat permanen dan akan langsung mengubah data di database Supabase.</p>
        </div>
      </div>
    </AdminModal>
  );
}

// Shared components extracted from AdminDashboard
export function SectionHeader({ title, description, action }) {
  return (
    <AdminPageHeader
      eyebrow="Super Challenge CMS"
      title={title}
      description={description}
      action={action}
    />
  );
}

export function TeamPill({ team, seed, muted = false }) {
  const code = team?.code || "TBA";
  const name = team?.name || team?.fullName || "Waiting";

  return (
    <div className={cn(
      "relative flex min-w-0 flex-col justify-center rounded-xl border p-3 transition-all",
      muted 
        ? "border-[#731414]/30 bg-[#260505]/50 opacity-60 grayscale" 
        : "border-[#731414] bg-gradient-to-br from-[#400C0C] to-[#260505] shadow-lg shadow-black/20"
    )}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <TeamLogo team={team} code={code} name={name} size="sm" variant={muted ? "subtle" : "default"} />
          <span className={cn("truncate text-sm font-black uppercase tracking-wide", muted ? "text-white/50" : "text-white")} title={name}>
            {code}
          </span>
        </div>
        {seed && (
          <span className="shrink-0 rounded bg-[#F22738]/20 px-1.5 py-0.5 text-[10px] font-black uppercase text-[#F22738]">
            S{seed}
          </span>
        )}
      </div>
      <div className={cn("mt-1 truncate text-[10px] font-bold uppercase tracking-wider", muted ? "text-white/30" : "text-[#F2D98D]/70")} title={name}>
        {name}
      </div>
    </div>
  );
}
