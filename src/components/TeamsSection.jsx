import { motion } from "framer-motion";
import useTournamentStore from "../store/useTournamentStore";
import TeamLogo from "./TeamLogo";

export default function TeamsSection() {
  const teams = useTournamentStore((s) => s.teams);

  return (
    <section id="teams" className="relative w-full min-h-[100dvh] bg-sc-black overflow-hidden flex flex-col justify-center py-20 sm:py-32">
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

      <div className="relative z-10 w-full max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        {/* Title */}
        <div className="w-full flex justify-center mb-5 sm:mb-5">
          <h2 
            className="text-[6rem] sm:text-[9rem] font-normal text-white drop-shadow-[0_10px_20px_rgba(0,0,0,1)] tracking-widest uppercase inline-block" 
            style={{ fontFamily: "'American Captain', sans-serif", transform: "scaleY(1.3)" }}
          >
            TIM
          </h2>
        </div>

        {/* Pennants Grid/Flex */}
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3 sm:gap-5 lg:gap-6 w-full justify-items-center">
          {teams.map((team, i) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: -50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, type: "spring", bounce: 0.4 }}
              className="group cursor-pointer"
            >
              {/* Pennant Wrapper for drop shadow */}
              <div className="filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_15px_25px_rgba(242,39,56,0.5)] transition-all duration-300 group-hover:-translate-y-4">
                
                {/* The Pennant Shape */}
                <div 
                  className="w-20 sm:w-24 lg:w-[6.5rem] h-40 sm:h-48 lg:h-56 bg-white flex flex-col overflow-hidden" 
                  style={{ clipPath: "polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)" }}
                >
                  {/* Dark Red Header */}
                  <div className="w-full h-10 sm:h-12 bg-[#731414] flex justify-center items-center shrink-0">
                    <span className="text-white font-black text-xs sm:text-sm tracking-widest uppercase">
                      {team.code}
                    </span>
                  </div>
                  
                  {/* White Body with Logo */}
                  <div className="flex-1 w-full bg-white flex items-center justify-center p-2 sm:p-3 pb-8 sm:pb-12">
                    <div className="group-hover:scale-110 transition-transform duration-500 w-full h-full flex items-center justify-center">
                      <TeamLogo team={team} code={team.code} name={team.name} size="xl" rounded="lg" variant="plain" className="max-w-full max-h-full" />
                    </div>
                  </div>
                </div>
                
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
