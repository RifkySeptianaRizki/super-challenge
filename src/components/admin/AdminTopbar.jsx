import { Link } from "react-router-dom";
import { Home, ChevronRight, Search, Menu } from "lucide-react";

export default function AdminTopbar({ title, subtitle, isOpen, setIsOpen }) {
  return (
    <header className="relative z-30 shrink-0">
      <div className="flex min-w-0 items-center justify-between gap-2 px-1 pb-2 pt-1 sm:gap-4 sm:px-2 md:px-4 lg:px-6">
        {/* kiri: menu + breadcrumb */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {/* tombol menu mobile */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#731414]/50 bg-[#260505] text-white/70 shadow-sm transition hover:bg-[#400C0C] hover:text-white sm:h-11 sm:w-11 sm:rounded-2xl lg:hidden"
            aria-label={isOpen ? "Tutup menu admin" : "Buka menu admin"}
            aria-expanded={isOpen}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            {/* breadcrumb chip glassy */}
            <div className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full bg-[#120303]/80 px-3 py-1.5 text-[11px] font-bold text-white/60 shadow-sm ring-1 ring-[#731414]/40 sm:gap-2 sm:px-4 sm:text-xs">
              <Link
                to="/"
                className="inline-flex shrink-0 items-center gap-1.5 transition hover:text-[#F2D98D]"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <ChevronRight className="h-3 w-3 text-white/30" />
              <span className="hidden text-[#F22738] sm:inline">Super Admin</span>
              <ChevronRight className="hidden h-3 w-3 text-white/30 sm:block" />
              <span className="min-w-0 max-w-[140px] truncate text-white sm:max-w-[220px] lg:max-w-[320px]" title={title || "Dashboard"}>
                {title || "Dashboard"}
              </span>
            </div>
            {subtitle && (
              <p className="mt-1 hidden truncate pl-2 text-[11px] font-semibold text-white/35 sm:block lg:hidden" title={subtitle}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* kanan: search + CTA */}
        <div className="hidden min-w-0 shrink-0 items-center gap-3 md:flex lg:gap-4">
          {/* search pill desktop */}
          <div className="hidden min-w-0 items-center gap-2 rounded-full bg-[#120303]/80 px-4 py-2 text-sm text-white/50 shadow-inner ring-1 ring-[#731414]/40 backdrop-blur md:flex md:w-56 xl:w-72">
            <Search className="h-4 w-4 shrink-0 text-[#F22738]" />
            <input
              type="text"
              className="min-w-0 flex-1 border-none bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
              placeholder="Pencarian cepat..."
            />
          </div>

          <Link
            to="/"
            className="hidden shrink-0 items-center gap-2 rounded-full bg-[#F22738] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_15px_rgba(242,39,56,0.3)] transition hover:-translate-y-0.5 hover:bg-white hover:text-[#260505] md:inline-flex xl:px-5"
          >
            Public Site &rarr;
          </Link>
        </div>
      </div>
    </header>
  );
}
