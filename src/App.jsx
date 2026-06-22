import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import useTournamentStore from "./store/useTournamentStore";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ScheduleSection from "./components/ScheduleSection";
import StandingsSection from "./components/StandingsSection";
import TeamsSection from "./components/TeamsSection";
import BracketSection from "./components/BracketSection";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  const loadData = useTournamentStore((s) => s.loadData);

  useEffect(() => {
    loadData();
    
    // Auto-repair corrupted matches schema from previous bug
    const matches = useTournamentStore.getState().matches;
    let modified = false;
    if (matches && Array.isArray(matches)) {
      const fixedMatches = matches.map(day => ({
        ...day,
        games: (Array.isArray(day.games) ? day.games : []).map(g => {
          if (g.team1 && g.team2) {
            modified = true;
            return {
              id: g.id, time: g.id, status: g.status,
              teamA: g.team1.code || "TBA", scoreA: g.team1.score || 0,
              teamB: g.team2.code || "TBA", scoreB: g.team2.score || 0
            };
          }
          return g;
        })
      }));
      if (modified) {
        useTournamentStore.getState().updateMatches(fixedMatches);
      }
    }

    // Cross-tab Synchronization
    const handleStorageChange = () => {
      // Reload data if local storage was updated in another tab (e.g. Admin Dashboard)
      loadData();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadData]);

  return (
    <div className="min-h-screen bg-sc-black">
      <Routes>
        {/* Admin Route without Navbar */}
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Public Routes with Navbar */}
        <Route path="/*" element={
          <>
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Hero />} />
                <Route path="/teams" element={<TeamsSection />} />
                <Route path="/jadwal" element={<ScheduleSection />} />
                <Route path="/peringkat" element={<StandingsSection />} />
                <Route path="/bagan" element={<BracketSection />} />
              </Routes>
            </main>
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
