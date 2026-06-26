import { useMemo, useState } from "react";
import { ExternalLink, Plus, RefreshCw, XCircle } from "lucide-react";
import { SEED_PAIRINGS, sanitizeTeamCode, sanitizeText } from "../../../lib/bracketEngine";
import { getImageUrlStatus, sanitizeImageUrl } from "../../../lib/imageUtils";
import TeamLogo from "../../TeamLogo";
import { AdminButton, AdminPanel, SectionHeader } from "../AdminUI";

const getLogoValue = (team = {}) => (
  team.logoUrl ?? team.logo_url ?? team.logo ?? team.image ?? ""
);

const getSeedValue = (team, fallback) => {
  const parsed = Number(team.seedNo ?? team.seed_no ?? team.rank ?? fallback);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 16 ? parsed : fallback;
};

const makeTeamId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `team-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `team-${Date.now()}`;
};

export default function TeamsAndSeeding(props) {
  const draftKey = useMemo(() => (
    props.store.lastSyncedAt || props.store.teams.map((team) => `${team.id}:${team.updatedAt || ""}:${team.logo_url || team.logoUrl || team.logo || ""}`).join("|")
  ), [props.store.lastSyncedAt, props.store.teams]);

  return <TeamsAndSeedingEditor key={draftKey} {...props} initialTeams={props.store.teams} />;
}

function TeamsAndSeedingEditor({ store, teamsById, activeSeedIds, selectedCounts, setSeedIds, runAction, generateFromSeeds, initialTeams }) {
  const [teamsDraft, setTeamsDraft] = useState(initialTeams);
  const [logoLoadErrors, setLogoLoadErrors] = useState({});
  const [logoTestKeys, setLogoTestKeys] = useState({});

  const logoStatuses = useMemo(() => (
    teamsDraft.map((team) => getImageUrlStatus(getLogoValue(team), { allowRelativeAssets: true }))
  ), [teamsDraft]);

  const seedCounts = useMemo(() => (
    teamsDraft.reduce((acc, team, index) => {
      const seedNo = getSeedValue(team, index + 1);
      acc[seedNo] = (acc[seedNo] || 0) + 1;
      return acc;
    }, {})
  ), [teamsDraft]);

  const hasInvalidLogo = logoStatuses.some((status) => !status.valid);
  const hasInvalidTeam = teamsDraft.some((team, index) => {
    const seedNo = getSeedValue(team, index + 1);
    return !sanitizeTeamCode(team.code) || !sanitizeText(team.name, 60) || seedCounts[seedNo] > 1;
  });
  const saveDisabled = hasInvalidLogo || hasInvalidTeam || store.saving;

  const updateDraftTeam = (index, payload) => {
    setTeamsDraft((current) => current.map((team, teamIndex) => (
      teamIndex === index ? { ...team, ...payload } : team
    )));
  };

  const addTeamDraft = () => {
    if (teamsDraft.length >= 16) return;
    const seedNo = teamsDraft.length + 1;
    setTeamsDraft((current) => [
      ...current,
      {
        id: makeTeamId(),
        code: "",
        name: "",
        fullName: "",
        shortName: "",
        seedNo,
        rank: seedNo,
        sortOrder: seedNo,
        logo: "",
        logoUrl: "",
        logo_url: "",
        logoKey: "",
        city: "",
        isActive: true,
        metadata: {},
      },
    ]);
  };

  const clearLogo = (index) => {
    const team = teamsDraft[index];
    updateDraftTeam(index, {
      logo: "",
      logoUrl: "",
      logo_url: "",
      image: "",
    });
    setLogoLoadErrors((current) => ({ ...current, [team.id || index]: false }));
  };

  const testLogo = (index) => {
    const team = teamsDraft[index];
    const key = team.id || index;
    setLogoLoadErrors((current) => ({ ...current, [key]: false }));
    setLogoTestKeys((current) => ({ ...current, [key]: (current[key] || 0) + 1 }));
  };

  const openLogo = (status) => {
    if (!status.valid || !status.sanitized) return;
    window.open(status.sanitized, "_blank", "noopener,noreferrer");
  };

  const saveTeams = () => {
    if (saveDisabled) {
      throw new Error("Periksa kode, nama, seed, dan URL logo sebelum menyimpan.");
    }

    return store.updateTeams(teamsDraft.map((team, index) => {
      const seedNo = getSeedValue(team, index + 1);
      const logoUrl = sanitizeImageUrl(getLogoValue(team), { allowRelativeAssets: true }) || "";
      const fullName = sanitizeText(team.fullName || team.shortName || team.short_name || team.name, 80);

      return {
        ...team,
        code: sanitizeTeamCode(team.code),
        name: sanitizeText(team.name, 60),
        fullName,
        shortName: fullName,
        short_name: fullName,
        rank: seedNo,
        seedNo,
        seed_no: seedNo,
        sortOrder: seedNo,
        logo: logoUrl,
        logoUrl,
        logo_url: logoUrl,
      };
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader
        title="Teams & Seeding"
        description="Atur 16 seed dengan dropdown. Bracket pairing mengikuti standar esports."
        action={
          <div className="flex flex-wrap gap-3">
            <AdminButton variant="ghost" onClick={() => setSeedIds(Array(16).fill(""))}>
              Clear Seeds
            </AdminButton>
            <AdminButton variant="secondary" onClick={() => runAction(store.initializeBracketFromStandings, "Bracket generated from standings.")}>
              From Standings
            </AdminButton>
            <AdminButton onClick={() => runAction(generateFromSeeds, "Bracket generated from seed list.")}>
              Generate Bracket
            </AdminButton>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <AdminPanel title="Seed Assignments" caption="Pilih tim untuk tiap posisi seed.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 16 }, (_, index) => {
              const seedNo = index + 1;
              const teamId = activeSeedIds[index] || "";
              const selectedTeam = teamsById.get(teamId);
              const duplicate = teamId && selectedCounts[teamId] > 1;
              return (
                <div key={seedNo} className="relative rounded-xl border border-[#731414]/30 bg-[#260505]/60 p-4 transition-all focus-within:border-[#F22738] focus-within:shadow-[0_0_15px_rgba(242,39,56,0.15)]">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#F2D98D]">Seed {seedNo}</span>
                    {duplicate && <span className="rounded bg-[#F22738]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#F22738] animate-pulse">Duplicate</span>}
                  </div>
                  <div className="mb-3 flex min-h-8 items-center gap-2 rounded-lg border border-[#731414]/30 bg-[#120303]/50 px-2 py-1.5">
                    <TeamLogo team={selectedTeam} code={selectedTeam?.code || "TBA"} size="xs" variant="subtle" />
                    <span className="truncate text-xs font-black uppercase tracking-wide text-white/80">
                      {selectedTeam ? `${selectedTeam.code} - ${selectedTeam.name}` : "TBA"}
                    </span>
                  </div>
                  <select
                    value={teamId}
                    onChange={(event) => {
                      const next = [...activeSeedIds];
                      next[index] = event.target.value;
                      setSeedIds(next);
                    }}
                    className="w-full appearance-none rounded-lg border border-[#731414]/50 bg-[#400C0C] px-3 py-2.5 text-sm font-bold text-white outline-none transition-colors focus:border-[#F2D98D]"
                  >
                    <option value="">Select team</option>
                    {store.teams.map((team) => (
                      <option
                        key={team.id}
                        value={team.id}
                        disabled={Boolean(activeSeedIds.includes(team.id) && team.id !== teamId)}
                      >
                        {team.code} - {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </AdminPanel>

        <AdminPanel title="Pairing Preview" caption="Hasil matchup Round of 16.">
          <div className="space-y-3">
            {SEED_PAIRINGS.map((pairing) => {
              const teamA = teamsById.get(activeSeedIds[pairing.seedA - 1]);
              const teamB = teamsById.get(activeSeedIds[pairing.seedB - 1]);
              return (
                <div key={pairing.id} className="group relative overflow-hidden rounded-xl border border-[#731414]/40 bg-gradient-to-r from-[#400C0C]/80 to-[#260505]/80 p-3 shadow-md">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#F2D98D]" />
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#F2D98D]">{pairing.id}</div>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm font-black text-white">
                    <div className="flex min-w-0 items-center gap-2">
                      <TeamLogo team={teamA} code={teamA?.code || "TBA"} size="xs" />
                      <span className="truncate">{teamA?.code ? `S${pairing.seedA} ${teamA.code}` : "TBA"}</span>
                    </div>
                    <span className="shrink-0 text-xs text-[#F22738]">VS</span>
                    <div className="flex min-w-0 items-center justify-end gap-2 text-right">
                      <span className="truncate">{teamB?.code ? `S${pairing.seedB} ${teamB.code}` : "TBA"}</span>
                      <TeamLogo team={teamB} code={teamB?.code || "TBA"} size="xs" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </AdminPanel>
      </div>

      <AdminPanel
        title="Team Master Data"
        caption="Upload logo ke Cloudinary, lalu paste URL gambar HTTPS di sini."
        action={
          <div className="flex flex-wrap gap-2">
            <AdminButton size="sm" variant="secondary" icon={Plus} onClick={addTeamDraft} disabled={teamsDraft.length >= 16}>
              Add Team
            </AdminButton>
            <AdminButton size="sm" onClick={() => runAction(saveTeams, "Teams saved.")} disabled={saveDisabled}>
              Save Teams
            </AdminButton>
          </div>
        }
      >
        {(hasInvalidLogo || hasInvalidTeam) && (
          <div className="mb-4 rounded-xl border border-[#F2D98D]/35 bg-[#F2D98D]/10 px-4 py-3 text-xs font-bold text-[#F2D98D]">
            Save dinonaktifkan sampai semua kode, nama, seed, dan URL logo valid.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teamsDraft.map((team, index) => {
            const seedNo = getSeedValue(team, index + 1);
            const logoStatus = logoStatuses[index];
            const teamKey = team.id || index;
            const duplicateSeed = seedCounts[seedNo] > 1;
            const logoLoadFailed = Boolean(logoLoadErrors[teamKey]);
            const logoUrl = getLogoValue(team);

            return (
              <div key={teamKey} className="group relative overflow-hidden rounded-2xl border border-[#731414]/30 bg-gradient-to-br from-[#400C0C] to-[#260505] p-4 transition-all hover:-translate-y-1 hover:border-[#F2D98D]/40 hover:shadow-lg">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#F2D98D]/60">Team {index + 1}</div>
                  <TeamLogo
                    key={`${teamKey}-${logoTestKeys[teamKey] || 0}`}
                    src={logoStatus?.sanitized}
                    team={{ ...team, logo_url: logoStatus?.sanitized || "" }}
                    code={team.code}
                    name={team.name}
                    size="lg"
                    rounded="lg"
                    onLoadError={() => setLogoLoadErrors((current) => ({ ...current, [teamKey]: true }))}
                    onLoadSuccess={() => setLogoLoadErrors((current) => ({ ...current, [teamKey]: false }))}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-[1fr_86px] gap-2">
                    <input
                      value={team.code || ""}
                      placeholder="CODE"
                      onChange={(event) => {
                        updateDraftTeam(index, { code: sanitizeTeamCode(event.target.value) });
                      }}
                      className="w-full rounded-lg border border-[#731414]/50 bg-[#120303]/60 px-3 py-2 text-sm font-black uppercase tracking-wider text-white outline-none focus:border-[#F2D98D] focus:ring-1 focus:ring-[#F2D98D]/20"
                    />
                    <input
                      type="number"
                      min="1"
                      max="16"
                      value={seedNo}
                      aria-label={`Seed ${team.code || index + 1}`}
                      onChange={(event) => {
                        const nextSeed = Number(event.target.value);
                        updateDraftTeam(index, {
                          seedNo: nextSeed,
                          seed_no: nextSeed,
                          rank: nextSeed,
                          sortOrder: nextSeed,
                        });
                      }}
                      className="w-full rounded-lg border border-[#731414]/50 bg-[#120303]/60 px-3 py-2 text-sm font-black text-white outline-none focus:border-[#F2D98D] focus:ring-1 focus:ring-[#F2D98D]/20"
                    />
                  </div>

                  <input
                    value={team.name || ""}
                    placeholder="Team Name"
                    onChange={(event) => {
                      updateDraftTeam(index, { name: sanitizeText(event.target.value, 60) });
                    }}
                    className="w-full rounded-lg border border-[#731414]/50 bg-[#120303]/60 px-3 py-2 text-sm font-bold text-white/80 outline-none focus:border-[#F2D98D] focus:ring-1 focus:ring-[#F2D98D]/20"
                  />

                  <input
                    value={team.shortName || team.short_name || team.fullName || ""}
                    placeholder="Short name / city"
                    onChange={(event) => {
                      const next = sanitizeText(event.target.value, 80);
                      updateDraftTeam(index, { shortName: next, short_name: next, fullName: next });
                    }}
                    className="w-full rounded-lg border border-[#731414]/50 bg-[#120303]/60 px-3 py-2 text-sm font-bold text-white/80 outline-none focus:border-[#F2D98D] focus:ring-1 focus:ring-[#F2D98D]/20"
                  />

                  <input
                    value={team.city || ""}
                    placeholder="City (optional)"
                    onChange={(event) => {
                      updateDraftTeam(index, { city: sanitizeText(event.target.value, 80) });
                    }}
                    className="w-full rounded-lg border border-[#731414]/50 bg-[#120303]/60 px-3 py-2 text-sm font-bold text-white/80 outline-none focus:border-[#F2D98D] focus:ring-1 focus:ring-[#F2D98D]/20"
                  />

                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-[#F2D98D]/70">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      value={logoUrl}
                      placeholder="Paste Cloudinary image URL, contoh: https://res.cloudinary.com/..."
                      onChange={(event) => {
                        const nextLogo = event.target.value;
                        updateDraftTeam(index, {
                          logo: nextLogo,
                          logoUrl: nextLogo,
                          logo_url: nextLogo,
                        });
                        setLogoLoadErrors((current) => ({ ...current, [teamKey]: false }));
                      }}
                      className="w-full rounded-lg border border-[#731414]/50 bg-[#120303]/60 px-3 py-2 text-sm font-semibold text-white/80 outline-none placeholder:text-white/25 focus:border-[#F2D98D] focus:ring-1 focus:ring-[#F2D98D]/20"
                    />
                    <p className="mt-1.5 text-[10px] font-semibold leading-relaxed text-white/40">
                      Upload logo ke Cloudinary, lalu paste URL gambar HTTPS di sini.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => clearLogo(index)}
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[#731414]/50 bg-[#120303]/60 px-2.5 text-[10px] font-black uppercase tracking-wider text-white/60 transition hover:border-[#F2D98D]/50 hover:text-[#F2D98D]"
                    >
                      <XCircle size={12} /> Clear Logo
                    </button>
                    <button
                      type="button"
                      onClick={() => testLogo(index)}
                      disabled={!logoStatus?.valid}
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[#731414]/50 bg-[#120303]/60 px-2.5 text-[10px] font-black uppercase tracking-wider text-white/60 transition hover:border-[#F2D98D]/50 hover:text-[#F2D98D] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <RefreshCw size={12} /> Test Image
                    </button>
                    <button
                      type="button"
                      onClick={() => openLogo(logoStatus)}
                      disabled={!logoStatus?.valid || !logoStatus?.sanitized}
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[#731414]/50 bg-[#120303]/60 px-2.5 text-[10px] font-black uppercase tracking-wider text-white/60 transition hover:border-[#F2D98D]/50 hover:text-[#F2D98D] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ExternalLink size={12} /> Open Logo
                    </button>
                  </div>

                  {duplicateSeed && (
                    <p className="rounded-lg border border-[#F22738]/30 bg-[#F22738]/10 px-3 py-2 text-[10px] font-bold text-[#F22738]">
                      Seed harus unik untuk setiap team.
                    </p>
                  )}
                  {!logoStatus?.valid && (
                    <p className="rounded-lg border border-[#F22738]/30 bg-[#F22738]/10 px-3 py-2 text-[10px] font-bold text-[#F22738]">
                      {logoStatus?.error || "URL logo harus menggunakan HTTPS."}
                    </p>
                  )}
                  {logoStatus?.valid && logoStatus.warning && (
                    <p className="rounded-lg border border-[#F2D98D]/30 bg-[#F2D98D]/10 px-3 py-2 text-[10px] font-bold text-[#F2D98D]">
                      {logoStatus.warning}
                    </p>
                  )}
                  {logoLoadFailed && logoStatus?.sanitized && (
                    <p className="rounded-lg border border-[#F22738]/30 bg-[#F22738]/10 px-3 py-2 text-[10px] font-bold text-[#F22738]">
                      Logo tidak bisa dimuat. Periksa link Cloudinary.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </AdminPanel>
    </div>
  );
}
