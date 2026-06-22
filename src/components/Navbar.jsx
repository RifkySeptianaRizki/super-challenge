import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, Home, CalendarDays, Trophy, Users, GitBranch } from "lucide-react";
import useTournamentStore from "../store/useTournamentStore";

const navLinks = [
  { label: "Home", to: "/", icon: Home },
  { label: "Teams", to: "/teams", icon: Users },
  { label: "Jadwal", to: "/jadwal", icon: CalendarDays },
  { label: "Peringkat", to: "/peringkat", icon: Trophy },
  { label: "Bagan", to: "/bagan", icon: GitBranch },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const settings = useTournamentStore((s) => s.settings);

  return (
    <>
      {/* Toggle Button (Always visible when sidebar is closed) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-50 transition-all duration-300 hover:scale-110 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] ${isOpen ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}
      >
        <img src="/inirasanyasuper.png" alt="Menu" className="w-16 h-16 sm:w-24 sm:h-24 object-contain" />
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 right-0 bottom-0 w-72 sm:w-80 bg-[#0a0000]/95 backdrop-blur-lg border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center">
                <img src="/superchallange-lanjang.png" alt="Super Challenge" className="h-6 object-contain" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                      isActive 
                        ? "bg-[#F22738]/10 text-[#F22738]" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon size={20} className={isActive ? "text-[#F22738]" : "text-gray-500"} strokeWidth={isActive ? 2 : 1.5} />
                    <span className="text-base tracking-wide">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Footer / Settings */}
            {settings?.showAdminButton && (
              <div className="p-4 border-t border-white/10">
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
                >
                  <Settings size={20} />
                  <span>Admin Dashboard</span>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
