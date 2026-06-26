const BLOCKED_IMAGE_SCHEMES = ["javascript:", "data:", "blob:", "file:", "vbscript:"];
const MAX_IMAGE_URL_LENGTH = 1000;

const toCleanString = (value) => String(value ?? "").trim();

export function isValidHttpsUrl(value) {
  const url = toCleanString(value);
  if (!url || url.length > MAX_IMAGE_URL_LENGTH) return false;
  if (!url.toLowerCase().startsWith("https://")) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function isLikelyCloudinaryUrl(value) {
  if (!isValidHttpsUrl(value)) return false;

  try {
    return new URL(toCleanString(value)).hostname.toLowerCase().includes("res.cloudinary.com");
  } catch {
    return false;
  }
}

export function isSafeRelativeImageUrl(value) {
  const url = toCleanString(value);
  if (!url || url.length > MAX_IMAGE_URL_LENGTH) return false;
  if (!url.startsWith("/assets/") || url.startsWith("//")) return false;
  return !BLOCKED_IMAGE_SCHEMES.some((scheme) => url.toLowerCase().startsWith(scheme));
}

export function getImageUrlStatus(value, options = {}) {
  const { allowRelativeAssets = false } = options;
  const url = toCleanString(value);
  const lower = url.toLowerCase();

  if (!url) {
    return { valid: true, sanitized: null, warning: "", error: "", isCloudinary: false, isEmpty: true };
  }

  if (url.length > MAX_IMAGE_URL_LENGTH) {
    return {
      valid: false,
      sanitized: null,
      warning: "",
      error: "URL logo terlalu panjang.",
      isCloudinary: false,
      isEmpty: false,
    };
  }

  if (BLOCKED_IMAGE_SCHEMES.some((scheme) => lower.startsWith(scheme))) {
    return {
      valid: false,
      sanitized: null,
      warning: "",
      error: "URL logo harus menggunakan HTTPS.",
      isCloudinary: false,
      isEmpty: false,
    };
  }

  if (allowRelativeAssets && isSafeRelativeImageUrl(url)) {
    return {
      valid: true,
      sanitized: url,
      warning: "Logo lokal lama didukung. Untuk logo baru, gunakan URL HTTPS Cloudinary.",
      error: "",
      isCloudinary: false,
      isEmpty: false,
      isRelativeAsset: true,
    };
  }

  if (!isValidHttpsUrl(url)) {
    return {
      valid: false,
      sanitized: null,
      warning: "",
      error: "URL logo harus menggunakan HTTPS.",
      isCloudinary: false,
      isEmpty: false,
    };
  }

  const isCloudinary = isLikelyCloudinaryUrl(url);
  return {
    valid: true,
    sanitized: url,
    warning: isCloudinary ? "" : "URL ini bukan domain Cloudinary. Pastikan link gambar bisa diakses publik.",
    error: "",
    isCloudinary,
    isEmpty: false,
  };
}

export function sanitizeImageUrl(value, options = {}) {
  const status = getImageUrlStatus(value, options);
  return status.valid ? status.sanitized : null;
}

export function getTeamInitials(teamOrCode, fallbackName = "") {
  const team = teamOrCode && typeof teamOrCode === "object" ? teamOrCode : null;
  const code = team ? team.code || team.teamCode : teamOrCode;
  const name = team
    ? team.name || team.fullName || team.shortName || team.teamName
    : fallbackName;
  const cleanCode = toCleanString(code);

  if (cleanCode) return cleanCode.slice(0, 2).toUpperCase();

  const words = toCleanString(name)
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase() || "?";
  }

  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return "?";
}

export function getTeamLogoUrl(team) {
  if (!team || typeof team !== "object") return null;
  return sanitizeImageUrl(
    team.logo_url || team.logoUrl || team.logo || team.image || team.avatar || team.icon,
    { allowRelativeAssets: true }
  );
}

export function buildCloudinaryOptimizedUrl(url) {
  return sanitizeImageUrl(url, { allowRelativeAssets: true });
}

export function handleImageError(setHasError) {
  return () => {
    if (typeof setHasError === "function") setHasError(true);
  };
}

export { MAX_IMAGE_URL_LENGTH };
