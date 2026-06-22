import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CountdownBox({
  targetDate,
  display,
  size = "large",
  className = "",
}) {
  const [timeLeft, setTimeLeft] = useState(display || "00:00");

  useEffect(() => {
    if (!targetDate) return;

    const calcTime = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(
          `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        );
      } else {
        setTimeLeft(
          `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        );
      }
    };

    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const sizeClasses = {
    small: "text-3xl md:text-4xl",
    medium: "text-5xl md:text-6xl",
    large: "text-7xl md:text-9xl",
    xlarge: "text-8xl md:text-[10rem]",
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`${className}`}
    >
      <span
        className={`font-countdown ${sizeClasses[size] || sizeClasses.large} font-bold text-sc-gold text-glow-gold tracking-wider`}
        style={{ fontFamily: "var(--font-countdown)" }}
      >
        {timeLeft}
      </span>
    </motion.div>
  );
}
