import { useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import {
  getTeamInitials,
  getTeamLogoUrl,
  handleImageError,
  sanitizeImageUrl,
} from "../../lib/imageUtils";

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
};

const ROUNDED_MAP = {
  none: "rounded-none",
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  full: "rounded-full",
};

const VARIANT_MAP = {
  default: "border-[#731414] bg-[#260505] text-[#F2D98D]",
  subtle: "border-[#731414]/50 bg-[#400C0C]/70 text-[#F2D98D]",
  winner: "border-[#F2D98D] bg-[#400C0C] text-[#F2D98D] shadow-[0_0_14px_rgba(242,217,141,0.24)]",
  plain: "border-[#731414]/30 bg-[#260505] text-[#F2D98D]",
};

function resolveSize(size) {
  if (typeof size === "number" && Number.isFinite(size)) return size;
  return SIZE_MAP[size] || SIZE_MAP.md;
}

function resolveRounded(rounded) {
  if (rounded === false) return ROUNDED_MAP.md;
  if (rounded === true || !rounded) return ROUNDED_MAP.full;
  return ROUNDED_MAP[rounded] || rounded;
}

export default function TeamLogo({
  src,
  team,
  code,
  name,
  size = "md",
  className = "",
  rounded = true,
  variant = "default",
  showFallback = true,
  priority = false,
  color,
  fallbackText,
  teamId,
  onLoadError,
  onLoadSuccess,
}) {
  const [failedSrc, setFailedSrc] = useState(null);
  const pixelSize = resolveSize(size);
  const displayCode = code || team?.code || team?.teamCode || teamId || "";
  const displayName = name || team?.name || team?.fullName || team?.teamName || "";
  const safeSrc = useMemo(() => (
    sanitizeImageUrl(src, { allowRelativeAssets: true }) || getTeamLogoUrl(team)
  ), [src, team]);
  const initials = fallbackText || getTeamInitials(displayCode || team, displayName);
  const hasError = Boolean(safeSrc && failedSrc === safeSrc);

  if (!safeSrc || hasError) {
    if (!showFallback) return null;

    return (
      <div
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden border font-black uppercase leading-none",
          resolveRounded(rounded),
          VARIANT_MAP[variant] || VARIANT_MAP.default,
          className
        )}
        style={{
          width: pixelSize,
          height: pixelSize,
          minWidth: pixelSize,
          minHeight: pixelSize,
          backgroundColor: color || undefined,
          fontSize: Math.max(10, Math.floor(pixelSize * 0.36)),
        }}
        aria-label={`${displayName || displayCode || "Team"} logo fallback`}
      >
        {initials || "?"}
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden border",
        resolveRounded(rounded),
        VARIANT_MAP[variant] || VARIANT_MAP.default,
        className
      )}
      style={{
        width: pixelSize,
        height: pixelSize,
        minWidth: pixelSize,
        minHeight: pixelSize,
      }}
    >
      <img
        src={safeSrc}
        alt={`${displayName || displayCode || "Team"} logo`}
        width={pixelSize}
        height={pixelSize}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        className="h-full w-full object-contain p-[8%]"
        onLoad={onLoadSuccess}
        onError={(event) => {
          handleImageError(() => setFailedSrc(safeSrc))(event);
          if (typeof onLoadError === "function") onLoadError(event);
        }}
      />
    </span>
  );
}
