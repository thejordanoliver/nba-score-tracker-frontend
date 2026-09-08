import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef } from "react";
import { subscribeSportsLive } from "services/liveSportsSocket";
import type {
  ExploreWidgetDataCache,
  ExploreWidgetGame,
} from "types/widgets";

type TeamLatestPayload = {
  game?: unknown;
};

type UseExploreWidgetLiveUpdatesOptions = {
  cache: ExploreWidgetDataCache | null;
  dataKey: string;
  relevantFavoriteKeySet: ReadonlySet<string>;
  setCache: Dispatch<SetStateAction<ExploreWidgetDataCache | null>>;
  userId: number | null;
};

function getFavoriteTeamId(key: string): string {
  return key.slice(key.indexOf(":") + 1);
}

function isLiveWidgetGame(game: ExploreWidgetGame["game"]): boolean {
  const state = String(game.status?.state ?? "").toLowerCase();
  const description = String(game.status?.description ?? "").toLowerCase();
  const detail = String(game.status?.detail ?? "").toLowerCase();
  const shortDetail = String(game.status?.shortDetail ?? "").toLowerCase();

  return (
    state === "in" ||
    state === "live" ||
    state === "half" ||
    description.includes("in progress") ||
    detail.includes("in progress") ||
    shortDetail.includes("in progress")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isWidgetGame(game: unknown): boolean {
  if (!isRecord(game)) return false;

  return (
    (typeof game.id === "string" || typeof game.id === "number") &&
    Boolean(game.status && typeof game.status === "object") &&
    Boolean(game.home && typeof game.home === "object") &&
    Boolean(game.away && typeof game.away === "object")
  );
}

function isBasketballWidgetGame(
  value: unknown,
): value is Extract<ExploreWidgetGame, { sport: "basketball" }>["game"] {
  return isWidgetGame(value);
}

function isBaseballWidgetGame(
  value: unknown,
): value is Extract<ExploreWidgetGame, { sport: "baseball" }>["game"] {
  return isWidgetGame(value);
}

function isFootballWidgetGame(
  value: unknown,
): value is Extract<ExploreWidgetGame, { sport: "football" }>["game"] {
  return isWidgetGame(value);
}

function isHockeyWidgetGame(
  value: unknown,
): value is Extract<ExploreWidgetGame, { sport: "hockey" }>["game"] {
  return isWidgetGame(value);
}

export function useExploreWidgetLiveUpdates({
  cache,
  dataKey,
  relevantFavoriteKeySet,
  setCache,
  userId,
}: UseExploreWidgetLiveUpdatesOptions) {
  const liveSubscriptionEntries = useMemo(() => {
    const entries = new Map<string, [string, ExploreWidgetGame]>();

    cache?.response.games.forEach((envelope) => {
      if (!isLiveWidgetGame(envelope.game)) return;

      const favoriteKey = envelope.favoriteTeamKeys.find((key) =>
        relevantFavoriteKeySet.has(key),
      );

      if (favoriteKey) {
        entries.set(envelope.key, [favoriteKey, envelope]);
      }
    });

    return Array.from(entries.values());
  }, [cache?.response.games, relevantFavoriteKeySet]);
  const liveSubscriptionKey = liveSubscriptionEntries
    .map(([favoriteKey, envelope]) => `${favoriteKey}:${envelope.key}`)
    .sort()
    .join("|");
  const liveSubscriptionEntriesRef = useRef(liveSubscriptionEntries);

  liveSubscriptionEntriesRef.current = liveSubscriptionEntries;

  useEffect(() => {
    if (!userId || !liveSubscriptionKey) return;

    const unsubscribe = liveSubscriptionEntriesRef.current.map(
      ([favoriteKey, envelope]) =>
        subscribeSportsLive<TeamLatestPayload>({
          kind: "scoreboard",
          payload: {
            sport: envelope.sport,
            league: envelope.league,
            feed: "teamLatest",
            teamId: getFavoriteTeamId(favoriteKey),
          },
          listener: ({ payload }) => {
            let updatedEnvelope: ExploreWidgetGame;

            switch (envelope.sport) {
              case "basketball":
                if (!isBasketballWidgetGame(payload.game)) return;
                updatedEnvelope = { ...envelope, game: payload.game };
                break;
              case "baseball":
                if (!isBaseballWidgetGame(payload.game)) return;
                updatedEnvelope = { ...envelope, game: payload.game };
                break;
              case "football":
                if (!isFootballWidgetGame(payload.game)) return;
                updatedEnvelope = { ...envelope, game: payload.game };
                break;
              case "hockey":
                if (!isHockeyWidgetGame(payload.game)) return;
                updatedEnvelope = { ...envelope, game: payload.game };
                break;
            }

            const updatedGame = updatedEnvelope.game;
            const updatedGameId = String(updatedGame.id);
            const updatedKey = `${envelope.sport}:${envelope.league}:${updatedGameId}`;

            setCache((current) => {
              if (!current || current.key !== dataKey) return current;

              let favoriteKeysForUpdatedGame = [favoriteKey];
              const gamesWithoutPreviousFavorite = current.response.games
                .map((gameEnvelope) => {
                  if (gameEnvelope.key === updatedKey) {
                    favoriteKeysForUpdatedGame = Array.from(
                      new Set([
                        ...favoriteKeysForUpdatedGame,
                        ...gameEnvelope.favoriteTeamKeys,
                      ]),
                    );
                    return null;
                  }

                  if (!gameEnvelope.favoriteTeamKeys.includes(favoriteKey)) {
                    return gameEnvelope;
                  }

                  const remainingKeys = gameEnvelope.favoriteTeamKeys.filter(
                    (key) => key !== favoriteKey,
                  );

                  return remainingKeys.length
                    ? { ...gameEnvelope, favoriteTeamKeys: remainingKeys }
                    : null;
                })
                .filter(
                  (gameEnvelope): gameEnvelope is ExploreWidgetGame =>
                    gameEnvelope !== null,
                );
              const nextEnvelope: ExploreWidgetGame = {
                ...updatedEnvelope,
                key: updatedKey,
                gameId: updatedGameId,
                favoriteTeamKeys: favoriteKeysForUpdatedGame,
              };

              return {
                ...current,
                response: {
                  ...current.response,
                  games: [nextEnvelope, ...gamesWithoutPreviousFavorite],
                },
              };
            });
          },
        }),
    );

    return () => {
      unsubscribe.forEach((unsubscribeFavorite) => unsubscribeFavorite());
    };
  }, [dataKey, liveSubscriptionKey, setCache, userId]);
}
