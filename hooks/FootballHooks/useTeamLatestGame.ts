import { FootballGame } from "@/types/football/football";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "utils/apiClient";

export type FootballLeague = "nfl" | "cfb";

export interface LastFootballTeamGameResponse {
  success: boolean;
  league: string;
  count: number;
  game: FootballGame | null;
  games?: FootballGame[];
}

type LatestGameState = {
  key: string | null;
  game: FootballGame | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
};

export function useTeamLatestGame(
  league: FootballLeague,
  teamId: number | string | null | undefined,
) {
  const requestKey = useMemo(
    () => (teamId ? `${league}:${teamId}` : null),
    [league, teamId],
  );

  const [state, setState] = useState<LatestGameState>(() => ({
    key: requestKey,
    game: null,
    loading: Boolean(requestKey),
    refreshing: false,
    error: requestKey ? null : "Missing team id",
  }));

  const requestLastGame = useCallback(async () => {
    if (!teamId || !requestKey) {
      return null;
    }

    const { data } = await apiClient.get<LastFootballTeamGameResponse>(
      `api/games/football/last/team/${league}/${teamId}`,
    );

    if (!data.success) {
      throw new Error("Failed to load last game");
    }

    return data.game ?? data.games?.[0] ?? null;
  }, [league, requestKey, teamId]);

  useEffect(() => {
    if (!requestKey) {
      return;
    }

    let isCancelled = false;

    const loadLastGame = async () => {
      try {
        const resolvedGame = await requestLastGame();

        if (isCancelled) {
          return;
        }

        setState({
          key: requestKey,
          game: resolvedGame,
          loading: false,
          refreshing: false,
          error: null,
        });
      } catch (err) {
        if (isCancelled) {
          return;
        }

        console.error("LAST FOOTBALL TEAM GAME ERROR:", err);

        setState({
          key: requestKey,
          game: null,
          loading: false,
          refreshing: false,
          error:
            err instanceof Error ? err.message : "Failed to load last game",
        });
      }
    };

    void loadLastGame();

    return () => {
      isCancelled = true;
    };
  }, [requestKey, requestLastGame]);

  const refresh = useCallback(() => {
    if (!requestKey) {
      return;
    }

    setState((currentState) => ({
      key: requestKey,
      game: currentState.key === requestKey ? currentState.game : null,
      loading: false,
      refreshing: true,
      error: null,
    }));

    void requestLastGame()
      .then((resolvedGame) => {
        setState({
          key: requestKey,
          game: resolvedGame,
          loading: false,
          refreshing: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        console.error("LAST FOOTBALL TEAM GAME ERROR:", err);

        setState((currentState) => ({
          key: requestKey,
          game: currentState.key === requestKey ? currentState.game : null,
          loading: false,
          refreshing: false,
          error:
            err instanceof Error ? err.message : "Failed to load last game",
        }));
      });
  }, [requestKey, requestLastGame]);

  const isCurrentRequest = state.key === requestKey;

  return {
    game: requestKey && isCurrentRequest ? state.game : null,

    loading: requestKey !== null ? !isCurrentRequest || state.loading : false,

    refreshing:
      requestKey !== null && isCurrentRequest ? state.refreshing : false,

    error:
      requestKey === null
        ? "Missing team id"
        : isCurrentRequest
          ? state.error
          : null,

    refresh,
  };
}

export default useTeamLatestGame;
