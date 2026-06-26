import { useState } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1a0303] text-white selection:bg-[#F22738]/30 selection:text-white">
      {/* Deep esports background */}
      <div className="pointer-events-none fixed inset-0 bg-[#260505] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#731414]/40 via-[#260505] to-[#120303]" />
      <div className="pointer-events-none fixed inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] mix-blend-overlay" />

      <div className="relative z-10 flex h-full">

        {/* SIDEBAR DESKTOP */}
        <div className="hidden h-full lg:flex">
          <AdminSidebar
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            onLogout={onLogout}
            isOpen={sidebarOpen}
            setIsOpen={setSidebarOpen}
            status={status}
            adminEmail={adminEmail}
          />
        </div>

        {/* KOLOM KANAN / CONTENT */}
        <div className="min-w-0 flex flex-1 flex-col h-full pt-3 md:pt-4 px-3 md:px-4 pb-3 md:pb-4">
          {/* KARTU GLASS: navbar + outlet menyatu */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <AdminTopbar
              title={title}
              subtitle={subtitle}
              isOpen={sidebarOpen}
              setIsOpen={setSidebarOpen}
            />

            <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-3 md:px-6 md:pb-6">
              <div className="mx-auto flex max-w-[1600px] flex-col gap-5 md:gap-6">
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
            onTabChange={onTabChange}
            onLogout={onLogout}
            isOpen={sidebarOpen}
            setIsOpen={setSidebarOpen}
            status={status}
            adminEmail={adminEmail}
            isMobile
          />
        </div>
      </div>
    </div>
  );
}
