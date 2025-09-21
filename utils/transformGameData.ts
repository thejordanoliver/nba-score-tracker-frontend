import type { Game } from "types/types";

export type RawNBAGame = {
  isPlayoff: boolean;
  id: number;
  date: {
    stage: number;
    start: string;
  };
  status: {
    long: string;
    short: string;
    clock?: string;
    halftime?: boolean;
  };
  periods: {
    current: number;
    total: number;
    endOfPeriod?: boolean;
  };
  teams: {
    home: { id: number; name: string; logo: string; wins?: number; losses?: number };
    visitors: { id: number; name: string; logo: string; wins?: number; losses?: number };
  };
  scores: {
    home: {
      points: number | null;
      linescore?: string[];
    };
    visitors: {
      points: number | null;
      linescore?: string[];
    };
  };
  arena?: {
    name: string;
    city: string;
    state?: string;
    country?: string;
    capacity?: number;
  };
};

export type TeamRecordMap = Record<string, { wins: number; losses: number }>;

export function transformGameData(
  raw: RawNBAGame,
  recordsMap?: TeamRecordMap
): Game {
  const period = raw.periods?.current ?? undefined;
  const clock = raw.status?.clock;

  const isHalftime = raw.status?.halftime || raw.status?.long === "Halftime";

  let status: Game["status"];

  if (isHalftime) {
    status = "In Progress";
  } else {
    switch (raw.status?.long) {
      case "In Play":
        status = "In Progress";
        break;
      case "Finished":
      case "Final":
        status = "Final";
        break;
      case "Canceled":
      case "Cancelled":
        status = "Canceled";
        break;
      case "Postponed":
        status = "Postponed";
        break;
      case "Scheduled":
        status = "Scheduled";
        break;
      default:
        console.warn(`Unknown game status: ${raw.status?.long}`);
        status = "Scheduled";
    }
  }

  // Use recordsMap if available, otherwise fallback to raw team object
  const homeRecordObj =
    recordsMap?.[raw.teams.home.id.toString()] ??
    (raw.teams.home.wins !== undefined && raw.teams.home.losses !== undefined
      ? { wins: raw.teams.home.wins, losses: raw.teams.home.losses }
      : undefined);

  const awayRecordObj =
    recordsMap?.[raw.teams.visitors.id.toString()] ??
    (raw.teams.visitors.wins !== undefined && raw.teams.visitors.losses !== undefined
      ? { wins: raw.teams.visitors.wins, losses: raw.teams.visitors.losses }
      : undefined);

  const formatRecord = (record: { wins: number; losses: number } | undefined) =>
    record && record.wins !== undefined && record.losses !== undefined
      ? `${record.wins}-${record.losses}`
      : "-";

  const homeRecord = formatRecord(homeRecordObj);
  const awayRecord = formatRecord(awayRecordObj);

  return {
    id: raw.id,
    home: {
      id: raw.teams.home.id.toString(),
      name: raw.teams.home.name,
      fullName: raw.teams.home.name,
      logo: raw.teams.home.logo,
      record: homeRecord,
      wins: homeRecordObj?.wins,
      losses: homeRecordObj?.losses,
    },
    away: {
      id: raw.teams.visitors.id.toString(),
      name: raw.teams.visitors.name,
      fullName: raw.teams.visitors.name,
      logo: raw.teams.visitors.logo,
      record: awayRecord,
      wins: awayRecordObj?.wins,
      losses: awayRecordObj?.losses,
    },
    date: raw.date.start,
    time: new Date(raw.date.start).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
    status,
    clock: status === "In Progress" ? clock : undefined,
    period:
      status === "In Progress" && period !== undefined
        ? period.toString()
        : undefined,
    homeScore:
      status !== "Scheduled" && status !== "Canceled" && status !== "Postponed"
        ? raw.scores.home.points ?? 0
        : undefined,
    awayScore:
      status !== "Scheduled" && status !== "Canceled" && status !== "Postponed"
        ? raw.scores.visitors.points ?? 0
        : undefined,
    isHalftime,
    isPlayoff: raw.isPlayoff,
    stage: raw.date.stage,
    linescore:
      raw.scores.home.linescore && raw.scores.visitors.linescore
        ? {
            home: raw.scores.home.linescore,
            away: raw.scores.visitors.linescore,
          }
        : undefined,
    periods: raw.periods
      ? {
          current: raw.periods.current,
          total: raw.periods.total,
          endOfPeriod: raw.periods.endOfPeriod ?? false,
        }
      : undefined,
    arena: raw.arena
      ? {
          name: raw.arena.name,
          city: raw.arena.city,
          state: raw.arena.state,
          country: raw.arena.country,
          capacity: raw.arena.capacity,
        }
      : undefined,
  };
}
