import { motion } from "framer-motion";

export default function OpeningCeremony() {
  return (
    <section className="theme-broadcast py-24 min-h-[80vh] flex flex-col items-center justify-center border-t border-sc-gold/20 relative overflow-hidden">
      
      {/* Filigree Corners */}
      <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-sc-gold/50 rounded-tl-xl" />
      <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-sc-gold/50 rounded-tr-xl" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-sc-gold/50 rounded-bl-xl" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-sc-gold/50 rounded-br-xl" />

      <div className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        {/* Huge Title */}
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-6xl sm:text-[140px] font-bold italic tracking-tighter leading-none mb-6 text-gradient-gold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          OPENING CEREMONY
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-sc-gold text-xs sm:text-base font-bold tracking-[0.3em] mb-16 flex items-center gap-4 text-center"
        >
          <span className="hidden sm:block w-8 h-[1px] bg-sc-gold" />
          GRAND FINALS SUPER CHALLENGE SEASON 2026
          <span className="hidden sm:block w-8 h-[1px] bg-sc-gold" />
        </motion.p>

        {/* Center Panels & Countdown */}
        <div className="w-full max-w-4xl relative flex items-stretch justify-center h-[200px] sm:h-[240px]">
          {/* Left panel placeholder (metallic face) */}
          <div className="hidden sm:block flex-1 bg-gradient-to-r from-transparent to-[#2a1f18] border-y border-l border-sc-gold/20 overflow-hidden relative">
             <div className="absolute inset-0 opacity-30 mix-blend-overlay" />
          </div>

          {/* Center Box */}
          <div className="w-[340px] shrink-0 border border-sc-gold p-1 bg-[#110d0a] z-10 relative shadow-2xl shadow-sc-gold/10 flex flex-col justify-center">
            {/* Inner border */}
            <div className="border border-sc-gold/40 h-full w-full flex flex-col items-center justify-center relative p-8">
              
              {/* Box filigree corners */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t border-l border-sc-gold bg-[#110d0a]" />
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-sc-gold bg-[#110d0a]" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b border-l border-sc-gold bg-[#110d0a]" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b border-r border-sc-gold bg-[#110d0a]" />

              <span className="text-white/80 text-[10px] font-bold tracking-[0.4em] uppercase mb-2">Akan Dimulai</span>
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="number-condensed text-[80px] sm:text-[100px] text-sc-gold leading-none"
              >
                00:31
              </motion.div>
            </div>
          </div>

          {/* Right panel placeholder (metallic face) */}
          <div className="hidden sm:block flex-1 bg-gradient-to-l from-transparent to-[#2a1f18] border-y border-r border-sc-gold/20 overflow-hidden relative">
             <div className="absolute inset-0 opacity-30 mix-blend-overlay" />
          </div>
        </div>

        {/* Footer Sponsor */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center flex flex-col items-center"
        >
          <span className="text-white/40 text-[10px] font-bold tracking-[0.4em] uppercase mb-4">Supported By</span>
          <div className="flex items-center justify-center gap-3 text-white border border-white/10 px-6 py-3 bg-white/5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            <div className="text-left">
              <span className="font-bold text-lg block leading-none">EKRAF</span>
              <span className="text-[8px] text-white/50 block leading-tight mt-1 max-w-[150px]">
                Kementerian Pariwisata dan Ekonomi Kreatif / Badan Ekonomi Kreatif Republik Indonesia
              </span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
