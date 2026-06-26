import { motion } from "framer-motion";
import TeamLogo from "./TeamLogo";
import useTournamentStore from "../store/useTournamentStore";

export default function MatchCard({ game }) {
  const teams = useTournamentStore((s) => s.teams);

  const findTeam = (code) => teams.find((t) => t.code === code) || {};
  const teamA = findTeam(game.teamA);
  const teamB = findTeam(game.teamB);
  const isCompleted = game.status === "completed";
  const aWins = isCompleted && game.scoreA > game.scoreB;
  const bWins = isCompleted && game.scoreB > game.scoreA;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex items-center justify-between gap-2 py-3 px-2 sm:px-4 border-b border-gray-100 last:border-b-0 hover:bg-sc-softPink/50 transition-colors"
    >
      {/* Team A */}
      <div className={`flex items-center gap-2 flex-1 min-w-0 ${aWins ? "opacity-100" : isCompleted ? "opacity-50" : "opacity-100"}`}>
        <TeamLogo team={teamA} code={game.teamA} name={teamA.name} color={teamA.color} size={32} />
        <div className="min-w-0">
          <p className="font-bold text-xs sm:text-sm truncate">{game.teamA}</p>
          <p className="text-[10px] text-gray-400 truncate hidden sm:block">{teamA.name}</p>
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        <span
          className={`text-2xl sm:text-3xl font-bold ${aWins ? "text-sc-red" : "text-sc-black"}`}
          style={{ fontFamily: "var(--font-countdown)" }}
        >
          {isCompleted ? game.scoreA : "-"}
        </span>

        {/* Time / Center */}
        <div className="flex flex-col items-center min-w-[60px] sm:min-w-[80px]">
          <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{game.time}</span>
          <div className="flex gap-1 mt-1">
            <a
              href={game.detailUrl || "#"}
              className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase rounded bg-sc-darkRed text-white hover:bg-sc-red transition-colors"
            >
              Details
            </a>
            <a
              href={game.replayUrl || "#"}
              className="px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase rounded bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            >
              Replay
            </a>
          </div>
        </div>

        <span
          className={`text-2xl sm:text-3xl font-bold ${bWins ? "text-sc-red" : "text-sc-black"}`}
          style={{ fontFamily: "var(--font-countdown)" }}
        >
          {isCompleted ? game.scoreB : "-"}
        </span>
      </div>

      {/* Team B */}
      <div className={`flex items-center gap-2 flex-1 min-w-0 justify-end ${bWins ? "opacity-100" : isCompleted ? "opacity-50" : "opacity-100"}`}>
        <div className="min-w-0 text-right">
          <p className="font-bold text-xs sm:text-sm truncate">{game.teamB}</p>
          <p className="text-[10px] text-gray-400 truncate hidden sm:block">{teamB.name}</p>
        </div>
        <TeamLogo team={teamB} code={game.teamB} name={teamB.name} color={teamB.color} size={32} />
      </div>
    </motion.div>
  );
}
