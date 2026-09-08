import { HockeyGame } from "@/types/hockey/hockey";
import { useTeamMonthSelector } from "hooks/LeagueHooks/useMonthSelector";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ScheduleMonthGroup,
  ScheduleMonthKey,
  ScheduleMonthOption,
} from "types/schedule";
import { apiClient } from "utils/apiClient";
import { getFirstSeasonGame } from "utils/seasonGames";
import {
  buildScheduleMonthOptions,
  getScheduleGamesForMonth,
  isScheduleOpeningMonth,
} from "utils/teamSchedule";

export type TeamScheduleLeague = "nhl" | "mch";

export type ScheduleMonth = ScheduleMonthGroup<HockeyGame>;

export type TeamScheduleTeam = {
  id?: string;
  code?: string;
  location?: string;
  name?: string;
  displayName?: string;
  color?: string;
  logo?: string;
  recordSummary?: string;
  seasonSummary?: string;
  standingSummary?: string;
  groups?: any;
};

export type TeamScheduleResponse = {
  league: string;
  team: TeamScheduleTeam | null;
  season: any;
  games: HockeyGame[];
  months: ScheduleMonth[];
};

export interface UseTeamGamesResult {
  games: HockeyGame[];
  months: ScheduleMonthOption[];
  selectedMonthKey: ScheduleMonthKey | null;
  selectMonth: (key: ScheduleMonthKey) => void;
  firstSeasonGame: HockeyGame | null;
  showCountdown: boolean;
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

function groupGamesByMonth(games: HockeyGame[]): ScheduleMonth[] {
  const monthFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const monthMap = new Map<string, ScheduleMonth>();

  games.forEach((game) => {
    const date = game.date ? new Date(game.date) : null;

    if (!date || Number.isNaN(date.getTime())) {
      const key = "unknown";

      if (!monthMap.has(key)) {
        monthMap.set(key, {
          key,
          label: "Unknown Date",
          year: null,
          month: null,
          games: [],
        });
      }

      monthMap.get(key)?.games.push(game);
      return;
    }

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;

    if (!monthMap.has(key)) {
      monthMap.set(key, {
        key,
        label: monthFormatter.format(date),
        year,
        month,
        games: [],
      });
    }

    monthMap.get(key)?.games.push(game);
  });

  return Array.from(monthMap.values()).sort((a, b) => {
    if (a.key === "unknown") return 1;
    if (b.key === "unknown") return -1;
    return a.key.localeCompare(b.key);
  });
}

function sortGamesByDate(games: HockeyGame[]) {
  return [...games].sort((a, b) => {
    const aTime = Number.isFinite(a.timestamp)
      ? Number(a.timestamp)
      : a.date
        ? new Date(a.date).getTime()
        : 0;

    const bTime = Number.isFinite(b.timestamp)
      ? Number(b.timestamp)
      : b.date
        ? new Date(b.date).getTime()
        : 0;

    return aTime - bTime;
  });
}

export function useTeamGames(
  league: TeamScheduleLeague,
  teamId?: string | number | null,
): UseTeamGamesResult {
  const [data, setData] = useState<TeamScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSchedule = useCallback(
    async (isRefresh = false) => {
      if (!league || !teamId) {
        setData(null);
        setLoading(false);
        setRefreshing(false);
        setError(null);
        return;
      }

      try {
        setError(null);

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await apiClient.get<TeamScheduleResponse>(
          `api/games/hockey/team/${league}/${teamId}`,
        );

        const games = sortGamesByDate(response.data.games || []);

        const months =
          Array.isArray(response.data.months) && response.data.months.length > 0
            ? response.data.months
            : groupGamesByMonth(games);

        setData({
          ...response.data,
          team: response.data.team ?? null,
          games,
          months,
        });
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to fetch hockey team schedule";

        setError(new Error(message));

        if (!isRefresh) {
          setData(null);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [league, teamId],
  );

  useEffect(() => {
    fetchSchedule(false);
  }, [fetchSchedule]);

  const allGames = useMemo(() => data?.games ?? [], [data?.games]);
  const monthGroups = useMemo(() => data?.months ?? [], [data?.months]);
  const months = useMemo(
    () => buildScheduleMonthOptions(monthGroups),
    [monthGroups],
  );
  const scheduleIdentity = `${league}:${String(teamId ?? "")}:${String(
    data?.season?.year ?? "",
  )}`;
  const { selectedMonthKey, selectMonth } = useTeamMonthSelector({
    months,
    scheduleIdentity,
  });
  const games = useMemo(
    () => getScheduleGamesForMonth(monthGroups, selectedMonthKey),
    [monthGroups, selectedMonthKey],
  );
  const firstSeasonGame = useMemo(
    () => getFirstSeasonGame(allGames),
    [allGames],
  );
  const showCountdown = isScheduleOpeningMonth(
    firstSeasonGame,
    selectedMonthKey,
  );

  const refresh = useCallback(async () => {
    await fetchSchedule(true);
  }, [fetchSchedule]);

  return useMemo(
    () => ({
      games,
      months,
      selectedMonthKey,
      selectMonth,
      firstSeasonGame,
      showCountdown,
      loading,
      refreshing,
      error,
      refresh,
    }),
    [
      games,
      months,
      selectedMonthKey,
      selectMonth,
      firstSeasonGame,
      showCountdown,
      loading,
      refreshing,
      error,
      refresh,
    ],
  );
}
