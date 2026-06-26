import { Link } from "react-router-dom";
import { Home, ChevronRight, Search } from "lucide-react";

export default function AdminTopbar({ title, isOpen, setIsOpen }) {
  return (
    <header className="relative z-10 shrink-0">
      <div className="flex items-center justify-between gap-2 px-2 pb-2 pt-1.5 sm:gap-4 sm:px-4 md:px-6">
        {/* kiri: menu + breadcrumb */}
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {/* tombol menu mobile */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#731414]/50 bg-[#260505] text-white/70 shadow-sm transition hover:bg-[#400C0C] hover:text-white sm:h-11 sm:w-11 lg:hidden"
            aria-label={isOpen ? "Tutup menu admin" : "Buka menu admin"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="min-w-0">
            {/* breadcrumb chip glassy */}
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#120303]/80 px-3 py-1.5 text-[11px] font-bold text-white/60 ring-1 ring-[#731414]/40 shadow-sm sm:gap-2 sm:px-4 sm:text-xs">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 transition hover:text-[#F2D98D]"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <ChevronRight className="h-3 w-3 text-white/30" />
              <span className="hidden text-[#F22738] sm:inline">Super Admin</span>
              <ChevronRight className="hidden h-3 w-3 text-white/30 sm:block" />
              <span className="max-w-[130px] truncate text-white sm:max-w-[200px]">
                {title || "Dashboard"}
              </span>
            </div>
          </div>
        </div>

        {/* kanan: search + CTA */}
        <div className="hidden shrink-0 items-center gap-4 sm:flex">
          {/* search pill desktop */}
          <div className="hidden items-center gap-2 rounded-full bg-[#120303]/80 px-4 py-2 text-sm text-white/50 shadow-inner ring-1 ring-[#731414]/40 backdrop-blur sm:flex md:w-72">
            <Search className="h-4 w-4 text-[#F22738]" />
            <input
              type="text"
              className="flex-1 border-none bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
              placeholder="Pencarian cepat..."
            />
          </div>

          <Link
            to="/"
            className="hidden items-center gap-2 rounded-full bg-[#F22738] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-[0_0_15px_rgba(242,39,56,0.3)] transition hover:-translate-y-0.5 hover:bg-white hover:text-[#260505] sm:inline-flex"
          >
            Public Site &rarr;
          </Link>
        </div>
      </div>
    </header>
  );
}
