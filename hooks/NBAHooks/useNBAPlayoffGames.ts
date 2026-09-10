import {
  FetchPlayoffGamesOptions,
  NBAPlayoffGame,
  NBAPlayoffRound,
  NBAPlayoffSeries,
  NormalizedRoundKey,
  RoundDefinition,
  UseNBAPlayoffGamesOptions,
} from "@/types/basketball/basketball";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLiveSportsSubscription } from "hooks/useLiveSportsSubscription";
import { apiClient } from "utils/apiClient";

const ROUND_ORDER: RoundDefinition[] = [
  {
    key: "first-round",
    label: "First Round",
    order: 1,
  },
  {
    key: "conference-semifinals",
    label: "Conference Semifinals",
    order: 2,
  },
  {
    key: "conference-finals",
    label: "Conference Finals",
    order: 3,
  },
  {
    key: "finals",
    label: "NBA Finals",
    order: 4,
  },
];

const ROUND_BY_KEY = ROUND_ORDER.reduce(
  (acc, round) => {
    acc[round.key] = round;
    return acc;
  },
  {} as Record<NormalizedRoundKey, RoundDefinition>,
);

const normalizeText = (value?: unknown) =>
  String(value ?? "")
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const normalizeConference = (value?: unknown) => {
  const text = normalizeText(value);

  if (text === "east" || text.includes("eastern")) return "east";
  if (text === "west" || text.includes("western")) return "west";
  if (text === "finals" || text.includes("nba finals")) return "finals";

  return undefined;
};

const getGameTimestamp = (game: NBAPlayoffGame) => {
  if (typeof game.timestamp === "number") return game.timestamp;

  const rawDate = game.startDate || game.date;

  if (!rawDate) return 0;

  const parsed = new Date(rawDate).getTime();

  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortGames = (games: NBAPlayoffGame[]) =>
  [...games].sort((a, b) => {
    const aGameNumber = a.playoff?.gameNumber ?? Number.MAX_SAFE_INTEGER;
    const bGameNumber = b.playoff?.gameNumber ?? Number.MAX_SAFE_INTEGER;

    if (aGameNumber !== bGameNumber) {
      return aGameNumber - bGameNumber;
    }

    return getGameTimestamp(a) - getGameTimestamp(b);
  });

const getRoundFromText = (
  rawText: string,
  allowGenericFinals: boolean,
): RoundDefinition | null => {
  const text = normalizeText(rawText);

  if (!text) return null;

  const isFirstRound =
    /\b(first|1st)\s+round\b/.test(text) ||
    /\bround\s*1\b/.test(text) ||
    /\bround\s+one\b/.test(text) ||
    /\bconference\s+quarterfinals?\b/.test(text) ||
    /\bquarterfinals?\b/.test(text);

  if (isFirstRound) {
    return ROUND_BY_KEY["first-round"];
  }

  const isConferenceSemifinals =
    /\bconference\s+semifinals?\b/.test(text) ||
    /\bconf\s+semifinals?\b/.test(text) ||
    /\bsemifinals?\b/.test(text) ||
    /\bsemi\s+finals?\b/.test(text) ||
    /\bsemis?\b/.test(text) ||
    /\b(second|2nd)\s+round\b/.test(text) ||
    /\bround\s*2\b/.test(text) ||
    /\bround\s+two\b/.test(text);

  if (isConferenceSemifinals) {
    return ROUND_BY_KEY["conference-semifinals"];
  }

  const isConferenceFinals =
    /\bconference\s+finals?\b/.test(text) ||
    /\bconf\s+finals?\b/.test(text) ||
    /\beastern\s+conference\s+finals?\b/.test(text) ||
    /\bwestern\s+conference\s+finals?\b/.test(text) ||
    /\beast\s+conference\s+finals?\b/.test(text) ||
    /\bwest\s+conference\s+finals?\b/.test(text) ||
    /\beast\s+finals?\b/.test(text) ||
    /\bwest\s+finals?\b/.test(text) ||
    /\b(third|3rd)\s+round\b/.test(text) ||
    /\bround\s*3\b/.test(text) ||
    /\bround\s+three\b/.test(text);

  if (isConferenceFinals) {
    return ROUND_BY_KEY["conference-finals"];
  }

  const isNBAFinals =
    /\bnba\s+finals?\b/.test(text) ||
    /\bchampionship\b/.test(text) ||
    (allowGenericFinals && /\bfinals?\b/.test(text));

  if (isNBAFinals) {
    return ROUND_BY_KEY.finals;
  }

  return null;
};

const inferRoundDefinition = (game: NBAPlayoffGame): RoundDefinition => {
  /**
   * Important:
   * Use headline/name first because your API can return:
   * headline: "East Semifinals - Game 3"
   * playoff.roundKey: "finals"
   * playoff.roundLabel: "NBA Finals"
   */
  const primaryText = [
    game.headline,
    game.name,
    game.shortName,
    game.playoff?.seriesLabel,
  ]
    .filter(Boolean)
    .join(" ");

  const roundFromPrimaryText = getRoundFromText(primaryText, false);

  if (roundFromPrimaryText) {
    return roundFromPrimaryText;
  }

  const fallbackText = [
    game.playoff?.roundKey,
    game.playoff?.roundLabel,
    game.headline,
    game.name,
    game.shortName,
  ]
    .filter(Boolean)
    .join(" ");

  const roundFromFallbackText = getRoundFromText(fallbackText, true);

  return roundFromFallbackText ?? ROUND_BY_KEY["first-round"];
};

const normalizeGameRound = (game: NBAPlayoffGame): NBAPlayoffGame => {
  const round = inferRoundDefinition(game);

  return {
    ...game,
    playoff: {
      ...game.playoff,
      roundKey: round.key,
      roundLabel: round.label,
    },
  };
};

const getUniqueGameKey = (game: NBAPlayoffGame) => {
  const id = game.id != null ? String(game.id) : "";
  const start = game.startDate || game.date || "";
  const headline = game.headline || game.name || game.shortName || "";

  return id || `${start}-${headline}`;
};

const getAllGamesFromResponse = (data: any): NBAPlayoffGame[] => {
  const topLevelGames = Array.isArray(data?.games) ? data.games : [];

  const nestedRoundGames = Array.isArray(data?.rounds)
    ? data.rounds.flatMap((round: NBAPlayoffRound) =>
        Array.isArray(round?.series)
          ? round.series.flatMap((series) =>
              Array.isArray(series?.games) ? series.games : [],
            )
          : [],
      )
    : [];

  const map = new Map<string, NBAPlayoffGame>();

  [...topLevelGames, ...nestedRoundGames].forEach((game) => {
    if (!game) return;

    const key = getUniqueGameKey(game);

    if (!key) return;

    map.set(key, normalizeGameRound(game));
  });

  return [...map.values()].sort(
    (a, b) => getGameTimestamp(a) - getGameTimestamp(b),
  );
};

const getSeriesKey = (game: NBAPlayoffGame) => {
  if (game.playoff?.seriesKey) return String(game.playoff.seriesKey);

  const homeId = game.home?.id ?? game.home?.espnId ?? game.home?.code;
  const awayId = game.away?.id ?? game.away?.espnId ?? game.away?.code;

  if (homeId != null && awayId != null) {
    return [String(homeId), String(awayId)].sort().join("-");
  }

  if (game.playoff?.seriesLabel) {
    return normalizeText(game.playoff.seriesLabel);
  }

  return String(game.id);
};

const getSeriesLabel = (game: NBAPlayoffGame) => {
  if (game.playoff?.seriesLabel) return game.playoff.seriesLabel;

  const awayName = game.away?.name || game.away?.shortName || game.away?.code;
  const homeName = game.home?.name || game.home?.shortName || game.home?.code;

  if (awayName && homeName) {
    return `${awayName} vs ${homeName}`;
  }

  return game.headline || game.name || "Playoff Series";
};

const getTeamIds = (game: NBAPlayoffGame): (string | number)[] => {
  const awayId = game.away?.id ?? game.away?.espnId;
  const homeId = game.home?.id ?? game.home?.espnId;

  return [awayId, homeId].filter(
    (value): value is string | number =>
      value !== undefined && value !== null && value !== "",
  );
};

const getTeamCodes = (game: NBAPlayoffGame) =>
  [game.away?.code, game.home?.code].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );

const getTeamNames = (game: NBAPlayoffGame) =>
  [
    game.away?.name || game.away?.shortName || game.away?.code,
    game.home?.name || game.home?.shortName || game.home?.code,
  ].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );

const buildSeriesFromGames = (games: NBAPlayoffGame[]): NBAPlayoffSeries[] => {
  const seriesMap = new Map<string, NBAPlayoffGame[]>();

  games.forEach((game) => {
    const key = getSeriesKey(game);
    const existing = seriesMap.get(key) ?? [];

    existing.push(game);
    seriesMap.set(key, existing);
  });

  return [...seriesMap.entries()]
    .map(([key, seriesGames]) => {
      const sortedGames = sortGames(seriesGames);
      const firstGame = sortedGames[0];

      return {
        key,
        label: firstGame ? getSeriesLabel(firstGame) : "Playoff Series",
        teamIds: firstGame ? getTeamIds(firstGame) : [],
        teamCodes: firstGame ? getTeamCodes(firstGame) : [],
        teamNames: firstGame ? getTeamNames(firstGame) : [],
        count: sortedGames.length,
        games: sortedGames,
      };
    })
    .sort((a, b) => {
      const aFirstGame = a.games[0];
      const bFirstGame = b.games[0];

      return getGameTimestamp(aFirstGame) - getGameTimestamp(bFirstGame);
    });
};

const buildRoundsFromGames = (games: NBAPlayoffGame[]): NBAPlayoffRound[] => {
  return ROUND_ORDER.map((round) => {
    const roundGames = games.filter(
      (game) => game.playoff?.roundKey === round.key,
    );

    const series = buildSeriesFromGames(roundGames);

    return {
      key: round.key,
      label: round.label,
      order: round.order,
      count: roundGames.length,
      series,
    };
  }).filter((round) => round.count > 0 || round.series.length > 0);
};

const normalizeSeriesFromApi = (series: NBAPlayoffSeries): NBAPlayoffSeries => {
  const games = Array.isArray(series.games)
    ? sortGames(series.games.map(normalizeGameRound))
    : [];

  return {
    ...series,
    conference:
      normalizeConference(series.conference) ??
      normalizeConference(series.teams?.top?.conference) ??
      normalizeConference(series.teams?.bottom?.conference) ??
      series.conference,
    teamIds: Array.isArray(series.teamIds) ? series.teamIds : [],
    teamCodes: Array.isArray(series.teamCodes) ? series.teamCodes : [],
    teamNames: Array.isArray(series.teamNames) ? series.teamNames : [],
    count: series.count ?? games.length,
    games,
  };
};

const getRoundsFromResponse = (
  data: any,
  fallbackGames: NBAPlayoffGame[],
): NBAPlayoffRound[] => {
  const apiRounds = Array.isArray(data?.rounds) ? data.rounds : [];

  const normalizedRounds = apiRounds
    .map((round: NBAPlayoffRound) => {
      const roundDefinition =
        ROUND_BY_KEY[round.key as NormalizedRoundKey] ??
        getRoundFromText(round.label || round.key, true);
      const series = Array.isArray(round.series)
        ? round.series.map(normalizeSeriesFromApi)
        : [];
      const count =
        typeof round.count === "number"
          ? round.count
          : series.reduce((total, item) => total + item.count, 0);

      return {
        ...round,
        key: roundDefinition?.key ?? round.key,
        label: roundDefinition?.label ?? round.label,
        order: roundDefinition?.order ?? round.order,
        count,
        series,
      };
    })
    .filter((round: NBAPlayoffRound) => round.series.length > 0)
    .sort((a: NBAPlayoffRound, b: NBAPlayoffRound) => a.order - b.order);

  return normalizedRounds.length > 0
    ? normalizedRounds
    : buildRoundsFromGames(fallbackGames);
};

function isLiveNBAPlayoffGame(game: NBAPlayoffGame) {
  const state = String(game?.status?.state || "").toLowerCase();
  const description = String(game?.status?.description || "").toLowerCase();
  const detail = String(game?.status?.detail || "").toLowerCase();
  const shortDetail = String(game?.status?.shortDetail || "").toLowerCase();

  if (game?.status?.completed === true) {
    return false;
  }

  return (
    state === "in" ||
    description.includes("in progress") ||
    detail.includes("in progress") ||
    shortDetail.includes("in progress") ||
    description.includes("live") ||
    detail.includes("live") ||
    shortDetail.includes("live")
  );
}

export function useNBAPlayoffGames({
  season = new Date().getFullYear(),
  dates,
  enabled = true,
  pollLiveGames = true,
  pollIntervalMs = 10000,
}: UseNBAPlayoffGamesOptions = {}) {
  const [games, setGames] = useState<NBAPlayoffGame[]>([]);
  const [rounds, setRounds] = useState<NBAPlayoffRound[]>([]);
  const [seasonData, setSeasonData] = useState<any>(null);
  const [leagueInfo, setLeagueInfo] = useState<any>(null);
  const [count, setCount] = useState(0);
  const [roundCount, setRoundCount] = useState(0);

  const [loading, setLoading] = useState(enabled);
  const [refreshingGames, setRefreshingGames] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const params = useMemo(() => {
    const nextParams: Record<string, string | number> = {};

    if (dates) {
      nextParams.dates = dates;
    } else if (season) {
      nextParams.season = season;
    }

    return nextParams;
  }, [dates, season]);

  const fetchPlayoffGames = useCallback(
    async ({
      forceRefresh = false,
      silent = false,
    }: FetchPlayoffGamesOptions = {}) => {
      if (!enabled) return;

      try {
        setError(null);

        if (!forceRefresh && !silent) {
          setLoading(true);
        }

        const { data } = await apiClient.get(
          "/api/games/basketball/nba/playoffs",
          {
            params,
          },
        );

        const normalizedGames = getAllGamesFromResponse(data);
        const normalizedRounds = getRoundsFromResponse(data, normalizedGames);

        setGames(normalizedGames);
        setRounds(normalizedRounds);
        setSeasonData(data?.season ?? null);
        setLeagueInfo(data?.leagueInfo ?? null);
        setCount(normalizedGames.length);
        setRoundCount(normalizedRounds.length);
      } catch (err) {
        console.error("Failed to fetch NBA playoff games:", err);

        setError(new Error("Failed to fetch NBA playoff games"));
        setGames([]);
        setRounds([]);
        setSeasonData(null);
        setLeagueInfo(null);
        setCount(0);
        setRoundCount(0);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [enabled, params],
  );

  const refreshGames = useCallback(async () => {
    setRefreshingGames(true);

    try {
      await fetchPlayoffGames({ forceRefresh: true });
    } finally {
      setRefreshingGames(false);
    }
  }, [fetchPlayoffGames]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    fetchPlayoffGames();
  }, [enabled, fetchPlayoffGames]);

  const hasLiveGame = useMemo(() => {
    return games.some(isLiveNBAPlayoffGame);
  }, [games]);

  useLiveSportsSubscription<any>({
    enabled: enabled && pollLiveGames && hasLiveGame && pollIntervalMs > 0,
    kind: "scoreboard",
    payload: {
      sport: "basketball",
      league: "nba",
      feed: "nbaPlayoffs",
      season,
      dates,
    },
    onUpdate: (payload) => {
      const normalizedGames = getAllGamesFromResponse(payload);
      const normalizedRounds = getRoundsFromResponse(payload, normalizedGames);

      setGames(normalizedGames);
      setRounds(normalizedRounds);
      setSeasonData(payload?.season ?? null);
      setLeagueInfo(payload?.leagueInfo ?? null);
      setCount(normalizedGames.length);
      setRoundCount(normalizedRounds.length);
    },
  });

  return {
    games,
    rounds,
    season: seasonData,
    leagueInfo,
    count,
    roundCount,

    loading,
    refreshingGames,
    error,

    hasLiveGame,
    refreshGames,
    fetchPlayoffGames,
  };
}
