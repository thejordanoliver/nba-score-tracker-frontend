// utils/games.ts

import { Colors } from "@/constants/styles";
import type { LeagueType } from "@/types/types";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.extend(timezone);

export const normalizeGames = <Game extends object, League extends LeagueType>(
  games: readonly Game[],
  leagueId: League,
): (Game & { leagueId: League })[] =>
  games.map((game) => ({ ...game, leagueId }));

export function isGameLive(
  game: { status?: { state?: unknown } | null } | null | undefined,
) {
  const status = String(game?.status?.state).toLowerCase();

  if (status === "in") return true;
  if (status === "post") return false;
  if (status === "pre") return false;

  return false;
}

type FormatPeriodArgs = {
  period?: number | string | null;
  isCBB?: boolean;
  isNHL?: boolean;
  isMMA?: boolean;
  isSOCC?: boolean;
  statusText?: string | null;
};

export const formatPeriod = ({
  period,
  isCBB = false,
  isNHL = false,
  isMMA = false,
  isSOCC = false,
  statusText,
}: FormatPeriodArgs = {}) => {
  const hasPeriod = period !== null && period !== undefined && period !== "";

  if (!hasPeriod && !statusText) return "";

  if (typeof period === "string") {
    const val = period.trim().toLowerCase();

    if (val.includes("ot")) return val.toUpperCase();
    if (val.includes("halftime")) return "Halftime";
    if (val.includes("half time")) return "Halftime";
    if (val.includes("final")) return "Final";

    const numericPeriod = Number(period);

    if (!Number.isFinite(numericPeriod)) {
      return statusText || period;
    }
  }

  const p = Number(period);

  if (!Number.isFinite(p)) {
    return statusText || "";
  }

  // College basketball: 2 halves
  if (isCBB) {
    if (p === 1) return "1st";
    if (p === 2) return "2nd";

    const ot = p - 2;
    return ot === 1 ? "OT" : `${ot}OT`;
  }

  // Hockey: 3 periods
  if (isNHL) {
    if (p === 1) return "1st";
    if (p === 2) return "2nd";
    if (p === 3) return "3rd";

    const ot = p - 3;
    return ot === 1 ? "OT" : `${ot}OT`;
  }

  // MMA: rounds
  if (isMMA) {
    if (p === 1) return "1st";
    if (p === 2) return "2nd";
    if (p === 3) return "3rd";
    if (p === 4) return "4th";
    if (p === 5) return "5th";

    return `R${p}`;
  }

  // Soccer: halves / extra time / penalties
  if (isSOCC) {
    if (p === 1) return "1st";
    if (p === 2) return "2nd";
    if (p === 3) return "ET";
    if (p === 4) return "ET";
    if (p === 5) return "Pens";

    return statusText || "";
  }
  
  // Default: football / basketball quarters
  if (p === 1) return "1st";
  if (p === 2) return "2nd";
  if (p === 3) return "3rd";
  if (p === 4) return "4th";

  const ot = p - 4;
  return ot === 1 ? "OT" : `${ot}OT`;
};

export const formatRound = (round?: number | string) => {
  if (!round) return "";

  const r = Number(round);
  if (isNaN(r)) return "";

  const rounds = ["1st", "2nd", "3rd", "4th", "5th"];

  return rounds[r - 1] ?? "";
};

export const normalizeVenueName = (name?: string | null) =>
  name
    ?.toLowerCase()
    .replace(/stadium|field|arena|center|centre/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim() ?? "";

export const formatVenueAddress = (address?: {
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}) => {
  if (!address) return undefined;

  return [address.city, address.state, address.zipCode, address.country]
    .filter(Boolean)
    .join(" ");
};

export function getBroadcastDisplay(broadcasts?: string[]) {
  if (!broadcasts?.length) return "";

  const allNames = broadcasts.map((n) => n.toLowerCase()).filter(Boolean);

  const networkMap: [string, string][] = [
    ["espn2", "ESPN2"],
    ["espn3", "ESPN3"],
    ["espn+", "ESPN+"],
    ["espnu", "ESPNU"],
    ["sec network", "SECN"],
    ["secn+", "SECN+"],
    ["acc network", "ACCN"],
    ["abc", "ABC"],
    ["tnt", "TNT"],
    ["btn", "BTN"],
    ["tbs", "TBS"],
    ["fox sports", "FS1"],
    ["fs1", "FS1"],
    ["fox", "FOX"],
    ["cbs", "CBS"],
    ["peacock", "Peacock"],
    ["nbc", "NBC"],
    ["netflix", "Netflix"],
    ["prime video", "Prime"],
    ["amazon", "Prime"],
    ["nba league pass", "NBA League Pass"],
    ["nba tv", "NBA TV"],
    ["hbo max", "MAX"],
    ["max", "MAX"],
    ["espn", "ESPN"],
  ];

  // special combos
  if (
    allNames.some((n) => n.includes("abc")) &&
    allNames.some((n) => n.includes("espn"))
  )
    return "ABC/ESPN";
  if (
    allNames.some((n) => n.includes("nbc")) &&
    allNames.some((n) => n.includes("peacock"))
  )
    return "NBC/Peacock";
  if (
    allNames.some((n) => n.includes("tnt")) &&
    allNames.some((n) => n.includes("max"))
  )
    return "TNT/MAX";

  for (const [key, value] of networkMap) {
    if (allNames.some((n) => n.includes(key))) {
      return value;
    }
  }

  // fallback
  const first = broadcasts[0];
  return first ? first.replace(/\b\w/g, (c) => c.toUpperCase()) : "";
}

export const winnerStyle = ({
  isWinner,
  isDark,
  isTie,
}: {
  isWinner: boolean;
  isTie?: boolean;
  isDark: boolean;
}) => ({
  color: isDark ? Colors.white : Colors.black,
  opacity: isTie ? 1 : isWinner ? 1 : 0.5,
});
