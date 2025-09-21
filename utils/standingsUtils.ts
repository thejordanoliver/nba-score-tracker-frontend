import { TeamStanding } from "types/standingsTypes";
import NBALOGO from "assets/Logos/NBA.png";
import { ImageSourcePropType } from "react-native";

export function getImageSource(
  logo: ImageSourcePropType | string | null | undefined
): ImageSourcePropType {
  if (!logo) {
    return NBALOGO;
  }
  if (typeof logo === "string") {
    return { uri: logo };
  }
  return logo;
}

export function getTotalWins(item: TeamStanding): number {
  if (item.conference.win === 0 && item.conference.loss === 0) {
    return item.win.home + item.win.away;
  }
  return item.conference.win;
}

export function groupByDivision(
  teams: (TeamStanding & { conferenceRank?: number })[]
): Record<string, (TeamStanding & { conferenceRank?: number })[]> {
  const divisions: Record<
    string,
    (TeamStanding & { conferenceRank?: number })[]
  > = {};
  teams.forEach((team) => {
    const divName = team.division.name;
    if (!divisions[divName]) {
      divisions[divName] = [];
    }
    divisions[divName].push(team);
  });

  for (const div in divisions) {
    divisions[div].sort((a, b) => getTotalWins(b) - getTotalWins(a));
  }

  return divisions;
}

export function getPlayoffStatusCode(rank: number | undefined) {
  if (!rank) return null;
  if (rank >= 1 && rank <= 6) return "x"; // Clinched Playoff Berth
  if (rank >= 7 && rank <= 10) return "pi"; // Clinched Play-In
  return "o"; // Eliminated
}
