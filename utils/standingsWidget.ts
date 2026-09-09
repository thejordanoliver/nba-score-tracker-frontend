import type {
  ConferenceStandings,
  StandingsTeam,
} from "hooks/LeagueHooks/useLeagueStandings";
import type { ExploreStandingsLeague } from "types/widgets";

export type StandingsPreviewRow = {
  conference: string;
  position: number;
  team: StandingsTeam;
};

export function buildStandingsPreviewRows(
  conferences: readonly ConferenceStandings[],
  limit: number,
): StandingsPreviewRow[] {
  const populatedConferences = conferences.filter(
    (conference) => conference.standings.length > 0,
  );
  const largestConferenceSize = Math.max(
    0,
    ...populatedConferences.map((conference) => conference.standings.length),
  );
  const rows: StandingsPreviewRow[] = [];
  const seenTeamIds = new Set<string>();

  for (
    let positionIndex = 0;
    positionIndex < largestConferenceSize && rows.length < limit;
    positionIndex += 1
  ) {
    for (const conference of populatedConferences) {
      const team = conference.standings[positionIndex];

      if (!team || seenTeamIds.has(team.id)) continue;

      seenTeamIds.add(team.id);
      rows.push({
        conference: conference.abbreviation || conference.name,
        position: positionIndex + 1,
        team,
      });

      if (rows.length >= limit) break;
    }
  }

  return rows;
}

export function formatStandingsRecord(
  team: StandingsTeam,
  league: ExploreStandingsLeague,
) {
  if (league === "nhl" && team.otLosses != null) {
    return `${team.wins}-${team.losses}-${team.otLosses}`;
  }

  if (team.ties > 0) {
    return `${team.wins}-${team.losses}-${team.ties}`;
  }

  return `${team.wins}-${team.losses}`;
}

export function formatStandingsMetric(
  team: StandingsTeam,
  league: ExploreStandingsLeague,
) {
  if (league === "nhl" && team.points != null) {
    return String(team.points);
  }

  if (!Number.isFinite(team.winPercent)) return "—";

  const decimal = team.winPercent > 1 ? team.winPercent / 100 : team.winPercent;
  return decimal.toFixed(3).replace(/^0/, "");
}
