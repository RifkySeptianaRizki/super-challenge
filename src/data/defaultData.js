import {
  createInitialBracketFromTeams,
  createTournamentConfig,
} from "../lib/bracketEngine";

export const defaultSiteConfig = {
  tournamentName: "SUPER CHALLENGE",
  subtitle: "Mobile Legends Tournament",
  season: "Season 2026",
  tagline: "Own The Challenge",
  timezone: "WIB (GMT+7)",
  heroTitle: "SUPER CHALLENGE",
  heroSubtitle: "Mobile Legends Tournament",
  heroDescription:
    "Turnamen esports Mobile Legends dengan atmosfer kompetitif, jadwal terstruktur, klasemen real-time lokal, dan pengalaman visual bergaya broadcast premium.",
  primaryCta: "Lihat Jadwal",
  secondaryCta: "Lihat Peringkat",
  footerText: "© 2026 Super Challenge. All rights reserved.",
};

export const defaultTeams = [
  {
    id: "onic",
    code: "ONIC",
    name: "ONIC",
    fullName: "ONIC Esports",
    rank: 1,
    logo: "/assets/teams/onic.png",
    color: "#F7C948",
    record: "13 - 3",
  },
  {
    id: "tlid",
    code: "TLID",
    name: "TEAM LIQUID ID",
    fullName: "Team Liquid ID",
    rank: 2,
    logo: "/assets/teams/tlid.png",
    color: "#1E3A8A",
    record: "10 - 6",
  },
  {
    id: "dewa",
    code: "DEWA",
    name: "DEWA UNITED",
    fullName: "Dewa United",
    rank: 3,
    logo: "/assets/teams/dewa.png",
    color: "#C9A227",
    record: "9 - 7",
  },
  {
    id: "btr",
    code: "BTR",
    name: "BIGETRON BY VIT",
    fullName: "Bigetron by Vitality",
    rank: 4,
    logo: "/assets/teams/btr.png",
    color: "#E11D48",
    record: "9 - 7",
  },
  {
    id: "evos",
    code: "EVOS",
    name: "EVOS",
    fullName: "EVOS Esports",
    rank: 5,
    logo: "/assets/teams/evos.png",
    color: "#60A5FA",
    record: "8 - 8",
  },
  {
    id: "geek",
    code: "GEEK",
    name: "GEEK FAM",
    fullName: "Geek Fam",
    rank: 6,
    logo: "/assets/teams/geek.png",
    color: "#EF4444",
    record: "8 - 8",
  },
  {
    id: "ae",
    code: "AE",
    name: "ALTER EGO ESPORTS",
    fullName: "Alter Ego Esports",
    rank: 7,
    logo: "/assets/teams/ae.png",
    color: "#B91C1C",
    record: "7 - 9",
  },
  {
    id: "navi",
    code: "NAVI",
    name: "NAVI",
    fullName: "Natus Vincere",
    rank: 8,
    logo: "/assets/teams/navi.png",
    color: "#111827",
    record: "6 - 10",
  },
  {
    id: "rrq",
    code: "RRQ",
    name: "RRQ HOSHI",
    fullName: "RRQ Hoshi",
    rank: 9,
    logo: "/assets/teams/rrq.png",
    color: "#F59E0B",
    record: "2 - 14",
  },
  {
    id: "aura",
    code: "AURA",
    name: "AURA FIRE",
    fullName: "Aura Fire",
    rank: 10,
    logo: "/assets/teams/aura.png",
    color: "#EF4444",
    record: "0 - 0",
  },
  {
    id: "rbl",
    code: "RBL",
    name: "REBELLION",
    fullName: "Rebellion Zion",
    rank: 11,
    logo: "/assets/teams/rbl.png",
    color: "#3B82F6",
    record: "0 - 0",
  },
  {
    id: "pdkr",
    code: "PDKR",
    name: "PENDEKAR",
    fullName: "Pendekar Esports",
    rank: 12,
    logo: "/assets/teams/pdkr.png",
    color: "#8B5CF6",
    record: "0 - 0",
  },
  {
    id: "opi",
    code: "OPI",
    name: "OPI ESPORTS",
    fullName: "Over Powered Indonesia",
    rank: 13,
    logo: "/assets/teams/opi.png",
    color: "#EC4899",
    record: "0 - 0",
  },
  {
    id: "gpx",
    code: "GPX",
    name: "GENG KAPAK",
    fullName: "GPX",
    rank: 14,
    logo: "/assets/teams/gpx.png",
    color: "#10B981",
    record: "0 - 0",
  },
  {
    id: "kag",
    code: "KAG",
    name: "KAGENDRA",
    fullName: "Kagendra",
    rank: 15,
    logo: "/assets/teams/kag.png",
    color: "#6366F1",
    record: "0 - 0",
  },
  {
    id: "dg",
    code: "DG",
    name: "DG ESPORTS",
    fullName: "Dunia Games Esports",
    rank: 16,
    logo: "/assets/teams/dg.png",
    color: "#F43F5E",
    record: "0 - 0",
  },
];

export const defaultMatches = [
  {
    id: "schedule-day-1",
    week: 1,
    date: "Sabtu, 27 Mei 2026",
    stage: "Regular Season",
    games: [
      { id: "match-001", time: "10:00", teamA: "ONIC", teamB: "TLID", scoreA: 0, scoreB: 0, status: "upcoming", detailUrl: "#", replayUrl: "#" },
      { id: "match-002", time: "11:30", teamA: "DEWA", teamB: "BTR", scoreA: 0, scoreB: 0, status: "upcoming", detailUrl: "#", replayUrl: "#" },
      { id: "match-003", time: "13:00", teamA: "EVOS", teamB: "GEEK", scoreA: 0, scoreB: 0, status: "upcoming", detailUrl: "#", replayUrl: "#" },
      { id: "match-004", time: "14:30", teamA: "AE", teamB: "NAVI", scoreA: 0, scoreB: 0, status: "upcoming", detailUrl: "#", replayUrl: "#" },
      { id: "match-005", time: "16:00", teamA: "RRQ", teamB: "AURA", scoreA: 0, scoreB: 0, status: "upcoming", detailUrl: "#", replayUrl: "#" },
      { id: "match-006", time: "17:30", teamA: "RBL", teamB: "PDKR", scoreA: 0, scoreB: 0, status: "upcoming", detailUrl: "#", replayUrl: "#" },
      { id: "match-007", time: "19:00", teamA: "OPI", teamB: "GPX", scoreA: 0, scoreB: 0, status: "upcoming", detailUrl: "#", replayUrl: "#" },
      { id: "match-008", time: "20:30", teamA: "KAG", teamB: "DG", scoreA: 0, scoreB: 0, status: "upcoming", detailUrl: "#", replayUrl: "#" },
    ],
  },
];

export const defaultWeeks = [
  { week: 1, label: "Week 1", active: false },
  { week: 2, label: "Week 2", active: false },
  { week: 3, label: "Week 3", active: false },
  { week: 4, label: "Week 4", active: false },
  { week: 5, label: "Week 5", active: false },
  { week: 6, label: "Week 6", active: false },
  { week: 7, label: "Week 7", active: false },
  { week: 8, label: "Week 8", active: false },
  { week: 9, label: "Week 9", active: true },
];

export const defaultStandings = [
  { rank: 1, teamCode: "ONIC", team: "ONIC", matchPoint: 13, matchWL: "13 - 3", netGameWin: 21, gameWL: "29 - 8", eliminated: false },
  { rank: 2, teamCode: "TLID", team: "TEAM LIQUID ID", matchPoint: 10, matchWL: "10 - 6", netGameWin: 5, gameWL: "21 - 16", eliminated: false },
  { rank: 3, teamCode: "DEWA", team: "DEWA UNITED", matchPoint: 9, matchWL: "9 - 7", netGameWin: 5, gameWL: "22 - 17", eliminated: false },
  { rank: 4, teamCode: "BTR", team: "BIGETRON BY VIT", matchPoint: 9, matchWL: "9 - 7", netGameWin: -1, gameWL: "20 - 21", eliminated: false },
  { rank: 5, teamCode: "EVOS", team: "EVOS", matchPoint: 8, matchWL: "8 - 8", netGameWin: 1, gameWL: "18 - 17", eliminated: false },
  { rank: 6, teamCode: "GEEK", team: "GEEK FAM", matchPoint: 8, matchWL: "8 - 8", netGameWin: 0, gameWL: "19 - 19", eliminated: false },
  { rank: 7, teamCode: "AE", team: "ALTER EGO ESPORTS", matchPoint: 7, matchWL: "7 - 9", netGameWin: -6, gameWL: "19 - 25", eliminated: false },
  { rank: 8, teamCode: "NAVI", team: "NAVI", matchPoint: 6, matchWL: "6 - 10", netGameWin: -4, gameWL: "18 - 22", eliminated: false },
  { rank: 9, teamCode: "RRQ", team: "RRQ HOSHI", matchPoint: 2, matchWL: "2 - 14", netGameWin: -21, gameWL: "8 - 29", eliminated: false },
  { rank: 10, teamCode: "AURA", team: "AURA FIRE", matchPoint: 0, matchWL: "0 - 0", netGameWin: 0, gameWL: "0 - 0", eliminated: false },
  { rank: 11, teamCode: "RBL", team: "REBELLION", matchPoint: 0, matchWL: "0 - 0", netGameWin: 0, gameWL: "0 - 0", eliminated: false },
  { rank: 12, teamCode: "PDKR", team: "PENDEKAR", matchPoint: 0, matchWL: "0 - 0", netGameWin: 0, gameWL: "0 - 0", eliminated: false },
  { rank: 13, teamCode: "OPI", team: "OPI ESPORTS", matchPoint: 0, matchWL: "0 - 0", netGameWin: 0, gameWL: "0 - 0", eliminated: false },
  { rank: 14, teamCode: "GPX", team: "GENG KAPAK", matchPoint: 0, matchWL: "0 - 0", netGameWin: 0, gameWL: "0 - 0", eliminated: true },
  { rank: 15, teamCode: "KAG", team: "KAGENDRA", matchPoint: 0, matchWL: "0 - 0", netGameWin: 0, gameWL: "0 - 0", eliminated: true },
  { rank: 16, teamCode: "DG", team: "DG ESPORTS", matchPoint: 0, matchWL: "0 - 0", netGameWin: 0, gameWL: "0 - 0", eliminated: true },
];

export const defaultCountdown = {
  openingCeremony: {
    label: "AKAN DIMULAI",
    display: "00:31",
    targetDate: "2026-05-24T17:30:00+07:00",
    title: "OPENING CEREMONY",
    subtitle: "GRAND FINALS SUPER CHALLENGE",
  },
  grandFinals: {
    display: "04:25",
    targetDate: "2026-05-24T17:30:00+07:00",
    title: "GRAND FINALS",
    match: "ONIC VS BTR",
  },
  broadcast: {
    display: "46:42",
    targetDate: "2026-05-24T17:30:00+07:00",
    title: "LIVE BROADCAST",
  },
};

export const defaultGrandFinals = {
  title: "GRAND FINALS",
  season: "SUPER CHALLENGE 2026",
  headline: "WE OWN THIS",
  matchNumber: "GRAND FINAL - BO3",
  time: "17:30 WIB",
  teamA: "ONIC",
  teamB: "BTR",
  teamALogo: "/assets/teams/onic.png",
  teamBLogo: "/assets/teams/btr.png",
  playerA: {
    name: "Kairi",
    image: "/assets/players/kairi.png",
    team: "ONIC",
  },
  playerB: {
    name: "Finn",
    image: "/assets/players/finn.png",
    team: "BTR",
  },
  supplier: {
    name: "Klik Indomaret",
    logo: "/assets/sponsors/klik-indomaret.png",
    text: "Belanja Online Seperti di Toko",
  },
};

export const defaultBroadcast = {
  title: "GRAND FINALS",
  subtitle: "Nobody wants to lose",
  countdown: "46:42",
  videoPlaceholder: "/assets/backgrounds/broadcast-preview.png",
  casters: [
    {
      name: "RANGER EMAS",
      role: "Caster",
      image: "/assets/players/caster-1.png",
    },
    {
      name: "KB",
      role: "Analyst",
      image: "/assets/players/caster-2.png",
    },
    {
      name: "OM WAWA",
      role: "Caster",
      image: "/assets/players/caster-3.png",
    },
    {
      name: "TAZZ",
      role: "Analyst",
      image: "/assets/players/caster-4.png",
    },
  ],
  matchCard: {
    teamA: "ONIC",
    teamB: "BTR",
    stage: "GRAND FINALS",
    time: "17:30 WIB | BO3",
  },
  sponsor: {
    label: "OFFICIAL GAMING CHAIR",
    name: "TODAK",
    logo: "/assets/sponsors/todak.png",
  },
};

export const defaultSponsors = [
  {
    id: "ekraf",
    name: "EKRAF",
    label: "Supported By",
    logo: "/assets/sponsors/ekraf.png",
  },
  {
    id: "klik-indomaret",
    name: "Klik Indomaret",
    label: "Supplier",
    logo: "/assets/sponsors/klik-indomaret.png",
  },
  {
    id: "todak",
    name: "TODAK",
    label: "Official Gaming Chair",
    logo: "/assets/sponsors/todak.png",
  },
];

export const defaultSettings = {
  activeSeasonTab: "Regular Season",
  activeScheduleTab: "Regular Season",
  activeWeek: 9,
  showAdminButton: true,
  enableAnimations: true,
  enableCountdownAuto: false,
};

export const defaultTournamentConfig = createTournamentConfig();

export const defaultBracket = createInitialBracketFromTeams(defaultTeams);

export const defaultTournamentData = {
  tournamentConfig: defaultTournamentConfig,
  siteConfig: defaultSiteConfig,
  teams: defaultTeams,
  matches: defaultMatches,
  weeks: defaultWeeks,
  standings: defaultStandings,
  countdown: defaultCountdown,
  grandFinals: defaultGrandFinals,
  broadcast: defaultBroadcast,
  sponsors: defaultSponsors,
  settings: defaultSettings,
  bracket: defaultBracket,
};
