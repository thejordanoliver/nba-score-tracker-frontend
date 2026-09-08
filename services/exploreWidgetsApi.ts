import type {
  ExploreWidgetLeague,
  ExploreWidgetsResponse,
} from "types/widgets";
import { apiClient } from "utils/apiClient";

type GetExploreWidgetsOptions = {
  forceRefresh?: boolean;
  leagues: readonly ExploreWidgetLeague[];
  signal?: AbortSignal;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isExploreWidgetsResponse(
  value: unknown,
): value is ExploreWidgetsResponse {
  if (!isRecord(value)) return false;

  return (
    value.version === 1 &&
    typeof value.generatedAt === "string" &&
    Array.isArray(value.requestedLeagues) &&
    Array.isArray(value.favoriteTeamKeys) &&
    Array.isArray(value.failures) &&
    Array.isArray(value.games) &&
    value.games.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.key === "string" &&
        typeof entry.gameId === "string" &&
        typeof entry.sport === "string" &&
        typeof entry.league === "string" &&
        Array.isArray(entry.favoriteTeamKeys) &&
        isRecord(entry.game) &&
        (typeof entry.game.id === "string" ||
          typeof entry.game.id === "number") &&
        isRecord(entry.game.status) &&
        isRecord(entry.game.home) &&
        isRecord(entry.game.away),
    )
  );
}

export async function getExploreWidgets({
  forceRefresh = false,
  leagues,
  signal,
}: GetExploreWidgetsOptions): Promise<ExploreWidgetsResponse> {
  const response = await apiClient.get<unknown>("/api/widgets/explore", {
    params: {
      leagues: leagues.join(","),
      refresh: forceRefresh ? 1 : undefined,
    },
    signal,
  });

  if (!isExploreWidgetsResponse(response.data)) {
    throw new Error("The widget service returned an invalid response.");
  }

  return response.data;
}
