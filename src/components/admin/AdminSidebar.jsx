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

  const filteredTabs = tabs.filter((tab) =>
    tab.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const asideWidth = isMobile ? "w-[320px]" : isOpen ? "w-[360px]" : "w-[80px]";

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Wrapper */}
      <aside
        className={cn(
          "relative flex h-full flex-col rounded-r-[35px] border-r border-[#731414]/30 bg-[#120303]/90 backdrop-blur-xl text-white transition-[width,transform] duration-300 ease-in-out z-50",
          asideWidth,
          isMobile && !isOpen ? "-translate-x-full fixed inset-y-0 left-0" : "translate-x-0",
          isMobile && isOpen ? "fixed inset-y-0 left-0" : ""
        )}
      >
        <div className="relative flex h-full flex-1">
          {/* LEFT ICON RAIL */}
          <div className="flex w-[80px] flex-col items-center justify-between rounded-r-[35px] pb-6 pt-5 bg-[#0a0101]/80 shadow-2xl z-20">
            <div className="flex flex-col items-center gap-4">
              {/* logo */}
              <Link
                to="/"
                className="group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl transition-all"
              >
                <img
                  src="/super-ml-logo.png"
                  alt="SC"
                  className="relative z-10 h-10 w-10 object-contain"
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
              <nav className="mt-4 flex flex-col items-center gap-3">
                <Link
                  to="/"
                  className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#260505] text-[#F2D98D] shadow-sm ring-1 ring-[#731414]/50 hover:bg-[#731414]"
                >
                  <Home className="relative z-10 h-5 w-5" />
                </Link>

                <div className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#1a0303] text-white/40 shadow-sm ring-1 ring-[#731414]/30 hover:bg-[#260505] hover:text-[#F22738]">
                  <Search className="relative z-10 h-5 w-5" />
                </div>

                <div className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#1a0303] text-white/40 shadow-sm ring-1 ring-[#731414]/30 hover:bg-[#260505] hover:text-[#F22738]">
                  <Mail className="relative z-10 h-5 w-5" />
                </div>

                <div className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#1a0303] text-white/40 shadow-sm ring-1 ring-[#731414]/30 hover:bg-[#260505] hover:text-[#F22738]">
                  <Bell className="relative z-10 h-5 w-5" />
                </div>
              </nav>
            </div>

            {/* settings bottom */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onLogout}
                type="button"
                className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#260505] text-[#F22738] shadow-sm ring-1 ring-[#731414]/50 hover:bg-[#F22738] hover:text-white"
              >
                <LogOut className="relative z-10 h-5 w-5 pl-1" />
              </button>
            </div>
          </div>

          {/* RIGHT PANEL – panel menu */}
          {(isOpen || isMobile) && (
            <div className="flex min-w-0 flex-1 flex-col px-4 pt-5 pb-6">
              {/* header kecil */}
              <div className="mb-6 mt-0 flex items-center justify-between gap-2 px-2">
                <img
                  src="/superchallange-lanjang.png"
                  alt="Super Challenge"
                  className="h-8 w-auto object-contain"
                />

                {isMobile && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#260505] text-white/50 shadow-sm ring-1 ring-[#731414] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* kartu utama: menu list */}
              <div className="relative -m-1 flex h-full flex-1 flex-col rounded-3xl border border-[#731414]/30 bg-[#260505]/40 shadow-xl overflow-hidden">
                <div className="relative z-10 flex h-full flex-col">
                  {/* search */}
                  <div className="border-b border-[#731414]/30 px-3 pb-3 pt-3">
                    <div className="flex items-center rounded-2xl bg-[#120303]/80 px-3 py-2 text-xs text-white/60 ring-1 ring-[#731414]/40">
                      <Search className="mr-2 h-4 w-4 text-[#F22738]" />
                      <input
                        type="text"
                        placeholder="Cari menu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/30"
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
                              if (isMobile) setIsOpen(false);
                            }}
                            className={cn(
                              "group flex w-full items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200",
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
                            <span className="text-xs font-bold uppercase tracking-wider">
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
                    <div className="flex items-center justify-between">
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
