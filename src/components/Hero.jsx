import { motion } from "framer-motion";

export default function Hero() {
  
  return (
    <section className="theme-broadcast relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-sc-black py-10">
      
      {/* Background image / overlay */}
      <div className="absolute inset-0 bg-[url('/banner.png')] bg-cover bg-center bg-no-repeat opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-t from-sc-black/80 via-transparent to-transparent z-10 pointer-events-none" />

      {/* Fire Sparks (Percikan Api) */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {[...Array(40)].map((_, i) => {
          const isGold = i % 2 === 0;
          const directionX = (i % 2 === 0 ? 1 : -1);
          const angle = directionX * (15 + (i % 5) * 5); // tilt angle for the streak
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
                left: `${10 + (i * 17) % 80}%`, // spread across mostly the center-ish screen
                bottom: `-5%`,
                rotate: `${angle}deg`,
                filter: "brightness(1.5)"
              }}
              animate={{
                y: [0, -300 - (i * 30)], // shoot up fast
                x: [0, directionX * (100 + (i % 6) * 30)], // shoot outwards
                opacity: [0, 1, 0], // pop and fade quickly
                scale: [0, 1, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 3 + (i % 5) * 1.5, // slow, cinematic motion (3s to 9s)
                delay: i * 0.3, // spread out the initial bursts even more
                repeatDelay: 2 + (i % 5), // long pause before looping (2s to 6s)
                ease: "easeOut"
              }}
            />
          );
        })}
      </div>

      <div className="relative z-20 max-w-7xl w-full mx-auto px-4 flex flex-col items-center justify-start">
        
        {/* Main Content Layout */}
        <div className="flex flex-col items-center justify-start w-full z-30">
          
          
          {/* Logo (replacing MPL Logo) */}
         {/* Logo Area */}
<motion.div
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
  className="mb-10 sm:mb-16 flex flex-col items-center gap-3 sm:gap-4"
  style={{ marginBottom: "1rem" }}
>
  {/* Logo Super Challenge Lanjang di atas */}
<motion.img
  animate={{ y: [0, -5, 0] }}
  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
  src="/superchallange-lanjang.png"
  alt="Super Challenge"
  className="w-44 sm:w-60 md:w-72 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)] -translate-x-2 sm:-translate-x-3"
/>

  {/* Logo Super ML di bawah */}
  <motion.img
    animate={{ y: [0, -8, 0] }}
    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
    src="/super-ml-logo.png"
    alt="Super Mobile Legends Competition"
    className="w-40 sm:w-56 md:w-64 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
  />
</motion.div>
          {/* Title text */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-10 sm:mb-8"
            style={{ marginTop: '1rem' }}
          >
            <h1 
              className="relative text-7xl sm:text-[8rem] md:text-[11rem] font-normal tracking-wide uppercase flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 leading-none italic"
              style={{ fontFamily: "'American Captain', sans-serif" }}
            >
              <span className="text-[#FFFBF0] drop-shadow-[0_4px_4px_rgba(0,0,0,1)] relative z-10">
                GRAND
              </span>
              <span className="text-[#FFFBF0] drop-shadow-[0_4px_4px_rgba(0,0,0,1)] pr-2 sm:pr-4 inline-block relative z-10">
                FINALS
              </span>
            </h1>
          </motion.div>

          {/* Subtitle / Date Badge */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col items-center gap-2 sm:gap-3 -mt-4 sm:-mt-8"
          >
            <h2 
              className="text-center text-3xl sm:text-5xl font-normal text-white tracking-widest uppercase drop-shadow-md"
              style={{ fontFamily: "'American Captain', sans-serif" }}
            >
              SUPER MOBILE LEGENDS COMPETITION
            </h2>
            <motion.div 
              animate={{ boxShadow: ["0px 0px 0px rgba(204,0,0,0)", "0px 0px 15px rgba(204,0,0,0.3)", "0px 0px 0px rgba(204,0,0,0)"] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="bg-[#cc0000] rounded-3xl px-6 py-2 sm:px-8 sm:py-3 shadow-lg mt-1"
            >
              <span 
                className="block text-white font-normal text-xl sm:text-3xl tracking-widest uppercase"
                style={{ fontFamily: "'American Captain', sans-serif", transform: "translateY(2px)" }}
              >
                27 JUNI 2026 - ZAZI CAFE
              </span>
            </motion.div>
            
            {/* Sponsors integrated into the flow */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="mt-5 sm:mt-10 flex flex-col items-center gap-3 sm:gap-5"
            >
              <span className="text-white/80 text-sm sm:text-base tracking-widest uppercase font-semibold italic">
                Sponsored By
              </span>
              <div className="flex justify-center items-center gap-10 sm:gap-13">
                <motion.img animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0 }} src="/zazi-logo.png" alt="Zazi" className="h-8 sm:h-12 object-contain hover:scale-105 drop-shadow-md" />
                <motion.img animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }} src="/super-friends.png" alt="Super Friends" className="h-8 sm:h-12 object-contain hover:scale-105 drop-shadow-md" />
              </div>
            </motion.div>
          </motion.div>
        </div>

      </div>

    </section>
  );
}
