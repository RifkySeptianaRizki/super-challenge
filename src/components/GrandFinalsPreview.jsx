import { motion } from "framer-motion";
import TeamLogo from "./TeamLogo";

export default function GrandFinalsPreview() {
  const team1 = { code: "BTR", name: "BIGETRON ALPHA" };
  const team2 = { code: "ONIC", name: "ONIC ESPORTS" };

  return (
    <section className="theme-broadcast py-24 min-h-[60vh] flex flex-col items-center justify-center border-t border-sc-gold/20 relative overflow-hidden bg-gradient-to-b from-sc-darkRed/20 to-[#0a0705]">
      
      {/* Decorative center background light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-sc-gold/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        {/* MATCH Label */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-4"
        >
          <span className="text-white/60 text-sm font-bold tracking-[0.5em] uppercase px-4 py-1 border border-white/20 bg-white/5">
            MATCH
          </span>
        </motion.div>

        {/* Title */}
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-4xl sm:text-5xl font-bold italic tracking-tighter text-gradient-gold mb-16 text-center"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          GRAND FINALS SUPER CHALLENGE SEASON 2026
        </motion.h2>

        {/* Versus Matchup Area */}
        <div className="w-full flex items-center justify-center gap-12 sm:gap-24 mb-16 relative">
          
          {/* Team 1 */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center z-10"
          >
            <div className="w-32 h-32 sm:w-48 sm:h-48 mb-6 drop-shadow-2xl">
              <TeamLogo teamId={team1.code} className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" fallbackText={team1.code} />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-widest text-white uppercase bg-black/40 px-6 py-2 border border-white/10 backdrop-blur-md text-center">
              {team1.name}
            </span>
          </motion.div>

          {/* VS Center */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, type: "spring" }}
            className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
          >
            <div className="text-5xl sm:text-7xl font-bold italic text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,50,50,0.8)]" style={{ fontFamily: "var(--font-heading)" }}>
              VS
            </div>
          </motion.div>

          {/* Team 2 */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center z-10"
          >
            <div className="w-32 h-32 sm:w-48 sm:h-48 mb-6 drop-shadow-2xl">
              <TeamLogo teamId={team2.code} className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" fallbackText={team2.code} />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-widest text-white uppercase bg-black/40 px-6 py-2 border border-white/10 backdrop-blur-md text-center">
              {team2.name}
            </span>
          </motion.div>

        </div>

        {/* Akan Dimulai Countdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-8 border border-sc-gold p-1 bg-[#110d0a] shadow-2xl shadow-sc-gold/10"
        >
          <div className="border border-sc-gold/40 px-12 py-6 flex flex-col items-center justify-center relative">
            <span className="text-white/80 text-[10px] font-bold tracking-[0.4em] uppercase mb-1">Akan Dimulai</span>
            <div className="number-condensed text-[60px] text-sc-gold leading-none">
              00:31
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
