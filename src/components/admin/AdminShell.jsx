import { useCallback, useEffect, useRef, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminShell({
  tabs,
  activeTab,
  onTabChange,
  title,
  subtitle,
  status,
  adminEmail,
  onLogout,
  children,
}) {
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const mainRef = useRef(null);

  const handleTabChange = useCallback((tabId) => {
    onTabChange(tabId);
    setMobileSidebarOpen(false);
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [onTabChange]);

  useEffect(() => {
    if (!mobileSidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

  useEffect(() => {
    if (!mobileSidebarOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileSidebarOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const closeMobileSidebar = (event) => {
      if (event.matches) {
        setMobileSidebarOpen(false);
      }
    };

    closeMobileSidebar(mediaQuery);
    mediaQuery.addEventListener("change", closeMobileSidebar);
    return () => mediaQuery.removeEventListener("change", closeMobileSidebar);
  }, []);

  return (
    <div className="relative h-dvh min-h-dvh w-full overflow-x-hidden bg-[#1a0303] text-white selection:bg-[#F22738]/30 selection:text-white">
      {/* Deep esports background */}
      <div className="pointer-events-none fixed inset-0 bg-[#260505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#731414]/40 via-[#260505] to-[#120303]" />
      <div className="pointer-events-none fixed inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] mix-blend-overlay" />

      <div className="relative z-10 flex h-full min-h-0 w-full overflow-x-hidden">

        {/* SIDEBAR DESKTOP */}
        <div className="hidden h-full shrink-0 lg:flex">
          <AdminSidebar
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onLogout={onLogout}
            isOpen={desktopSidebarOpen}
            setIsOpen={setDesktopSidebarOpen}
            status={status}
            adminEmail={adminEmail}
          />
        </div>

        {/* KOLOM KANAN / CONTENT */}
        <div className="flex h-full min-w-0 flex-1 flex-col px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
          {/* KARTU GLASS: navbar + outlet menyatu */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <AdminTopbar
              title={title}
              subtitle={subtitle}
              isOpen={mobileSidebarOpen}
              setIsOpen={setMobileSidebarOpen}
            />

            <main
              ref={mainRef}
              className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-1 pb-4 pt-3 sm:px-2 md:px-4 lg:px-6"
            >
              <div className="mx-auto flex w-full max-w-[1600px] min-w-0 flex-col gap-5 md:gap-6">
                {children}
              </div>
            </main>
          </div>
        </div>

        {/* MOBILE SIDEBAR OVERLAY */}
        <div className="lg:hidden">
          <AdminSidebar
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onLogout={onLogout}
            isOpen={mobileSidebarOpen}
            setIsOpen={setMobileSidebarOpen}
            status={status}
            adminEmail={adminEmail}
            isMobile
          />
        </div>
      </div>
    </div>
  );
}
