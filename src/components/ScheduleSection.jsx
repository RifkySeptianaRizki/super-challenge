import { useMemo } from "react";
import { motion } from "framer-motion";
import useTournamentStore from "../store/useTournamentStore";
import TeamLogo from "./TeamLogo";

const ROUND_LABELS = {
  R16: "Round of 16",
  QF: "Quarter Final",
  SF: "Semi Final",
  GF: "Grand Final",
};

/** Derive display-friendly status from a bracket match. */
function deriveMatchStatus(match) {
  if (!match) return "waiting";
  if (match.status === "completed") return "completed";
  if (match.status === "live") return "live";
  if (match.status === "upcoming") return "upcoming";
  // "empty" → Waiting (slot belum lengkap)
  return "waiting";
}

/** Status label string */
function statusLabel(status) {
  if (status === "completed") return "Selesai";
  if (status === "live") return "LIVE";
  if (status === "upcoming") return "Akan Datang";
  return "Menunggu";
}

/**
 * Transform flat bracket array into round-grouped schedule data.
 * Each "round" becomes a day-like group in the existing layout.
 */
function bracketToSchedule(bracket, teamsById) {
  if (!Array.isArray(bracket) || bracket.length === 0) return [];

  const rounds = ["R16", "QF", "SF", "GF"];
  return rounds.map((round) => {
    const roundMatches = bracket
      .filter((m) => m.round === round)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Use date from the first match that has one, or show round label
    const firstDateMatch = roundMatches.find((m) => m.date);
    const displayDate = firstDateMatch?.date || ROUND_LABELS[round];

    return {
      id: `schedule-${round}`,
      date: displayDate,
      games: roundMatches.map((m) => {
        const teamA = m.teamAId ? teamsById.get(m.teamAId) : null;
        const teamB = m.teamBId ? teamsById.get(m.teamBId) : null;
        const status = deriveMatchStatus(m);

        return {
          id: m.id,
          matchId: m.id,
          time: m.time || "TBD",
          teamA: teamA?.code || (m.teamAId ? "???" : "TBA"),
          teamB: teamB?.code || (m.teamBId ? "???" : "TBA"),
          scoreA: m.teamAId && m.teamBId ? m.scoreA ?? 0 : "-",
          scoreB: m.teamAId && m.teamBId ? m.scoreB ?? 0 : "-",
          status,
          roundLabel: m.roundLabel || ROUND_LABELS[m.round] || m.round,
          bestOf: m.bestOf || 3,
          winnerTeamId: m.winnerTeamId,
        };
      }),
    };
  });
}

export default function ScheduleSection() {
  const bracket = useTournamentStore((s) => s.bracket);
  const teams = useTournamentStore((s) => s.teams);

  const teamsById = useMemo(
    () => new Map((teams || []).map((t) => [t.id, t])),
    [teams]
  );

  const scheduleData = useMemo(
    () => bracketToSchedule(bracket, teamsById),
    [bracket, teamsById]
  );

  // Filter out round-groups with no games (shouldn't happen for 15 matches, but safe guard)
  const filteredMatches = scheduleData.filter((day) => day.games.length > 0);

  return (
    <section id="jadwal" className="relative w-full min-h-[100dvh] bg-sc-black overflow-hidden flex flex-col justify-center py-32 sm:py-40">
      {/* Background image / overlay like Hero */}
      <div className="absolute inset-0 bg-[url('/banner.png')] bg-cover bg-fixed bg-top bg-no-repeat opacity-90 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-sc-black/80 via-transparent to-transparent z-10 pointer-events-none" />
      {/* Fire Sparks (Percikan Api) */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(30)].map((_, i) => {
          const isGold = i % 2 === 0;
          const directionX = (i % 2 === 0 ? 1 : -1);
          const angle = directionX * (15 + (i % 5) * 5);
          return (
            <motion.div
              key={`spark-${i}`}
              className="absolute"
              style={{
                width: `${1 + (i % 2)}px`,
                height: `${10 + (i % 20)}px`,
                backgroundColor: isGold ? '#F2D98D' : '#ff5500',
                borderRadius: '9999px',
                boxShadow: `0 0 10px 2px ${isGold ? '#F2D98D' : '#F22738'}`,
                left: `${10 + (i * 17) % 80}%`,
                bottom: `-5%`,
                rotate: `${angle}deg`,
                filter: "brightness(1.5)"
              }}
              animate={{
                y: [0, -400 - (i * 30)],
                x: [0, directionX * (100 + (i % 6) * 30)],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 3 + (i % 5) * 1.5,
                delay: i * 0.3,
                repeatDelay: 2 + (i % 5),
                ease: "easeOut"
              }}
            />
          );
        })}
      </div>

      <div className="relative z-10 w-full max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[4rem] sm:text-[6rem] font-normal text-white tracking-widest uppercase inline-block leading-none"
            style={{ fontFamily: "'American Captain', sans-serif", transform: "scaleY(1.3)" }}
          >
            JADWAL
          </motion.h2>
        </div>

        {/* Schedule Single Day Grid */}
        <div className="flex flex-col items-center gap-8 w-full">
          {filteredMatches.map((day) => (
            <motion.div 
              key={day.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border border-dashed border-gray-600 bg-black/40 backdrop-blur-md p-6 sm:p-10 w-full max-w-6xl shadow-2xl rounded-sm"
            >
              <h3 className="text-center font-bold text-lg sm:text-2xl text-white mb-6 sm:mb-10 mt-2 tracking-wide">
                {day.date}
              </h3>
              
              {/* Desktop 2-Column, Mobile 1-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 xl:gap-x-24 w-full">
                {day.games.map((game, index) => {
                  const isLastRowDesktop = index >= day.games.length - 2;
                  const isLastRowMobile = index === day.games.length - 1;
                  return (
                    <MatchRow 
                      key={game.id} 
                      game={game} 
                      isLastDesktop={isLastRowDesktop}
                      isLastMobile={isLastRowMobile}
                    />
                  );
                })}
              </div>
            </motion.div>
          ))}

          {filteredMatches.length === 0 && (
             <div className="text-center py-16 text-gray-400 font-medium w-full">
               <p>Jadwal belum tersedia.</p>
               <p className="text-sm mt-2 text-gray-500">Silakan generate bracket melalui Admin Panel.</p>
             </div>
          )}
        </div>

      </div>
    </section>
  );
}

function MatchRow({ game, isLastDesktop, isLastMobile }) {
  const teams = useTournamentStore((s) => s.teams);
  const t1 = teams.find((t) => t.code === game.teamA) || { code: game.teamA, name: game.teamA };
  const t2 = teams.find((t) => t.code === game.teamB) || { code: game.teamB, name: game.teamB };

  const logoSrc1 = t1.logo || `/assets/teams/${(t1.code || "").toLowerCase()}.png`;
  const logoSrc2 = t2.logo || `/assets/teams/${(t2.code || "").toLowerCase()}.png`;

  return (
    <div className={`flex items-center justify-between border-gray-500 py-4 sm:py-5 ${isLastMobile ? 'border-b-0' : 'border-b border-dashed'} lg:${isLastDesktop ? 'border-b-0' : 'border-b border-dashed'}`}>
      
      {/* Team 1 */}
      <div className="flex flex-col items-center w-[70px] sm:w-[90px] gap-2">
        <TeamLogo 
          src={logoSrc1} 
          code={t1.code} 
          size={48} 
          className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md" 
        />
        <span className="text-[11px] sm:text-xs font-bold text-gray-300 truncate w-full text-center">{t1.code}</span>
      </div>

      {/* Score 1 */}
      <div 
        className="text-[3.5rem] sm:text-[4.5rem] text-white w-[50px] sm:w-[70px] text-center leading-none"
        style={{ fontFamily: "'American Captain', sans-serif" }}
      >
        {game.scoreA}
      </div>

      {/* Center Details */}
      <div className="flex flex-col items-center gap-2 sm:gap-3 flex-1 px-2 sm:px-4">
        <span className="text-[11px] sm:text-xs font-bold text-gray-400 tracking-wider">{game.time}</span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`text-[9px] sm:text-[10px] font-bold px-3 py-1.5 sm:px-4 sm:py-2 tracking-widest rounded-sm shadow-sm ${
            game.status === "completed"
              ? "bg-green-800/70 text-green-200"
              : game.status === "live"
                ? "bg-[#F22738] text-white animate-pulse"
                : game.status === "upcoming"
                  ? "bg-[#591B1B] text-white"
                  : "bg-gray-700 text-gray-300"
          }`}>
            {statusLabel(game.status)}
          </span>
          <span className="bg-[#E68A00] text-white text-[9px] sm:text-[10px] font-bold px-3 py-1.5 sm:px-4 sm:py-2 tracking-widest rounded-sm shadow-sm">
            BO{game.bestOf}
          </span>
        </div>
        <span className="text-[9px] text-gray-500 font-medium tracking-wider">{game.matchId}</span>
      </div>

      {/* Score 2 */}
      <div 
        className="text-[3.5rem] sm:text-[4.5rem] text-white w-[50px] sm:w-[70px] text-center leading-none"
        style={{ fontFamily: "'American Captain', sans-serif" }}
      >
        {game.scoreB}
      </div>

      {/* Team 2 */}
      <div className="flex flex-col items-center w-[70px] sm:w-[90px] gap-2">
        <TeamLogo 
          src={logoSrc2} 
          code={t2.code} 
          size={48} 
          className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-md" 
        />
        <span className="text-[11px] sm:text-xs font-bold text-gray-300 truncate w-full text-center">{t2.code}</span>
      </div>

    </div>
  );
}
