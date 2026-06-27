import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Home,
  Search,
  Mail,
  Bell,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "../../lib/cn";

export default function AdminSidebar({
  tabs,
  activeTab,
  onTabChange,
  onLogout,
  isOpen,
  setIsOpen,
  status,
  isMobile,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const closeSidebar = () => setIsOpen(false);

  const filteredTabs = tabs.filter((tab) =>
    tab.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const asideClasses = cn(
    "z-50 flex min-h-0 flex-col border-r border-[#731414]/30 bg-[#120303]/95 text-white shadow-2xl shadow-black/40 backdrop-blur-xl",
    isMobile
      ? "fixed inset-y-0 h-dvh w-[280px] max-w-[86vw] rounded-r-2xl transition-[left] duration-300 ease-out"
      : "relative h-full rounded-r-[35px] transition-[width] duration-300 ease-in-out",
    isMobile
      ? isOpen
        ? "left-0"
        : "pointer-events-none -left-[280px]"
      : isOpen
        ? "w-[320px] xl:w-[360px]"
        : "w-[80px]"
  );
  const expanded = isOpen || isMobile;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-label="Tutup menu admin"
        />
      )}

      {/* Sidebar Wrapper */}
      <aside
        className={asideClasses}
        aria-hidden={isMobile && !isOpen}
        aria-modal={isMobile && isOpen ? "true" : undefined}
        role={isMobile ? "dialog" : "navigation"}
      >
        <div className="relative flex h-full min-h-0 flex-1 overflow-hidden">
          {/* LEFT ICON RAIL */}
          <div className="z-20 flex w-[64px] shrink-0 flex-col items-center justify-between rounded-r-2xl bg-[#0a0101]/80 pb-4 pt-4 shadow-2xl sm:w-[72px] sm:pb-5 lg:w-[80px] lg:rounded-r-[35px] lg:pb-6 lg:pt-5">
            <div className="flex flex-col items-center gap-4">
              {/* logo */}
              <Link
                to="/"
                onClick={isMobile ? closeSidebar : undefined}
                className="group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl transition-all sm:h-12 sm:w-12 lg:h-14 lg:w-14"
              >
                <img
                  src="/super-ml-logo.png"
                  alt="SC"
                  className="relative z-10 h-8 w-8 object-contain sm:h-9 sm:w-9 lg:h-10 lg:w-10"
                />
              </Link>

              {/* collapse toggle desktop */}
              {!isMobile && (
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="group flex h-11 w-11 items-center justify-center rounded-2xl bg-[#260505] text-white/50 shadow-sm ring-1 ring-[#731414]/50 hover:bg-[#F22738]/20 hover:text-white"
                >
                  <ChevronRight
                    className={cn(
                      "h-5 w-5 transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
              )}

              {/* main icons */}
              <nav className="mt-3 flex flex-col items-center gap-2.5 sm:mt-4 sm:gap-3">
                <Link
                  to="/"
                  onClick={isMobile ? closeSidebar : undefined}
                  className="group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#260505] text-[#F2D98D] shadow-sm ring-1 ring-[#731414]/50 hover:bg-[#731414] sm:h-12 sm:w-12"
                >
                  <Home className="relative z-10 h-5 w-5" />
                </Link>

                <div className="group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#1a0303] text-white/40 shadow-sm ring-1 ring-[#731414]/30 hover:bg-[#260505] hover:text-[#F22738] sm:h-12 sm:w-12">
                  <Search className="relative z-10 h-5 w-5" />
                </div>

                <div className="group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#1a0303] text-white/40 shadow-sm ring-1 ring-[#731414]/30 hover:bg-[#260505] hover:text-[#F22738] sm:h-12 sm:w-12">
                  <Mail className="relative z-10 h-5 w-5" />
                </div>

                <div className="group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#1a0303] text-white/40 shadow-sm ring-1 ring-[#731414]/30 hover:bg-[#260505] hover:text-[#F22738] sm:h-12 sm:w-12">
                  <Bell className="relative z-10 h-5 w-5" />
                </div>
              </nav>
            </div>

            {/* settings bottom */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => {
                  closeSidebar();
                  onLogout?.();
                }}
                type="button"
                className="group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#260505] text-[#F22738] shadow-sm ring-1 ring-[#731414]/50 hover:bg-[#F22738] hover:text-white sm:h-12 sm:w-12"
              >
                <LogOut className="relative z-10 h-5 w-5 pl-1" />
              </button>
            </div>
          </div>

          {/* RIGHT PANEL – panel menu */}
          {expanded && (
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden px-3 pb-4 pt-4 sm:px-4 sm:pb-5 lg:pb-6 lg:pt-5">
              {/* header kecil */}
              <div className="mb-4 mt-0 flex min-w-0 items-center justify-between gap-2 px-1 sm:mb-5 sm:px-2 lg:mb-6">
                <img
                  src="/superchallange-lanjang.png"
                  alt="Super Challenge"
                  className="h-7 min-w-0 max-w-[140px] object-contain sm:h-8 sm:max-w-[150px] lg:max-w-none"
                />

                {isMobile && (
                  <button
                    onClick={closeSidebar}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#260505] text-white/50 shadow-sm ring-1 ring-[#731414] hover:text-white"
                    aria-label="Tutup menu admin"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* kartu utama: menu list */}
              <div className="relative -m-1 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#731414]/30 bg-[#260505]/40 shadow-xl lg:rounded-3xl">
                <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                  {/* search */}
                  <div className="border-b border-[#731414]/30 px-3 pb-3 pt-3">
                    <div className="flex items-center rounded-2xl bg-[#120303]/80 px-3 py-2 text-xs text-white/60 ring-1 ring-[#731414]/40">
                      <Search className="mr-2 h-4 w-4 shrink-0 text-[#F22738]" />
                      <input
                        type="text"
                        placeholder="Cari menu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/30"
                      />
                    </div>
                  </div>

                  {/* menu scrollable */}
                  <div className="mt-2 flex-1 min-h-0 space-y-1 overflow-y-auto px-3 pb-3 pt-1 no-scrollbar">
                    {filteredTabs.length > 0 ? (
                      filteredTabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              onTabChange(tab.id);
                              if (isMobile) closeSidebar();
                            }}
                            className={cn(
                              "group flex w-full min-w-0 items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200",
                              active
                                ? "bg-[#731414]/40 text-white shadow-inner"
                                : "text-white/60 hover:bg-[#400C0C]/40 hover:text-white"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                                active
                                  ? "bg-[#F22738] text-white shadow-[0_0_10px_rgba(242,39,56,0.3)]"
                                  : "bg-[#1a0303] text-white/40 group-hover:text-white/80 group-hover:bg-[#260505]"
                              )}
                            >
                              <Icon size={18} />
                            </div>
                            <span className="min-w-0 truncate text-xs font-bold uppercase tracking-wider">
                              {tab.label}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="py-4 text-center text-xs text-white/40">
                        Menu tidak ditemukan.
                      </div>
                    )}
                  </div>

                  {/* Status Card At Bottom of Sidebar Glass */}
                  <div className="p-4 border-t border-[#731414]/30 bg-[#120303]/40">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <span className="text-[10px] font-black uppercase text-[#F2D98D] tracking-widest">
                        Sys. Status
                      </span>
                      {status}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
