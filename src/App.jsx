import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import useTournamentStore from "./store/useTournamentStore";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ScheduleSection from "./components/ScheduleSection";
import StandingsSection from "./components/StandingsSection";
import TeamsSection from "./components/TeamsSection";
import BracketSection from "./components/BracketSection";
import ProtectedAdminRoute from "./routes/ProtectedAdminRoute";

function App() {
  const loadData = useTournamentStore((s) => s.loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-sc-black">
      <Routes>
        {/* Admin Route without Navbar */}
        <Route path="/admin" element={<ProtectedAdminRoute />} />
        
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
