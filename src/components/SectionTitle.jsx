import { motion } from "framer-motion";

export default function SectionTitle({ children, light = false, className = "" }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className={`font-heading text-5xl md:text-7xl tracking-wider text-center italic uppercase ${
        light ? "text-sc-gold text-glow-gold" : "text-sc-black"
      } ${className}`}
      style={{ fontFamily: "var(--font-heading)" }}
    >
      {children}
    </motion.h2>
  );
}
