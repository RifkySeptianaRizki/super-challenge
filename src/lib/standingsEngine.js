/**
 * standingsEngine.js
 *
 * Computes tournament standings/rankings from the bracket data.
 * Single Elimination BO3 — ranking derived from bracket progress, not round-robin.
 *
 * All data flows from bracket + teams arrays (Zustand / localStorage).
 * No extra state is introduced; standings are always derived/computed.
 */

import { ROUND_ORDER } from "./bracketEngine";

// ── Round progress scores (higher = better) ────────────────────────────

const ROUND_PROGRESS = {
  champion: 100,
  runnerUp: 90,
  activeGF: 85,
  eliminatedSF: 60,
  activeSF: 70,
  eliminatedQF: 40,
  activeQF: 50,
  activeR16: 30,
  eliminatedR16: 10,
};

// ── Helpers ─────────────────────────────────────────────────────────────

/** Returns all completed matches from the bracket. */
export function getCompletedMatches(bracket) {
  if (!Array.isArray(bracket)) return [];
  return bracket.filter((m) => m.status === "completed" && m.winnerTeamId);
}

/** Returns all team IDs that are still active (not yet eliminated). */
export function getActiveTeams(bracket) {
  if (!Array.isArray(bracket)) return new Set();
  const eliminated = getEliminatedTeams(bracket);
  const all = new Set();
  bracket.forEach((m) => {
    if (m.teamAId) all.add(m.teamAId);
    if (m.teamBId) all.add(m.teamBId);
  });
  eliminated.forEach((id) => all.delete(id));
  return all;
}

/** Returns all eliminated team IDs. */
export function getEliminatedTeams(bracket) {
  if (!Array.isArray(bracket)) return new Set();
  const eliminated = new Set();
  getCompletedMatches(bracket).forEach((m) => {
    if (m.loserTeamId) eliminated.add(m.loserTeamId);
  });
  return eliminated;
}

/**
 * Returns the round string where a team was eliminated.
 * null if not yet eliminated.
 */
export function getEliminationRound(teamId, bracket) {
  if (!teamId || !Array.isArray(bracket)) return null;
  for (const m of bracket) {
    if (m.status === "completed" && m.loserTeamId === teamId) {
      return m.round;
    }
  }
  return null;
}

/**
 * Returns the highest round the team has appeared in.
 * "R16" | "QF" | "SF" | "GF" | null
 */
function getHighestRound(teamId, bracket) {
  if (!teamId || !Array.isArray(bracket)) return null;
  let best = -1;
  for (const m of bracket) {
    if (m.teamAId === teamId || m.teamBId === teamId) {
      const idx = ROUND_ORDER.indexOf(m.round);
      if (idx > best) best = idx;
    }
  }
  return best >= 0 ? ROUND_ORDER[best] : null;
}

/** Numerical round progress for ranking. */
export function getRoundProgress(teamId, bracket) {
  if (!teamId || !Array.isArray(bracket)) return 0;

  const gf = bracket.find((m) => m.id === "GF-1");
  const isGFCompleted = gf?.status === "completed";

  // Champion / Runner Up
  if (isGFCompleted) {
    if (gf.winnerTeamId === teamId) return ROUND_PROGRESS.champion;
    if (gf.loserTeamId === teamId) return ROUND_PROGRESS.runnerUp;
  }

  const eliminatedRound = getEliminationRound(teamId, bracket);

  if (eliminatedRound) {
    // Eliminated
    if (eliminatedRound === "GF") return ROUND_PROGRESS.runnerUp; // safety
    if (eliminatedRound === "SF") return ROUND_PROGRESS.eliminatedSF;
    if (eliminatedRound === "QF") return ROUND_PROGRESS.eliminatedQF;
    return ROUND_PROGRESS.eliminatedR16;
  }

  // Active teams
  const highest = getHighestRound(teamId, bracket);
  if (highest === "GF") return ROUND_PROGRESS.activeGF;
  if (highest === "SF") return ROUND_PROGRESS.activeSF;
  if (highest === "QF") return ROUND_PROGRESS.activeQF;
  if (highest === "R16") return ROUND_PROGRESS.activeR16;

  // Team in bracket but hasn't appeared yet
  return ROUND_PROGRESS.activeR16;
}

/** Calculate win rate. 0 if no matches. */
export function calculateWinRate(matchWins, matchesPlayed) {
  if (!matchesPlayed || matchesPlayed === 0) return 0;
  return Math.round((matchWins / matchesPlayed) * 100 * 10) / 10;
}

/**
 * Returns the current tournament status label for a team.
 */
export function getTeamCurrentStatus(teamId, bracket) {
  if (!teamId || !Array.isArray(bracket)) return "Waiting";

  const gf = bracket.find((m) => m.id === "GF-1");
  const isGFCompleted = gf?.status === "completed";

  if (isGFCompleted) {
    if (gf.winnerTeamId === teamId) return "Champion";
    if (gf.loserTeamId === teamId) return "Runner Up";
  }

  const eliminatedRound = getEliminationRound(teamId, bracket);
  if (eliminatedRound) {
    if (eliminatedRound === "SF") return "Semi Finalist";
    if (eliminatedRound === "QF") return "Quarter Finalist";
    return "Round of 16";
  }

  // Check if team is in the bracket at all
  const inBracket = bracket.some(
    (m) => m.teamAId === teamId || m.teamBId === teamId
  );
  if (inBracket) return "Active";
  return "Waiting";
}

/**
 * Return stats for one team from completed bracket matches.
 */
export function getTeamStats(teamId, bracket, teams) {
  const team = (Array.isArray(teams) ? teams : []).find(
    (t) => t.id === teamId
  );

  const stats = {
    teamId: teamId || "",
    teamName: team?.name || team?.code || teamId || "Unknown",
    teamCode: team?.code || "",
    logo: team?.logo_url || team?.logoUrl || team?.logo || team?.image || "",
    logoUrl: team?.logo_url || team?.logoUrl || team?.logo || team?.image || "",
    logo_url: team?.logo_url || team?.logoUrl || team?.logo || team?.image || "",
    seedNo: null,
    matchesPlayed: 0,
    matchWins: 0,
    matchLosses: 0,
    gameWins: 0,
    gameLosses: 0,
    gameDiff: 0,
    winRate: 0,
    currentRound: null,
    status: "Waiting",
  };

  if (!teamId || !Array.isArray(bracket)) return stats;

  // Find seed number
  for (const m of bracket) {
    if (m.round === "R16") {
      if (m.teamAId === teamId && m.teamASeed) {
        stats.seedNo = m.teamASeed;
        break;
      }
      if (m.teamBId === teamId && m.teamBSeed) {
        stats.seedNo = m.teamBSeed;
        break;
      }
    }
  }

  const completed = getCompletedMatches(bracket);

  for (const m of completed) {
    const isA = m.teamAId === teamId;
    const isB = m.teamBId === teamId;
    if (!isA && !isB) continue;

    stats.matchesPlayed += 1;

    if (m.winnerTeamId === teamId) {
      stats.matchWins += 1;
    } else {
      stats.matchLosses += 1;
    }

    if (isA) {
      stats.gameWins += m.scoreA ?? 0;
      stats.gameLosses += m.scoreB ?? 0;
    } else {
      stats.gameWins += m.scoreB ?? 0;
      stats.gameLosses += m.scoreA ?? 0;
    }
  }

  stats.gameDiff = stats.gameWins - stats.gameLosses;
  stats.winRate = calculateWinRate(stats.matchWins, stats.matchesPlayed);
  stats.currentRound = getHighestRound(teamId, bracket);
  stats.status = getTeamCurrentStatus(teamId, bracket);

  return stats;
}

/** Validate a standings row — ensure no NaN or undefined. */
export function validateStandingRow(row) {
  return {
    ...row,
    matchesPlayed: Number.isFinite(row.matchesPlayed) ? row.matchesPlayed : 0,
    matchWins: Number.isFinite(row.matchWins) ? row.matchWins : 0,
    matchLosses: Number.isFinite(row.matchLosses) ? row.matchLosses : 0,
    gameWins: Number.isFinite(row.gameWins) ? row.gameWins : 0,
    gameLosses: Number.isFinite(row.gameLosses) ? row.gameLosses : 0,
    gameDiff: Number.isFinite(row.gameDiff) ? row.gameDiff : 0,
    winRate: Number.isFinite(row.winRate) ? row.winRate : 0,
    seedNo: Number.isFinite(row.seedNo) ? row.seedNo : 99,
  };
}

/**
 * Sort standings array according to the single elimination ranking rules:
 * 1. roundProgress (higher better)
 * 2. matchWins (higher better)
 * 3. gameDiff (higher better)
 * 4. gameWins (higher better)
 * 5. seedNo (lower better)
 * 6. teamName alphabetical
 */
export function sortStandings(standings) {
  return [...standings].sort((a, b) => {
    const rpA = a._roundProgress ?? 0;
    const rpB = b._roundProgress ?? 0;
    if (rpB !== rpA) return rpB - rpA;
    if (b.matchWins !== a.matchWins) return b.matchWins - a.matchWins;
    if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
    if (b.gameWins !== a.gameWins) return b.gameWins - a.gameWins;
    // Lower seed = better
    const sA = a.seedNo ?? 99;
    const sB = b.seedNo ?? 99;
    if (sA !== sB) return sA - sB;
    return (a.teamName || "").localeCompare(b.teamName || "");
  });
}

/**
 * Primary function: build standings from bracket + teams.
 * Returns an array of 16 standing rows sorted by rank.
 */
export function buildStandingsFromBracket(bracket, teams) {
  const teamList = Array.isArray(teams) ? teams : [];
  const bracketArr = Array.isArray(bracket) ? bracket : [];

  // Collect all unique teamIds from bracket
  const bracketTeamIds = new Set();
  bracketArr.forEach((m) => {
    if (m.teamAId) bracketTeamIds.add(m.teamAId);
    if (m.teamBId) bracketTeamIds.add(m.teamBId);
  });

  // Build set of all team IDs (from teams array + bracket)
  const allTeamIds = new Set(teamList.map((t) => t.id).filter(Boolean));
  bracketTeamIds.forEach((id) => allTeamIds.add(id));

  // Build stats for every team
  const rows = [];
  for (const teamId of allTeamIds) {
    const stats = getTeamStats(teamId, bracketArr, teamList);
    const rp = getRoundProgress(teamId, bracketArr);
    const validated = validateStandingRow({
      ...stats,
      _roundProgress: rp,
    });
    rows.push(validated);
  }

  // Sort and assign rank
  const sorted = sortStandings(rows);
  return sorted.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}
