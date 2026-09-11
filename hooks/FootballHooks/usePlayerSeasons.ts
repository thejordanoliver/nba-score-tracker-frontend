import { useEffect, useState } from "react";
import { apiClient } from "utils/apiClient";

export type StatValue = number | string | null | undefined;

export type FootballLeague = "cfb" | "nfl";

export type Player = {
  id?: number | string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  short_name?: string | null;
  team_id: string | number | null;
  team_slug?: string | null;
  position: string | null;
  jersey_number?: string | number | null;
  headshot_url?: string | null;
  height?: string | number | null;
  weight?: string | number | null;
  experience?: string | number | null;
  college?: string | null;
  active?: boolean | null;
  status?: string | null;
};

export type SeasonTeam = {
  id: number | string;
  espn_id: number | string | null;
  name: string | null;
  short_name: string | null;
  code: string | null;
};

export type StatsObject = Record<string, Record<string, StatValue>>;

export type ApiSeason = {
  id: string | number;
  player_id: string | number;
  player_name: string;
  season: number;
  display_season: string | null;
  team_id: string | number;
  team_slug: string | null;
  position?: string | null;
  season_type: string;
  season_type_value: string | null;
  season_type_label: string;
  stats: StatsObject;
  created_at: string;
  updated_at: string;
  team?: SeasonTeam | null;
};

export type CanonicalProfile = {
  league: FootballLeague;
  playerId: string;
  redirected: boolean;
  redirectedFrom: {
    league: FootballLeague;
    playerId: string;
  } | null;
};

export type CollegeStatsResponse = {
  league: "cfb";
  playerId: string;
  seasons: ApiSeason[];
  count: number;
  hasStats: boolean;
};

export type PlayerStatsResponse = {
  requestedLeague?: FootballLeague;
  requestedPlayerId?: string;
  league: FootballLeague;
  playerId: string;
  player: Player;
  canonicalProfile?: CanonicalProfile;
  seasons: ApiSeason[];
  count?: number;
  hasStats?: boolean;
  collegeStats?: CollegeStatsResponse | null;
};

export type Stat = {
  name: string;
  label: string;
  value: number | null;
  displayValue: string;
  displayName: string;
  description?: string;
};

export type Category = {
  name: string;
  displayName: string;
  stats: Stat[];
};

export type FootballPlayerSeason = {
  id: string;
  playerId: string;
  playerName: string;
  year: string;
  season: number;
  displaySeason: string;
  teamId: string;
  teamSlug: string | null;
  team: SeasonTeam | null;
  position: string | null;
  seasonType: string;
  seasonTypeValue: string | null;
  seasonTypeLabel: string;
  categories: Category[];
  rawStats: StatsObject;
  createdAt: string;
  updatedAt: string;
  sourceLeague: FootballLeague;
};

const CATEGORY_ORDER = [
  "passing",
  "rushing",
  "receiving",
  "scoring",
  "defensive",
  "defensiveInterceptions",
  "returning",
  "kicking",
  "punting",
  "totals",
  "averages",
  "general",
] as const;

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  totals: "Totals",
  passing: "Passing",
  rushing: "Rushing",
  receiving: "Receiving",
  defensive: "Defense",
  defensiveInterceptions: "Defensive Interceptions",
  returning: "Returns",
  scoring: "Scoring",
  kicking: "Kicking",
  punting: "Punting",
  averages: "Averages",
  general: "General",
};

function toNumber(value: StatValue): number | null {
  if (value === null || value === undefined || value === "" || value === "-") {
    return null;
  }

  const parsed = Number(String(value).replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : null;
}

function toDisplayValue(value: StatValue): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function formatStatLabel(statName: string): string {
  return statName
    .replace(/_/g, " ")
    .replace(/-/g, " - ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getOrderedCategoryNames(stats: StatsObject): string[] {
  const availableCategoryNames = Object.keys(stats || {});

  const orderedKnownCategories = CATEGORY_ORDER.filter((categoryName) =>
    availableCategoryNames.includes(categoryName),
  );

  const unknownCategories = availableCategoryNames.filter(
    (categoryName) =>
      !CATEGORY_ORDER.includes(categoryName as (typeof CATEGORY_ORDER)[number]),
  );

  return [...orderedKnownCategories, ...unknownCategories];
}

function buildCategories(season: ApiSeason): Category[] {
  const statsObject = season.stats || {};

  return getOrderedCategoryNames(statsObject)
    .map((categoryName) => {
      const categoryStats = statsObject[categoryName];

      if (!categoryStats || Object.keys(categoryStats).length === 0) {
        return null;
      }

      const stats: Stat[] = Object.entries(categoryStats)
        .filter(
          ([, value]) => value !== null && value !== undefined && value !== "",
        )
        .map(([statName, value]) => ({
          name: statName,
          label: formatStatLabel(statName),
          value: toNumber(value),
          displayValue: toDisplayValue(value),
          displayName: formatStatLabel(statName),
        }));

      if (stats.length === 0) return null;

      return {
        name: categoryName,
        displayName:
          CATEGORY_DISPLAY_NAMES[categoryName] || formatStatLabel(categoryName),
        stats,
      };
    })
    .filter(Boolean) as Category[];
}

function mapSeason(
  season: ApiSeason,
  sourceLeague: FootballLeague,
): FootballPlayerSeason {
  const displaySeason = String(season.display_season || season.season);

  return {
    id: String(season.id),
    playerId: String(season.player_id),
    playerName: season.player_name || "",
    year: displaySeason,
    season: season.season,
    displaySeason,
    teamId: String(season.team_id),
    teamSlug: season.team_slug,
    team: season.team ?? null,
    position: season.position || null,
    seasonType: season.season_type,
    seasonTypeValue: season.season_type_value,
    seasonTypeLabel: season.season_type_label,
    categories: buildCategories(season),
    rawStats: season.stats || {},
    createdAt: season.created_at,
    updatedAt: season.updated_at,
    sourceLeague,
  };
}

function sortSeasons(seasons: FootballPlayerSeason[]): FootballPlayerSeason[] {
  return [...seasons].sort((a, b) => {
    if (b.season !== a.season) {
      return b.season - a.season;
    }

    return String(a.seasonTypeLabel).localeCompare(String(b.seasonTypeLabel));
  });
}

const EMPTY_API_SEASONS: ApiSeason[] = [];
const EMPTY_FOOTBALL_SEASONS: FootballPlayerSeason[] = [];

export function usePlayerSeasons(
  playerId: number,
  league: FootballLeague = "cfb",
) {
  const [data, setData] = useState<FootballPlayerSeason[]>([]);
  const [rawSeasons, setRawSeasons] = useState<ApiSeason[]>([]);

  const [collegeData, setCollegeData] = useState<FootballPlayerSeason[]>([]);
  const [rawCollegeSeasons, setRawCollegeSeasons] = useState<ApiSeason[]>([]);

  const [player, setPlayer] = useState<{
    id: string | null;
    name: string;
    position: string | null;
    teamId: string | null;
    headshotUrl: string | null;
    jerseyNumber: string | null;
    college: string | null;
  } | null>(null);

  const [resolvedLeague, setResolvedLeague] = useState<FootballLeague>(
    league.toLowerCase() as FootballLeague,
  );

  const [canonicalProfile, setCanonicalProfile] =
    useState<CanonicalProfile | null>(null);

  const [collegeLeague, setCollegeLeague] = useState<"cfb" | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasValidPlayerId = Number.isFinite(playerId) && playerId > 0;

  const fallbackLeague = league.toLowerCase() as FootballLeague;

  useEffect(() => {
    if (!hasValidPlayerId) {
      return;
    }

    let cancelled = false;

    const fetchSeasons = async () => {
      try {
        setLoading(true);
        setError(null);

        const requestedLeague = league.toLowerCase() as FootballLeague;

        const res = await apiClient.get<PlayerStatsResponse>(
          `api/player/stats/${requestedLeague}/${playerId}`,
        );

        if (cancelled) return;

        const json = res.data;

        const primarySeasons = Array.isArray(json.seasons) ? json.seasons : [];
        const collegeSeasons = Array.isArray(json.collegeStats?.seasons)
          ? json.collegeStats.seasons
          : [];

        const effectiveLeague = json.league;

        const mappedPrimarySeasons = sortSeasons(
          primarySeasons.map((season) => mapSeason(season, effectiveLeague)),
        );

        const mappedCollegeSeasons = sortSeasons(
          collegeSeasons.map((season) => mapSeason(season, "cfb")),
        );

        const firstPrimarySeason = primarySeasons[0];
        const firstCollegeSeason = collegeSeasons[0];

        const profileName =
          json.player?.full_name?.trim() ||
          [json.player?.first_name, json.player?.last_name]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          firstPrimarySeason?.player_name ||
          firstCollegeSeason?.player_name ||
          "";

        setPlayer({
          id:
            json.player?.id !== null && json.player?.id !== undefined
              ? String(json.player.id)
              : json.playerId
                ? String(json.playerId)
                : null,
          name: profileName,
          position:
            json.player?.position ||
            firstPrimarySeason?.position ||
            firstCollegeSeason?.position ||
            null,
          teamId:
            json.player?.team_id !== null && json.player?.team_id !== undefined
              ? String(json.player.team_id)
              : firstPrimarySeason?.team_id !== null &&
                  firstPrimarySeason?.team_id !== undefined
                ? String(firstPrimarySeason.team_id)
                : null,
          headshotUrl: json.player?.headshot_url?.trim() || null,
          jerseyNumber:
            json.player?.jersey_number !== null &&
            json.player?.jersey_number !== undefined
              ? String(json.player.jersey_number)
              : null,
          college: json.player?.college?.trim() || null,
        });

        setResolvedLeague(effectiveLeague);

        setCanonicalProfile(
          json.canonicalProfile
            ? {
                ...json.canonicalProfile,
                league: league,

                redirectedFrom: json.canonicalProfile.redirectedFrom
                  ? {
                      ...json.canonicalProfile.redirectedFrom,
                      league: league,
                    }
                  : null,
              }
            : {
                league: effectiveLeague,
                playerId: String(json.playerId ?? playerId),
                redirected: effectiveLeague !== requestedLeague,
                redirectedFrom:
                  effectiveLeague !== requestedLeague
                    ? {
                        league: requestedLeague,
                        playerId: String(playerId),
                      }
                    : null,
              },
        );

        setRawSeasons(primarySeasons);
        setData(mappedPrimarySeasons);

        setRawCollegeSeasons(collegeSeasons);
        setCollegeData(mappedCollegeSeasons);

        setCollegeLeague(
          json.collegeStats?.league === "cfb" && collegeSeasons.length > 0
            ? "cfb"
            : null,
        );
      } catch (err: any) {
        if (cancelled) return;

        setError(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch player seasons",
        );

        setData([]);
        setRawSeasons([]);
        setCollegeData([]);
        setRawCollegeSeasons([]);
        setPlayer(null);
        setCanonicalProfile(null);
        setCollegeLeague(null);
        setResolvedLeague(league.toLowerCase() as FootballLeague);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSeasons();

    return () => {
      cancelled = true;
    };
  }, [hasValidPlayerId, playerId, league]);

  const currentData = hasValidPlayerId ? data : EMPTY_FOOTBALL_SEASONS;

  const currentRawSeasons = hasValidPlayerId ? rawSeasons : EMPTY_API_SEASONS;

  const currentCollegeData = hasValidPlayerId
    ? collegeData
    : EMPTY_FOOTBALL_SEASONS;

  const currentRawCollegeSeasons = hasValidPlayerId
    ? rawCollegeSeasons
    : EMPTY_API_SEASONS;

  return {
    /**
     * Canonical/current league seasons.
     *
     * For an NFL player this is NFL data only.
     * If a CFB route resolves to an NFL player, this is still NFL data.
     */
    data: currentData,
    rawSeasons: currentRawSeasons,

    /**
     * Historical college seasons linked to the canonical pro profile.
     */
    collegeData: currentCollegeData,
    rawCollegeSeasons: currentRawCollegeSeasons,
    collegeLeague: hasValidPlayerId ? collegeLeague : null,

    /**
     * Always the canonical profile returned by the backend.
     * For pro players this stays the NFL profile.
     */
    player: hasValidPlayerId ? player : null,

    /**
     * Use this when deciding which league the stat table should treat
     * as the primary/current league.
     */
    resolvedLeague: hasValidPlayerId ? resolvedLeague : fallbackLeague,

    canonicalProfile: hasValidPlayerId ? canonicalProfile : null,

    hasCollegeStats: hasValidPlayerId && currentCollegeData.length > 0,

    loading: hasValidPlayerId ? loading : false,
    error: hasValidPlayerId ? error : null,
  };
}
