import { useMemo } from "react";
import { motion } from "framer-motion";
import useTournamentStore from "../store/useTournamentStore";
import { buildStandingsFromBracket } from "../lib/standingsEngine";
import TeamLogo from "./TeamLogo";

/** Map status to display-friendly color badge */
function statusColor(status) {
  if (status === "Champion") return "text-[#F2D98D]";
  if (status === "Runner Up") return "text-gray-300";
  if (status === "Active") return "text-green-400";

  if (
    status === "Eliminated" ||
    status === "Semi Finalist" ||
    status === "Quarter Finalist" ||
    status === "Round of 16"
  ) {
    return "text-red-400";
  }

  return "text-gray-400";
}

export default function StandingsSection() {
  const bracket = useTournamentStore((s) => s.bracket);
  const teams = useTournamentStore((s) => s.teams);

  const standings = useMemo(
    () => buildStandingsFromBracket(bracket, teams),
    [bracket, teams]
  );

  // Split into two halves for the existing 2-table layout
  const leftStandings = standings.slice(0, 8);
  const rightStandings = standings.slice(8, 16);
  const tables = [leftStandings, rightStandings];

  // Empty state
  if (!teams || teams.length === 0) {
    return (
      <section
        id="peringkat"
        className="theme-broadcast relative min-h-screen py-16 sm:py-24 flex flex-col items-center justify-center overflow-hidden bg-sc-black w-full"
      >
        <div className="absolute inset-0 bg-[url('/banner.png')] bg-cover bg-fixed bg-top bg-no-repeat opacity-90 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-sc-black/80 via-transparent to-transparent z-10 pointer-events-none" />

        <div className="relative z-20 text-center text-gray-400 font-medium">
          <p>Data tim belum tersedia.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="peringkat"
      className="theme-broadcast relative min-h-screen py-16 sm:py-24 flex flex-col items-center justify-center overflow-hidden bg-sc-black w-full"
    >
      {/* Background image / overlay from Hero */}
      <div className="absolute inset-0 bg-[url('/banner.png')] bg-cover bg-fixed bg-top bg-no-repeat opacity-90 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-sc-black/80 via-transparent to-transparent z-10 pointer-events-none" />

      {/* Fire Sparks */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(30)].map((_, i) => {
          const isGold = i % 2 === 0;
          const directionX = i % 2 === 0 ? 1 : -1;
          const angle = directionX * (15 + (i % 5) * 5);

          return (
            <motion.div
              key={`spark-${i}`}
              className="absolute"
              style={{
                width: `${1 + (i % 2)}px`,
                height: `${10 + (i % 20)}px`,
                backgroundColor: isGold ? "#F2D98D" : "#ff5500",
                borderRadius: "9999px",
                boxShadow: `0 0 10px 2px ${
                  isGold ? "#F2D98D" : "#F22738"
                }`,
                left: `${10 + (i * 17) % 80}%`,
                bottom: "-5%",
                rotate: `${angle}deg`,
                filter: "brightness(1.5)",
              }}
              animate={{
                y: [0, -400 - i * 30],
                x: [0, directionX * (100 + (i % 6) * 30)],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 3 + (i % 5) * 1.5,
                delay: i * 0.3,
                repeatDelay: 2 + (i % 5),
                ease: "easeOut",
              }}
            />
          );
        })}
      </div>

      <div className="relative z-20 w-full max-w-[96rem] mx-auto px-4 sm:px-8 md:px-10 lg:px-12 xl:px-14 flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-8 w-full">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[4rem] sm:text-[5rem] font-normal text-white tracking-widest uppercase inline-block leading-none mt-4 sm:mt-8 mb-8 drop-shadow-lg"
            style={{
              fontFamily: "'American Captain', sans-serif",
              transform: "scaleY(1.3)",
            }}
          >
            PERINGKAT
          </motion.h2>
        </div>

        {/* Tables Grid */}
        <div className="w-full flex justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="w-full grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 xl:gap-10 xl:translate-x-4"
          >
            {tables.map((tableData, tIndex) => (
              <div
                key={tIndex}
                className="w-full overflow-x-auto shadow-xl rounded-2xl border border-gray-800 bg-white"
              >
                <table className="w-full min-w-[560px] border-collapse bg-white mx-auto">
                  <thead>
                    <tr className="bg-black text-xs sm:text-sm">
                      <th
                        className="py-4 px-4 text-left font-bold tracking-wider text-white"
                        colSpan="2"
                      >
                        TEAM
                      </th>
                      <th className="py-4 px-3 text-center font-bold tracking-wider text-sc-red">
                        WIN RATE
                      </th>
                      <th className="py-4 px-3 text-center font-bold tracking-wider text-white">
                        M W-L
                      </th>
                      <th className="py-4 px-3 text-center font-bold tracking-wider text-sc-red">
                        GAME DIFF
                      </th>
                      <th className="py-4 px-3 text-center font-bold tracking-wider text-white">
                        G W-L
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {tableData.map((team, index) => {
                      const rank =
                        team.rank || (tIndex === 0 ? index + 1 : index + 9);

                      return (
                        <tr
                          key={team.teamId || team.teamCode || index}
                          className="border-b border-gray-200 transition-colors bg-white hover:bg-gray-50"
                        >
                          {/* Rank Cell */}
                          <td className="py-2 pl-4 pr-1 w-[44px] text-center">
                            <span
                              className="text-[2rem] sm:text-[2.5rem] font-normal text-black leading-none drop-shadow-sm"
                              style={{
                                fontFamily: "'American Captain', sans-serif",
                                WebkitTextStroke: "1px white",
                              }}
                            >
                              {rank}
                            </span>
                          </td>

                          {/* Team Logo & Name Cell */}
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-3">
                              <TeamLogo
                                team={team}
                                code={team.teamCode}
                                name={team.teamName}
                                size={28}
                                className="w-7 h-7 object-contain"
                              />

                              <div className="flex flex-col">
                                <span className="font-bold text-black text-xs sm:text-sm uppercase tracking-wide">
                                  {team.teamCode || team.teamName || "???"}
                                </span>

                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wide ${statusColor(
                                    team.status
                                  )}`}
                                >
                                  {team.status}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Stats Cells */}
                          <td className="py-3 px-3 text-center font-bold text-sc-red text-sm whitespace-nowrap">
                            {team.winRate}%
                          </td>

                          <td className="py-3 px-3 text-center text-black font-medium text-sm whitespace-nowrap">
                            {team.matchWins} - {team.matchLosses}
                          </td>

                          <td className="py-3 px-3 text-center font-bold text-sc-red text-sm whitespace-nowrap">
                            {team.gameDiff > 0
                              ? `+${team.gameDiff}`
                              : team.gameDiff}
                          </td>

                          <td className="py-3 px-3 text-center text-black font-medium text-sm whitespace-nowrap">
                            {team.gameWins} - {team.gameLosses}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
