import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLiveSportsSubscription } from "hooks/useLiveSportsSubscription";
import type {
  TennisDivision,
  TennisLeague,
  TennisMatch,
  TennisScoreboardResponse,
  TennisTournament,
} from "types/tennis/tennis";
import { apiClient } from "utils/apiClient";

type FetchOptions = {
  silent?: boolean;
};

const EMPTY_RESPONSE: Pick<
  TennisScoreboardResponse,
  "matches" | "tournaments" | "availableDivisions"
> = {
  matches: [],
  tournaments: [],
  availableDivisions: [],
};

function isCanceledRequest(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const value = error as { name?: string; code?: string };
  return value.name === "CanceledError" || value.code === "ERR_CANCELED";
}

export function useTennisMatches(
  date?: Date,
  league: TennisLeague = "atp",
) {
  const [matches, setMatches] = useState<TennisMatch[]>([]);
  const [tournaments, setTournaments] = useState<TennisTournament[]>([]);
  const [availableDivisions, setAvailableDivisions] = useState<
    TennisDivision[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formattedDate = useMemo(
    () => dayjs(date ?? new Date()).format("YYYYMMDD"),
    [date],
  );

  const applyResponse = useCallback(
    (response?: Partial<TennisScoreboardResponse> | null) => {
      setMatches(Array.isArray(response?.matches) ? response.matches : []);
      setTournaments(
        Array.isArray(response?.tournaments) ? response.tournaments : [],
      );
      setAvailableDivisions(
        Array.isArray(response?.availableDivisions)
          ? response.availableDivisions
          : [],
      );
    },
    [],
  );

  const fetchMatches = useCallback(
    async ({ silent = false }: FetchOptions = {}) => {
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      if (!silent) setLoading(true);
      setError(null);

      try {
        const { data } = await apiClient.get<TennisScoreboardResponse>(
          `/api/games/tennis/${league}`,
          {
            params: { date: formattedDate },
            signal: abortController.signal,
          },
        );

        applyResponse(data);
      } catch (caughtError: unknown) {
        if (isCanceledRequest(caughtError)) return;

        setError(
          caughtError instanceof Error
            ? caughtError
            : new Error(`Failed to fetch ${league.toUpperCase()} matches`),
        );
        applyResponse(EMPTY_RESPONSE);
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
          if (!silent) setLoading(false);
        }
      }
    },
    [applyResponse, formattedDate, league],
  );

  useEffect(() => {
    void fetchMatches();

    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, [fetchMatches]);

  const refreshMatches = useCallback(async () => {
    setRefreshing(true);

    try {
      await fetchMatches({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [fetchMatches]);

  const hasLiveMatch = useMemo(
    () => matches.some((match) => match.status.state === "in"),
    [matches],
  );

  useLiveSportsSubscription<TennisScoreboardResponse>({
    enabled: hasLiveMatch,
    kind: "scoreboard",
    payload: {
      sport: "tennis",
      league,
      date: formattedDate,
    },
    onUpdate: applyResponse,
  });

  return {
    matches,
    tournaments,
    availableDivisions,
    loading,
    refreshing,
    error,
    refreshMatches,
  };
}
