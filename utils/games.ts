import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export type TeamLike = {
  id: string;
  name: string;
  record?: string;
  logo?: any;
  fullName: string;
};

export const hasIdAndName = (team: any): team is TeamLike =>
  team && typeof team.id === "string" && typeof team.name === "string";

export const normalizeTeam = (team: any): TeamLike => {
  if (hasIdAndName(team)) {
    return {
      id: team.id,
      name: team.name,
      record: team.record,
      logo: team.logo,
      fullName: team.fullName ?? team.name ?? "Unknown Team",
    };
  }
  const fallbackName = team?.name ?? "Unknown Team";
  return { id: fallbackName, name: fallbackName, fullName: fallbackName };
};

export const localDateOnly = (date: string | Date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export const filterByDate = (games: any[], date: Date) =>
  games.filter((game) =>
    dayjs(game.date).isSame(dayjs(date).startOf("day"), "day")
  );

// 🏈 Normalize NFL games with timezone fix
export const normalizeNFLGames = (games: any[]) => {
  return games.map((g) => {
    const ts = g.game.date?.timestamp;

    // Convert once to Eastern Time
    let eastern = ts
      ? dayjs.unix(ts).tz("America/New_York")
      : dayjs().tz("America/New_York");

    // Special case: if kickoff shows as 00:00–00:29 ET, shift back
    const hhmm = eastern.format("HH:mm");
    if (hhmm >= "00:00" && hhmm <= "00:29") {
      eastern = eastern.subtract(4, "hour");
    }

    return {
      ...g,
      home: {
        id: g.teams.home?.id ?? "unknown",
        name: g.teams.home?.nickname ?? "Unknown",
        fullName: g.teams.home?.name ?? "Unknown Team",
      },
      away: {
        id: g.teams.away?.id ?? "unknown",
        name: g.teams.away?.nickname ?? "Unknown",
        fullName: g.teams.away?.name ?? "Unknown Team",
      },
      date: eastern,
      status: g.game.status,
    };
  });
};
