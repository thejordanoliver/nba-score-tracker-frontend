import { BROWSEABLE_LEAGUES } from "constants/leagueIds";
import type { ForumPostDestination } from "types/forum";
import type { LeagueType } from "types/types";

type RouteParam = string | string[] | undefined;

const selectableLeagueSet = new Set<string>(BROWSEABLE_LEAGUES);

const firstRouteParam = (value: RouteParam) =>
  Array.isArray(value) ? value[0] : value;

export function normalizeForumPostLeague(
  value: RouteParam,
): LeagueType | null {
  const normalized = firstRouteParam(value)?.trim().toLowerCase();

  return normalized && selectableLeagueSet.has(normalized)
    ? (normalized as LeagueType)
    : null;
}

export function parseForumPostDestinationParams({
  league,
  teamId,
}: {
  league?: RouteParam;
  teamId?: RouteParam;
}): ForumPostDestination | null {
  const normalizedLeague = normalizeForumPostLeague(league);

  if (!normalizedLeague) return null;

  const normalizedTeamId = firstRouteParam(teamId)?.trim();

  if (!normalizedTeamId) {
    return { kind: "league", league: normalizedLeague };
  }

  if (/^[1-9]\d*$/.test(normalizedTeamId)) {
    return {
      kind: "team",
      league: normalizedLeague,
      teamId: normalizedTeamId,
    };
  }

  return null;
}

export function getForumPostCreateEndpoint(
  destination: ForumPostDestination,
) {
  return destination.kind === "team"
    ? `/api/forum/team/${encodeURIComponent(destination.teamId)}`
    : `/api/forum/league/${encodeURIComponent(destination.league)}`;
}
