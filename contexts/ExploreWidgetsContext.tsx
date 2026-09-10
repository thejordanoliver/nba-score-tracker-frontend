import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useExploreWidgetConfiguration } from "hooks/ExploreHooks/useExploreWidgetConfiguration";
import { useExploreWidgetLiveUpdates } from "hooks/ExploreHooks/useExploreWidgetLiveUpdates";
import { getExploreWidgets } from "services/exploreWidgetsApi";
import type { FavoriteTeamKey } from "types/favorites";
import {
  EXPLORE_WIDGET_LEAGUES,
  type ExploreCollegePollLeague,
  type ExploreCollegePollType,
  type ExploreWidgetConfig,
  type ExploreWidgetDataCache,
  type ExploreWidgetGame,
  type ExploreWidgetLeague,
  type ExploreWidgetSize,
  type ExploreStandingsLeague,
  type ExploreWidgetsResponse,
  type ExploreWidgetType,
} from "types/widgets";
import { useFavoriteTeamsContext } from "./FavoriteTeamsContext";

type ExploreWidgetsContextValue = {
  widgets: ExploreWidgetConfig[];
  widgetsReady: boolean;
  games: ExploreWidgetGame[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  addWidget: (
    type: ExploreWidgetType,
    title: string,
    size: ExploreWidgetSize,
  ) => void;
  removeWidget: (widgetId: string) => void;
  resizeWidget: (widgetId: string, size: ExploreWidgetSize) => void;
  setStandingsLeague: (
    widgetId: string,
    league: ExploreStandingsLeague,
  ) => void;
  setCollegePollSelection: (
    widgetId: string,
    league: ExploreCollegePollLeague,
    pollType: ExploreCollegePollType,
  ) => void;
  moveWidget: (widgetId: string, direction: -1 | 1) => void;
  reorderWidgets: (widgets: ExploreWidgetConfig[]) => void;
  ensureWidgetData: () => Promise<void>;
  refreshWidgetData: () => Promise<void>;
};

const WIDGET_DATA_STALE_TIME_MS = 5 * 60 * 1000;

const widgetLeagueByType: Partial<
  Record<ExploreWidgetType, ExploreWidgetLeague>
> = {
  nba_games: "nba",
  wnba_games: "wnba",
  cbb_games: "cbb",
  wcbb_games: "wcbb",
  mlb_games: "mlb",
  nfl_games: "nfl",
  cfb_games: "cfb",
  nhl_games: "nhl",
};

const ExploreWidgetsContext = createContext<ExploreWidgetsContextValue | null>(
  null,
);

function getRequestedLeagues(
  widgets: readonly ExploreWidgetConfig[],
): ExploreWidgetLeague[] {
  if (widgets.some((widget) => widget.type === "favorite_games")) {
    return [...EXPLORE_WIDGET_LEAGUES];
  }

  const requested = new Set(
    widgets.flatMap((widget) => {
      const league = widgetLeagueByType[widget.type];
      return league ? [league] : [];
    }),
  );

  return EXPLORE_WIDGET_LEAGUES.filter((league) => requested.has(league));
}

function getExploreFavoriteLeague(
  key: FavoriteTeamKey,
): ExploreWidgetLeague | null {
  const league = key.slice(0, key.indexOf(":"));

  return (
    EXPLORE_WIDGET_LEAGUES.find((candidate) => candidate === league) ?? null
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load widget games.";
}

export function ExploreWidgetsProvider({ children }: { children: ReactNode }) {
  const {
    favorites,
    isLoading: favoritesLoading,
    ready: favoritesReady,
    userId,
  } = useFavoriteTeamsContext();
  const {
    widgets,
    ready: widgetsReady,
    addWidget,
    removeWidget,
    resizeWidget,
    setStandingsLeague,
    setCollegePollSelection,
    moveWidget,
    reorderWidgets,
  } = useExploreWidgetConfiguration(userId);
  const [cache, setCache] = useState<ExploreWidgetDataCache | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestGenerationRef = useRef(0);
  const pendingRequestRef = useRef<{
    key: string;
    promise: Promise<void>;
    controller: AbortController;
  } | null>(null);
  const currentIdentityRef = useRef("");

  const requestedLeaguesKey = getRequestedLeagues(widgets).join(",");
  const requestedLeagues = useMemo(
    () =>
      EXPLORE_WIDGET_LEAGUES.filter((league) =>
        requestedLeaguesKey.split(",").includes(league),
      ),
    [requestedLeaguesKey],
  );
  const relevantFavoriteKeys = useMemo(
    () =>
      favorites.filter((favorite) => {
        const league = getExploreFavoriteLeague(favorite);
        return league !== null && requestedLeagues.includes(league);
      }),
    [favorites, requestedLeagues],
  );
  const favoritesKey = relevantFavoriteKeys.slice().sort().join(",");
  const relevantFavoriteKeySet = useMemo(
    () => new Set<string>(relevantFavoriteKeys),
    [relevantFavoriteKeys],
  );
  const dataKey = userId
    ? `widgets:${userId}:${requestedLeaguesKey}:${favoritesKey}`
    : "widgets:signed-out";

  currentIdentityRef.current = dataKey;

  useEffect(() => {
    setCache(null);
    setLoading(false);
    setRefreshing(false);
    setError(null);
    requestGenerationRef.current += 1;
    pendingRequestRef.current?.controller.abort();
    pendingRequestRef.current = null;
  }, [userId]);

  const loadWidgetData = useCallback(
    async (forceRefresh: boolean) => {
      if (
        !widgetsReady ||
        !favoritesReady ||
        favoritesLoading ||
        !userId ||
        requestedLeagues.length === 0
      ) {
        return;
      }

      if (relevantFavoriteKeys.length === 0) {
        const emptyResponse: ExploreWidgetsResponse = {
          version: 1,
          generatedAt: new Date().toISOString(),
          requestedLeagues,
          favoriteTeamKeys: [],
          games: [],
          failures: [],
        };

        setCache({
          key: dataKey,
          userId,
          fetchedAt: Date.now(),
          response: emptyResponse,
        });
        setLoading(false);
        setRefreshing(false);
        setError(null);
        return;
      }

      const hasCurrentCache = cache?.key === dataKey;
      const cacheAge = hasCurrentCache
        ? Date.now() - cache.fetchedAt
        : Number.POSITIVE_INFINITY;

      if (
        !forceRefresh &&
        hasCurrentCache &&
        cacheAge < WIDGET_DATA_STALE_TIME_MS
      ) {
        return;
      }

      const pending = pendingRequestRef.current;
      if (pending?.key === dataKey) return pending.promise;

      const requestGeneration = ++requestGenerationRef.current;
      const requestIdentity = dataKey;
      const controller = new AbortController();

      if (hasCurrentCache || cache?.response.games.length) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const promise = getExploreWidgets({
        forceRefresh,
        leagues: requestedLeagues,
        signal: controller.signal,
      })
        .then((response) => {
          if (
            requestGeneration !== requestGenerationRef.current ||
            requestIdentity !== currentIdentityRef.current
          ) {
            return;
          }

          setCache({
            key: requestIdentity,
            userId,
            fetchedAt: Date.now(),
            response,
          });
          setError(
            response.failures.length > 0
              ? "Some favorite-team games could not be refreshed."
              : null,
          );
        })
        .catch((requestError: unknown) => {
          if (
            requestGeneration !== requestGenerationRef.current ||
            requestIdentity !== currentIdentityRef.current
          ) {
            return;
          }

          setError(getErrorMessage(requestError));
        })
        .finally(() => {
          if (pendingRequestRef.current?.promise === promise) {
            pendingRequestRef.current = null;
          }

          if (
            requestGeneration === requestGenerationRef.current &&
            requestIdentity === currentIdentityRef.current
          ) {
            setLoading(false);
            setRefreshing(false);
          }
        });

      if (pendingRequestRef.current?.key !== requestIdentity) {
        pendingRequestRef.current?.controller.abort();
      }

      pendingRequestRef.current = {
        key: requestIdentity,
        promise,
        controller,
      };
      return promise;
    },
    [
      cache,
      dataKey,
      favoritesLoading,
      favoritesReady,
      relevantFavoriteKeys.length,
      requestedLeagues,
      userId,
      widgetsReady,
    ],
  );

  const ensureWidgetData = useCallback(
    () => loadWidgetData(false),
    [loadWidgetData],
  );
  const refreshWidgetData = useCallback(
    () => loadWidgetData(true),
    [loadWidgetData],
  );

  useEffect(
    () => () => {
      requestGenerationRef.current += 1;
      pendingRequestRef.current?.controller.abort();
      pendingRequestRef.current = null;
    },
    [],
  );

  useExploreWidgetLiveUpdates({
    cache,
    dataKey,
    relevantFavoriteKeySet,
    setCache,
    userId,
  });

  const games = useMemo(() => {
    if (!cache || cache.userId !== userId) return [];

    return cache.response.games.filter(
      (game) =>
        requestedLeagues.includes(game.league) &&
        game.favoriteTeamKeys.some((favoriteKey) =>
          relevantFavoriteKeySet.has(favoriteKey),
        ),
    );
  }, [cache, relevantFavoriteKeySet, requestedLeagues, userId]);

  const value = useMemo<ExploreWidgetsContextValue>(
    () => ({
      widgets,
      widgetsReady,
      games,
      loading,
      refreshing,
      error,
      addWidget,
      removeWidget,
      resizeWidget,
      setStandingsLeague,
      setCollegePollSelection,
      moveWidget,
      reorderWidgets,
      ensureWidgetData,
      refreshWidgetData,
    }),
    [
      addWidget,
      ensureWidgetData,
      error,
      games,
      loading,
      moveWidget,
      refreshWidgetData,
      refreshing,
      removeWidget,
      reorderWidgets,
      resizeWidget,
      setCollegePollSelection,
      setStandingsLeague,
      widgets,
      widgetsReady,
    ],
  );

  return (
    <ExploreWidgetsContext.Provider value={value}>
      {children}
    </ExploreWidgetsContext.Provider>
  );
}

export function useExploreWidgetsContext() {
  const context = useContext(ExploreWidgetsContext);

  if (!context) {
    throw new Error(
      "useExploreWidgetsContext must be used within ExploreWidgetsProvider",
    );
  }

  return context;
}
