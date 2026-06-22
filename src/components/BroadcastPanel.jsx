import { motion } from "framer-motion";
import useTournamentStore from "../store/useTournamentStore";

export default function BroadcastPanel() {
  const casters = useTournamentStore((s) => s.casters) || [
    { id: "1", name: "RANGER EMAS", role: "Caster", image: "https://i.pravatar.cc/300?img=11" },
    { id: "2", name: "PAK PULUNG", role: "Analyst", image: "https://i.pravatar.cc/300?img=12" },
    { id: "3", name: "MOMOCHAN", role: "Caster", image: "https://i.pravatar.cc/300?img=5" },
    { id: "4", name: "KB", role: "Analyst", image: "https://i.pravatar.cc/300?img=14" },
    { id: "5", name: "GIO", role: "Host", image: "https://i.pravatar.cc/300?img=15" },
  ];

  return (
    <section className="theme-broadcast py-24 min-h-[60vh] flex flex-col items-center justify-center border-t border-sc-gold/20 relative overflow-hidden bg-gradient-to-b from-[#0a0705] to-[#140b06]">
      
      {/* Decorative center background light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-sc-gold/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 
            className="text-4xl sm:text-5xl font-bold italic tracking-tighter text-gradient-gold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            CASTER & ANALYST
          </h2>
        </motion.div>

        {/* Casters Grid */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
          {casters.map((caster, index) => (
            <motion.div
              key={caster.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group w-[180px] sm:w-[220px]"
            >
              <div className="border border-sc-gold/30 bg-[#0d0907] p-2 relative overflow-hidden group-hover:border-sc-gold transition-colors duration-500">
                {/* Image Container */}
                <div className="relative aspect-[3/4] bg-[#1a1410] overflow-hidden">
                  {/* Fallback pattern if image is just a placeholder */}
                  <div className="absolute inset-0 opacity-10 mix-blend-overlay z-0" />
                  
                  <img 
                    src={caster.image} 
                    alt={caster.name}
                    className="w-full h-full object-cover object-top relative z-10 mix-blend-luminosity opacity-80 group-hover:mix-blend-normal group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-20" />
                  
                  {/* Name & Role overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-center z-30">
                    <span className="block text-white font-bold text-lg tracking-widest uppercase mb-1">
                      {caster.name}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Bottom Gold Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-sc-gold/40" />

    </section>
  );
}
