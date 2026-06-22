import { useState } from "react";

export default function TeamLogo({ src, code, color = "#731414", size = 40, className = "" }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    const monogram = code ? code.substring(0, 2).toUpperCase() : "?";
    return (
      <div
        className={`flex items-center justify-center rounded-full font-bold text-white text-xs uppercase ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          fontSize: Math.max(10, size * 0.4),
        }}
      >
        {monogram}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={code}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  );
}
