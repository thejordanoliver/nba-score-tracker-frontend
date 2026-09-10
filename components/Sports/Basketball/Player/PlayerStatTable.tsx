import PillTabs from "@/components/TabBars/PillTabs";
import { getTeamByESPNId } from "@/constants/teams";
import { getCBBTeamByESPNId } from "@/constants/teamsCBB";
import { getWNBATeamByESPNId } from "@/constants/teamsWNBA";
import Dropdown from "components/Dropdown";
import HeadingTwo from "components/Headings/HeadingTwo";
import PlayerStatTableSkeleton from "components/Skeletons/PlayerStatsTableSkeleton";
import { globalStyles } from "constants/styles";
import { getWCBBTeamByESPNId } from "constants/teamsWCBB";
import { usePreferences } from "contexts/PreferencesContext";
import { Season, StatValue } from "hooks/NBAHooks/usePlayerSeasons";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { statsTableStyles } from "styles/PlayerStyles/StatsTableStyles";
import { BasketballLeague } from "./PlayerHeader";

interface Props {
  seasons: Season[];
  loading: boolean;
  error: string | null;
  league: BasketballLeague;
}

type StatView = "totals" | "pergame" | "per36";
type SeasonType = "regularseason" | "postseason";

type SimpleStatKey = "pts" | "trb" | "ast" | "stl" | "blk" | "tov" | "pf";
type MadeAttemptedKey = "fg" | "three_p" | "ft";

type MadeAttemptedValue = {
  display: string | null;
  made: number | null;
  attempted: number | null;
};

type BoxScoreStats = Record<SimpleStatKey, number | null> &
  Record<MadeAttemptedKey, MadeAttemptedValue>;

type CareerTotals = Record<SimpleStatKey, number> & {
  g: number;
  mp: number;
  fg: {
    made: number;
    attempted: number;
  };
  three_p: {
    made: number;
    attempted: number;
  };
  ft: {
    made: number;
    attempted: number;
  };
};

type NormalizedSeasonRow = {
  rowKey: string;
  seasonNumber: number;
  seasonSortValue: number;
  displaySeason: string;
  team: string;
  seasonType: SeasonType;
  g: number | null;
  gs: number | null;
  mp: number | null;
  fg_pct: StatValue;
  three_pct: StatValue;
  ft_pct: StatValue;
  totals: BoxScoreStats;
  averages: BoxScoreStats & {
    mp: number | null;
  };
};

type StatCell = {
  key: string;
  value: string;
};

const EMPTY_STAT = "-";

const STAT_OPTIONS = [
  { label: "Totals", value: "totals" },
  { label: "Per Game", value: "pergame" },
  { label: "Per 36 Minutes", value: "per36" },
];

const SEASON_TYPE_OPTIONS: { label: string; value: SeasonType }[] = [
  { label: "Regular Season", value: "regularseason" },
  { label: "Postseason", value: "postseason" },
];

const PRO_LEAGUES_WITH_POSTSEASON_TABS = new Set<BasketballLeague>([
  "nba",
  "wnba",
]);

const TABLE_HEADERS = [
  "GP",
  "MIN",
  "PTS",
  "FGM-FGA",
  "FG%",
  "3PM-3PA",
  "3P%",
  "FTM-FTA",
  "FT%",
  "REB",
  "AST",
  "STL",
  "BLK",
  "TO",
  "PF",
];

const NBA_STAT_GLOSSARY = [
  { abbr: "GP", label: "Games Played" },
  { abbr: "MIN", label: "Minutes Played" },
  { abbr: "PTS", label: "Points" },
  { abbr: "FGM-FGA", label: "Field Goals Made-Attempted" },
  { abbr: "FG%", label: "Field Goal Percentage" },
  { abbr: "3PM-3PA", label: "3-Point Field Goals Made-Attempted" },
  { abbr: "3P%", label: "3-Point Percentage" },
  { abbr: "FTM-FTA", label: "Free Throws Made-Attempted" },
  { abbr: "FT%", label: "Free Throw Percentage" },
  { abbr: "REB", label: "Total Rebounds" },
  { abbr: "AST", label: "Assists" },
  { abbr: "STL", label: "Steals" },
  { abbr: "BLK", label: "Blocks" },
  { abbr: "TO", label: "Turnovers" },
  { abbr: "PF", label: "Personal Fouls" },
];

const SIMPLE_STAT_KEYS: SimpleStatKey[] = [
  "pts",
  "trb",
  "ast",
  "stl",
  "blk",
  "tov",
  "pf",
];

const MADE_ATTEMPTED_KEYS: MadeAttemptedKey[] = ["fg", "three_p", "ft"];

const COMBINED_TEAM_CODES = new Set(["TOT", "2TM", "3TM", "4TM", "5TM"]);

const createEmptyCareerTotals = (): CareerTotals => ({
  g: 0,
  mp: 0,
  pts: 0,
  fg: {
    made: 0,
    attempted: 0,
  },
  three_p: {
    made: 0,
    attempted: 0,
  },
  ft: {
    made: 0,
    attempted: 0,
  },
  trb: 0,
  ast: 0,
  stl: 0,
  blk: 0,
  tov: 0,
  pf: 0,
});

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];

  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }

  return out;
};

const isMissing = (value: StatValue) => {
  return value === null || value === undefined || value === "";
};

const toNumberOrNull = (value: StatValue) => {
  if (isMissing(value)) return null;

  const num = Number(String(value).replace("%", ""));
  return Number.isFinite(num) ? num : null;
};

const firstNumber = (...values: StatValue[]) => {
  for (const value of values) {
    const parsed = toNumberOrNull(value);

    if (parsed !== null) return parsed;
  }

  return null;
};

const getSeasonNumber = (value: StatValue) => {
  const parsed = toNumberOrNull(value);

  if (parsed !== null) return parsed;

  const match = String(value ?? "").match(/\d{4}/);
  return match ? Number(match[0]) : 0;
};

const formatNumber = (value: StatValue) => {
  const parsed = toNumberOrNull(value);

  if (parsed === null) return EMPTY_STAT;

  return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(1);
};

const formatOneDecimal = (value: StatValue) => {
  const parsed = toNumberOrNull(value);

  if (parsed === null) return EMPTY_STAT;

  return parsed.toFixed(1);
};

const formatPercent = (value: StatValue) => {
  const num = toNumberOrNull(value);

  if (num === null) return EMPTY_STAT;

  const percent = Math.abs(num) <= 1 ? num * 100 : num;
  return `${percent.toFixed(1)}%`;
};

const parseMadeAttempted = (value: StatValue): MadeAttemptedValue => {
  if (isMissing(value)) {
    return {
      display: null,
      made: null,
      attempted: null,
    };
  }

  const display = String(value).trim();
  const parts = display.split(/[-/]/);

  if (parts.length >= 2) {
    return {
      display,
      made: toNumberOrNull(parts[0]),
      attempted: toNumberOrNull(parts[1]),
    };
  }

  return {
    display,
    made: toNumberOrNull(value),
    attempted: null,
  };
};

const formatMadeAttempted = (value: MadeAttemptedValue) => {
  if (!isMissing(value.display)) return String(value.display);

  if (value.made !== null && value.attempted !== null) {
    return `${formatNumber(value.made)}-${formatNumber(value.attempted)}`;
  }

  return EMPTY_STAT;
};

const formatMadeAttemptedFromNumbers = (
  made: number | null | undefined,
  attempted: number | null | undefined,
) => {
  if (made === null || made === undefined) return EMPTY_STAT;
  if (attempted === null || attempted === undefined) return EMPTY_STAT;

  return `${made.toFixed(1)}-${attempted.toFixed(1)}`;
};

const ratio = (made: StatValue, attempted: StatValue) => {
  const madeValue = toNumberOrNull(made);
  const attemptedValue = toNumberOrNull(attempted);

  if (madeValue === null || attemptedValue === null || attemptedValue <= 0) {
    return null;
  }

  return madeValue / attemptedValue;
};

const per36 = (total: StatValue, minutes: StatValue) => {
  const totalValue = toNumberOrNull(total);
  const minuteValue = toNumberOrNull(minutes);

  if (totalValue === null || minuteValue === null || minuteValue <= 0) {
    return null;
  }

  return (totalValue / minuteValue) * 36;
};

const getSeasonType = (season: Season): SeasonType => {
  const seasonTypeValue = String(season.season_type_value ?? "").trim();

  if (seasonTypeValue === "3") return "postseason";
  if (seasonTypeValue === "2") return "regularseason";

  const seasonTypeLabel = String(season.season_type_label ?? "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  if (
    seasonTypeLabel.includes("postseason") ||
    seasonTypeLabel.includes("playoff")
  ) {
    return "postseason";
  }

  if (
    seasonTypeLabel.includes("regularseason") ||
    seasonTypeLabel.includes("regular")
  ) {
    return "regularseason";
  }

  const seasonType = String(season.season_type ?? "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  if (seasonType.includes("postseason") || seasonType.includes("playoff")) {
    return "postseason";
  }

  return "regularseason";
};

const sortRows = (rows: NormalizedSeasonRow[]) => {
  return [...rows].sort((a, b) => {
    if (b.seasonNumber !== a.seasonNumber) {
      return b.seasonNumber - a.seasonNumber;
    }

    return a.seasonSortValue - b.seasonSortValue;
  });
};

const getDisplaySeason = (season: Season) => {
  if (!isMissing(season.display_season)) return String(season.display_season);
  if (!isMissing(season.season)) return String(season.season);
  return EMPTY_STAT;
};

const getRowDisplaySeason = (
  row: NormalizedSeasonRow,
  showSeasonTypeTabs: boolean,
) => {
  if (!showSeasonTypeTabs && row.seasonType === "postseason") {
    return `${row.displaySeason} POST`;
  }

  return row.displaySeason;
};

const getTeamCodeFromSeason = (season: Season, league: BasketballLeague) => {
  const teamId = Number(season.team_id);

  const fallbackTeamCode = !isMissing(season.team_slug)
    ? String(season.team_slug).toUpperCase()
    : "";

  if (!Number.isFinite(teamId)) return fallbackTeamCode;

  const team =
    league === "nba"
      ? getTeamByESPNId(teamId)
      : league === "wnba"
        ? getWNBATeamByESPNId(teamId)
        : league === "wcbb"
          ? getWCBBTeamByESPNId(teamId)
          : getCBBTeamByESPNId(teamId);

  return team?.code ?? fallbackTeamCode;
};

const getSeasonRowSortValue = (season: Season, index: number) => {
  const rawId = toNumberOrNull(season.id);

  if (rawId !== null) return rawId;

  return index;
};

const normalizeStatsRow = (
  season: Season,
  index: number,
  league: BasketballLeague,
): NormalizedSeasonRow => {
  const totals = season.totals ?? {};
  const averages = season.averages ?? {};

  const fg = parseMadeAttempted(totals["fieldGoalsMade-fieldGoalsAttempted"]);
  const threeP = parseMadeAttempted(
    totals["threePointFieldGoalsMade-threePointFieldGoalsAttempted"],
  );
  const ft = parseMadeAttempted(totals["freeThrowsMade-freeThrowsAttempted"]);

  const avgFg = parseMadeAttempted(
    averages["avgFieldGoalsMade-avgFieldGoalsAttempted"],
  );
  const avgThreeP = parseMadeAttempted(
    averages["avgThreePointFieldGoalsMade-avgThreePointFieldGoalsAttempted"],
  );
  const avgFt = parseMadeAttempted(
    averages["avgFreeThrowsMade-avgFreeThrowsAttempted"],
  );

  const g = firstNumber(averages.gamesPlayed, totals.gamesPlayed);
  const avgMinutes = firstNumber(averages.avgMinutes);

  const mp = firstNumber(
    totals.minutes,
    totals.minutesPlayed,
    avgMinutes !== null && g !== null ? avgMinutes * g : null,
  );

  const seasonType = getSeasonType(season);
  const seasonNumber = getSeasonNumber(season.season);
  const teamCode = getTeamCodeFromSeason(season, league);
  const seasonSortValue = getSeasonRowSortValue(season, index);

  return {
    rowKey: `${seasonNumber}-${seasonType}-${teamCode}-${season.id ?? index}`,
    seasonNumber,
    seasonSortValue,
    displaySeason: getDisplaySeason(season),
    team: teamCode,
    seasonType,
    g,
    gs: firstNumber(averages.gamesStarted),
    mp,
    fg_pct:
      totals.fieldGoalPct ??
      averages.fieldGoalPct ??
      ratio(fg.made, fg.attempted),
    three_pct:
      totals.threePointFieldGoalPct ??
      averages.threePointFieldGoalPct ??
      ratio(threeP.made, threeP.attempted),
    ft_pct:
      totals.freeThrowPct ??
      averages.freeThrowPct ??
      ratio(ft.made, ft.attempted),
    totals: {
      pts: firstNumber(totals.points),
      fg,
      three_p: threeP,
      ft,
      trb: firstNumber(totals.totalRebounds),
      ast: firstNumber(totals.assists),
      stl: firstNumber(totals.steals),
      blk: firstNumber(totals.blocks),
      tov: firstNumber(totals.turnovers),
      pf: firstNumber(totals.fouls),
    },
    averages: {
      mp: avgMinutes,
      pts: firstNumber(averages.avgPoints),
      fg: avgFg,
      three_p: avgThreeP,
      ft: avgFt,
      trb: firstNumber(averages.avgRebounds),
      ast: firstNumber(averages.avgAssists),
      stl: firstNumber(averages.avgSteals),
      blk: firstNumber(averages.avgBlocks),
      tov: firstNumber(averages.avgTurnovers),
      pf: firstNumber(averages.avgFouls),
    },
  };
};

const getSeasonGroupKey = (row: NormalizedSeasonRow) => {
  return `${row.seasonNumber}-${row.seasonType}`;
};

const getSeasonGroupSortValue = (rows: NormalizedSeasonRow[]) => {
  return rows.reduce(
    (lowest, row) => Math.min(lowest, row.seasonSortValue),
    Number.POSITIVE_INFINITY,
  );
};

const sumNullableNumbers = (values: (number | null | undefined)[]) => {
  let total = 0;
  let hasValue = false;

  values.forEach((value) => {
    if (value === null || value === undefined) return;

    total += value;
    hasValue = true;
  });

  return hasValue ? total : null;
};

const areNumbersClose = (
  a: number | null | undefined,
  b: number | null | undefined,
) => {
  if (a === null || a === undefined || b === null || b === undefined) {
    return false;
  }

  return Math.abs(a - b) < 0.001;
};

const isCombinedTeamCode = (team: string) => {
  return COMBINED_TEAM_CODES.has(team.toUpperCase());
};

const isExplicitCombinedRow = (row: NormalizedSeasonRow) => {
  return !row.team || isCombinedTeamCode(row.team);
};

const getCombinedTeamCode = (rows: NormalizedSeasonRow[]) => {
  const codes = rows
    .map((row) => row.team)
    .filter(Boolean)
    .filter((code) => !COMBINED_TEAM_CODES.has(code.toUpperCase()))
    .filter((code, index, arr) => arr.indexOf(code) === index);

  return codes.join("-");
};

const findCombinedSeasonRow = (rows: NormalizedSeasonRow[]) => {
  const explicitCombinedRow = rows
    .filter(isExplicitCombinedRow)
    .sort((a, b) => (b.g ?? 0) - (a.g ?? 0))[0];

  if (explicitCombinedRow) return explicitCombinedRow;
  if (rows.length < 3) return null;

  return (
    rows.find((row, index) => {
      if (!row.team) return false;

      const otherRows = rows.filter((_, otherIndex) => otherIndex !== index);
      const hasRepeatedTeam = otherRows.some(
        (otherRow) => otherRow.team === row.team,
      );

      if (!hasRepeatedTeam) return false;

      const otherGames = sumNullableNumbers(
        otherRows.map((otherRow) => otherRow.g),
      );
      const otherPoints = sumNullableNumbers(
        otherRows.map((otherRow) => otherRow.totals.pts),
      );

      const gamesMatch = areNumbersClose(row.g, otherGames);
      const pointsMatch =
        row.totals.pts === null ||
        otherPoints === null ||
        areNumbersClose(row.totals.pts, otherPoints);

      return gamesMatch && pointsMatch;
    }) ?? null
  );
};

const getRowWithCombinedTeam = (
  row: NormalizedSeasonRow,
  rows: NormalizedSeasonRow[],
) => {
  const combinedTeamCode = getCombinedTeamCode(rows);

  return {
    ...row,
    rowKey: `${getSeasonGroupKey(row)}-${combinedTeamCode || row.team || "all"}`,
    seasonSortValue: getSeasonGroupSortValue(rows),
    team: combinedTeamCode || row.team,
    fg_pct: !isMissing(row.fg_pct)
      ? row.fg_pct
      : ratio(row.totals.fg.made, row.totals.fg.attempted),
    three_pct: !isMissing(row.three_pct)
      ? row.three_pct
      : ratio(row.totals.three_p.made, row.totals.three_p.attempted),
    ft_pct: !isMissing(row.ft_pct)
      ? row.ft_pct
      : ratio(row.totals.ft.made, row.totals.ft.attempted),
  };
};

const averageNumber = (
  total: number | null | undefined,
  games: number | null,
) => {
  if (total === null || total === undefined || !games || games <= 0) {
    return null;
  }

  return total / games;
};

const averageMadeAttempted = (
  value: MadeAttemptedValue,
  games: number | null,
): MadeAttemptedValue => ({
  display: null,
  made: averageNumber(value.made, games),
  attempted: averageNumber(value.attempted, games),
});

const sumMadeAttempted = (
  rows: NormalizedSeasonRow[],
  key: MadeAttemptedKey,
): MadeAttemptedValue => ({
  display: null,
  made: sumNullableNumbers(rows.map((row) => row.totals[key].made)),
  attempted: sumNullableNumbers(rows.map((row) => row.totals[key].attempted)),
});

const sumSimpleStat = (rows: NormalizedSeasonRow[], key: SimpleStatKey) => {
  return sumNullableNumbers(rows.map((row) => row.totals[key]));
};

const buildAveragesFromTotals = (
  totals: BoxScoreStats,
  games: number | null,
  minutes: number | null,
) => {
  const averages = {
    mp: averageNumber(minutes, games),
  } as BoxScoreStats & { mp: number | null };

  SIMPLE_STAT_KEYS.forEach((key) => {
    averages[key] = averageNumber(totals[key], games);
  });

  MADE_ATTEMPTED_KEYS.forEach((key) => {
    averages[key] = averageMadeAttempted(totals[key], games);
  });

  return averages;
};

const aggregateSeasonRows = (
  rows: NormalizedSeasonRow[],
): NormalizedSeasonRow => {
  const firstRow = rows[0];
  const g = sumNullableNumbers(rows.map((row) => row.g));
  const gs = sumNullableNumbers(rows.map((row) => row.gs));
  const mp = sumNullableNumbers(rows.map((row) => row.mp));

  const totals = {
    pts: sumSimpleStat(rows, "pts"),
    fg: sumMadeAttempted(rows, "fg"),
    three_p: sumMadeAttempted(rows, "three_p"),
    ft: sumMadeAttempted(rows, "ft"),
    trb: sumSimpleStat(rows, "trb"),
    ast: sumSimpleStat(rows, "ast"),
    stl: sumSimpleStat(rows, "stl"),
    blk: sumSimpleStat(rows, "blk"),
    tov: sumSimpleStat(rows, "tov"),
    pf: sumSimpleStat(rows, "pf"),
  };

  const combinedTeamCode = getCombinedTeamCode(rows);

  return {
    rowKey: `${getSeasonGroupKey(firstRow)}-${combinedTeamCode || "all"}`,
    seasonNumber: firstRow.seasonNumber,
    seasonSortValue: getSeasonGroupSortValue(rows),
    displaySeason: firstRow.displaySeason,
    team: combinedTeamCode || firstRow.team,
    seasonType: firstRow.seasonType,
    g,
    gs,
    mp,
    fg_pct: ratio(totals.fg.made, totals.fg.attempted),
    three_pct: ratio(totals.three_p.made, totals.three_p.attempted),
    ft_pct: ratio(totals.ft.made, totals.ft.attempted),
    totals,
    averages: buildAveragesFromTotals(totals, g, mp),
  };
};

const collapseSplitSeasonRows = (rows: NormalizedSeasonRow[]) => {
  const groupedRows = new Map<string, NormalizedSeasonRow[]>();

  rows.forEach((row) => {
    const groupKey = getSeasonGroupKey(row);
    const currentRows = groupedRows.get(groupKey) ?? [];

    currentRows.push(row);
    groupedRows.set(groupKey, currentRows);
  });

  return Array.from(groupedRows.values()).map((seasonRows) => {
    if (seasonRows.length === 1) return seasonRows[0];

    const combinedRow = findCombinedSeasonRow(seasonRows);

    if (combinedRow) {
      return getRowWithCombinedTeam(combinedRow, seasonRows);
    }

    return aggregateSeasonRows(seasonRows);
  });
};

const hasPositiveNumber = (value: StatValue) => {
  const parsed = toNumberOrNull(value);
  return parsed !== null && parsed > 0;
};

const hasMadeAttemptedStats = (value: MadeAttemptedValue) => {
  return hasPositiveNumber(value.made) || hasPositiveNumber(value.attempted);
};

const hasUsableRowStats = (row: NormalizedSeasonRow) => {
  if (hasPositiveNumber(row.g)) return true;
  if (hasPositiveNumber(row.mp)) return true;

  if (hasPositiveNumber(row.fg_pct)) return true;
  if (hasPositiveNumber(row.three_pct)) return true;
  if (hasPositiveNumber(row.ft_pct)) return true;

  const hasSimpleTotals = SIMPLE_STAT_KEYS.some((key) =>
    hasPositiveNumber(row.totals[key]),
  );

  if (hasSimpleTotals) return true;

  const hasMadeAttemptedTotals = MADE_ATTEMPTED_KEYS.some((key) =>
    hasMadeAttemptedStats(row.totals[key]),
  );

  if (hasMadeAttemptedTotals) return true;

  const hasSimpleAverages = SIMPLE_STAT_KEYS.some((key) =>
    hasPositiveNumber(row.averages[key]),
  );

  if (hasSimpleAverages) return true;

  const hasMadeAttemptedAverages = MADE_ATTEMPTED_KEYS.some((key) =>
    hasMadeAttemptedStats(row.averages[key]),
  );

  if (hasMadeAttemptedAverages) return true;

  return hasPositiveNumber(row.averages.mp);
};

const normalizeStatsData = (seasons: Season[], league: BasketballLeague) => {
  const rows = seasons.map((season, index) =>
    normalizeStatsRow(season, index, league),
  );

  const rowsWithCollapsedSplits = collapseSplitSeasonRows(rows);

  return sortRows(rowsWithCollapsedSplits);
};

const isBestStat = (row: NormalizedSeasonRow, bestRowKey: string | null) => {
  return row.rowKey === bestRowKey;
};

const calculateCareerTotals = (rows: NormalizedSeasonRow[]) => {
  return rows.reduce<CareerTotals>((acc, row) => {
    acc.g += row.g ?? 0;
    acc.mp += row.mp ?? 0;

    acc.pts += row.totals.pts ?? 0;

    acc.fg.made += row.totals.fg.made ?? 0;
    acc.fg.attempted += row.totals.fg.attempted ?? 0;

    acc.three_p.made += row.totals.three_p.made ?? 0;
    acc.three_p.attempted += row.totals.three_p.attempted ?? 0;

    acc.ft.made += row.totals.ft.made ?? 0;
    acc.ft.attempted += row.totals.ft.attempted ?? 0;

    acc.trb += row.totals.trb ?? 0;
    acc.ast += row.totals.ast ?? 0;
    acc.stl += row.totals.stl ?? 0;
    acc.blk += row.totals.blk ?? 0;
    acc.tov += row.totals.tov ?? 0;
    acc.pf += row.totals.pf ?? 0;

    return acc;
  }, createEmptyCareerTotals());
};

const formatRowSimpleStat = (
  row: NormalizedSeasonRow,
  statView: StatView,
  key: SimpleStatKey,
) => {
  if (statView === "totals") {
    return formatNumber(row.totals[key]);
  }

  if (statView === "pergame") {
    const avgValue = row.averages[key];

    if (avgValue !== null && avgValue !== undefined) {
      return formatOneDecimal(avgValue);
    }

    const total = row.totals[key];
    const games = row.g;

    return games && games > 0
      ? formatOneDecimal((total ?? 0) / games)
      : EMPTY_STAT;
  }

  return formatOneDecimal(per36(row.totals[key], row.mp));
};

const formatRowMadeAttemptedStat = (
  row: NormalizedSeasonRow,
  statView: StatView,
  key: MadeAttemptedKey,
) => {
  if (statView === "totals") {
    return formatMadeAttempted(row.totals[key]);
  }

  if (statView === "pergame") {
    const averageValue = row.averages[key];

    if (!isMissing(averageValue.display)) {
      return formatMadeAttempted(averageValue);
    }

    const games = row.g;
    const total = row.totals[key];

    if (!games || games <= 0) return EMPTY_STAT;

    return formatMadeAttemptedFromNumbers(
      total.made !== null ? total.made / games : null,
      total.attempted !== null ? total.attempted / games : null,
    );
  }

  const total = row.totals[key];

  return formatMadeAttemptedFromNumbers(
    per36(total.made, row.mp),
    per36(total.attempted, row.mp),
  );
};

const formatRowMinutes = (row: NormalizedSeasonRow, statView: StatView) => {
  if (statView === "totals") {
    return formatNumber(row.mp);
  }

  if (statView === "pergame") {
    if (row.averages.mp !== null && row.averages.mp !== undefined) {
      return formatOneDecimal(row.averages.mp);
    }

    return row.g && row.g > 0
      ? formatOneDecimal((row.mp ?? 0) / row.g)
      : EMPTY_STAT;
  }

  return row.mp ? "36.0" : EMPTY_STAT;
};

const formatCareerSimpleStat = (
  career: CareerTotals,
  statView: StatView,
  key: SimpleStatKey,
) => {
  if (statView === "totals") {
    return formatNumber(career[key]);
  }

  if (statView === "pergame") {
    return career.g > 0 ? formatOneDecimal(career[key] / career.g) : EMPTY_STAT;
  }

  return formatOneDecimal(per36(career[key], career.mp));
};

const formatCareerMadeAttemptedStat = (
  career: CareerTotals,
  statView: StatView,
  key: MadeAttemptedKey,
) => {
  const stat = career[key];

  if (statView === "totals") {
    return `${formatNumber(stat.made)}-${formatNumber(stat.attempted)}`;
  }

  if (statView === "pergame") {
    if (career.g <= 0) return EMPTY_STAT;

    return formatMadeAttemptedFromNumbers(
      stat.made / career.g,
      stat.attempted / career.g,
    );
  }

  return formatMadeAttemptedFromNumbers(
    per36(stat.made, career.mp),
    per36(stat.attempted, career.mp),
  );
};

const formatCareerMinutes = (career: CareerTotals, statView: StatView) => {
  if (statView === "totals") {
    return formatNumber(career.mp);
  }

  if (statView === "pergame") {
    return career.g > 0 ? formatOneDecimal(career.mp / career.g) : EMPTY_STAT;
  }

  return career.mp > 0 ? "36.0" : EMPTY_STAT;
};

const getRowStatCells = (
  row: NormalizedSeasonRow,
  statView: StatView,
): StatCell[] => {
  return [
    { key: "g", value: formatNumber(row.g) },
    { key: "mp", value: formatRowMinutes(row, statView) },
    { key: "pts", value: formatRowSimpleStat(row, statView, "pts") },
    { key: "fg", value: formatRowMadeAttemptedStat(row, statView, "fg") },
    { key: "fg_pct", value: formatPercent(row.fg_pct) },
    {
      key: "three_p",
      value: formatRowMadeAttemptedStat(row, statView, "three_p"),
    },
    { key: "three_pct", value: formatPercent(row.three_pct) },
    { key: "ft", value: formatRowMadeAttemptedStat(row, statView, "ft") },
    { key: "ft_pct", value: formatPercent(row.ft_pct) },
    { key: "trb", value: formatRowSimpleStat(row, statView, "trb") },
    { key: "ast", value: formatRowSimpleStat(row, statView, "ast") },
    { key: "stl", value: formatRowSimpleStat(row, statView, "stl") },
    { key: "blk", value: formatRowSimpleStat(row, statView, "blk") },
    { key: "tov", value: formatRowSimpleStat(row, statView, "tov") },
    { key: "pf", value: formatRowSimpleStat(row, statView, "pf") },
  ];
};

const getCareerStatCells = (
  career: CareerTotals,
  statView: StatView,
): StatCell[] => {
  return [
    { key: "g", value: formatNumber(career.g) },
    { key: "mp", value: formatCareerMinutes(career, statView) },
    { key: "pts", value: formatCareerSimpleStat(career, statView, "pts") },
    { key: "fg", value: formatCareerMadeAttemptedStat(career, statView, "fg") },
    {
      key: "fg_pct",
      value: formatPercent(ratio(career.fg.made, career.fg.attempted)),
    },
    {
      key: "three_p",
      value: formatCareerMadeAttemptedStat(career, statView, "three_p"),
    },
    {
      key: "three_pct",
      value: formatPercent(
        ratio(career.three_p.made, career.three_p.attempted),
      ),
    },
    { key: "ft", value: formatCareerMadeAttemptedStat(career, statView, "ft") },
    {
      key: "ft_pct",
      value: formatPercent(ratio(career.ft.made, career.ft.attempted)),
    },
    { key: "trb", value: formatCareerSimpleStat(career, statView, "trb") },
    { key: "ast", value: formatCareerSimpleStat(career, statView, "ast") },
    { key: "stl", value: formatCareerSimpleStat(career, statView, "stl") },
    { key: "blk", value: formatCareerSimpleStat(career, statView, "blk") },
    { key: "tov", value: formatCareerSimpleStat(career, statView, "tov") },
    { key: "pf", value: formatCareerSimpleStat(career, statView, "pf") },
  ];
};

export default function PlayerStatTable({
  seasons,
  loading,
  error,
  league,
}: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = statsTableStyles(isDark);
  const global = globalStyles(isDark);

  const showSeasonTypeTabs = PRO_LEAGUES_WITH_POSTSEASON_TABS.has(league);

  const [statView, setStatView] = useState<StatView>("totals");
  const [selectedSeasonType, setSelectedSeasonType] =
    useState<SeasonType>("regularseason");

  const normalizedRows = useMemo(
    () => normalizeStatsData(seasons, league),
    [seasons, league],
  );

  const filteredRows = useMemo(() => {
    if (!showSeasonTypeTabs) {
      return normalizedRows;
    }

    const rowsForSeasonType = normalizedRows.filter(
      (row) => row.seasonType === selectedSeasonType,
    );

    if (selectedSeasonType === "postseason") {
      return rowsForSeasonType.filter(hasUsableRowStats);
    }

    return rowsForSeasonType;
  }, [normalizedRows, selectedSeasonType, showSeasonTypeTabs]);

  const bestRowKey = useMemo(() => {
    let best: string | null = null;
    let maxPpg = -1;

    filteredRows.forEach((row) => {
      const ppg =
        row.averages.pts ??
        (row.g && row.g > 0 ? (row.totals.pts ?? 0) / row.g : null);

      if (ppg !== null && ppg > maxPpg) {
        maxPpg = ppg;
        best = row.rowKey;
      }
    });

    return best;
  }, [filteredRows]);

  const career = useMemo(
    () => calculateCareerTotals(filteredRows),
    [filteredRows],
  );

  const isPostseasonSelected =
    showSeasonTypeTabs && selectedSeasonType === "postseason";

  const emptyText = isPostseasonSelected
    ? "Stats not available"
    : "No stats available";

  const getDataRowStyle = (row: NormalizedSeasonRow, index: number) => {
    const zebra =
      index % 2 === 1
        ? isDark
          ? styles.rowAltDark
          : styles.rowAltLight
        : null;

    const highlight = isBestStat(row, bestRowKey) ? styles.best : null;

    return [styles.row, zebra, highlight];
  };

  const renderHeader = () => (
    <>
      <View style={styles.statsHeader}>
        <HeadingTwo isDark={isDark}>Career Stats</HeadingTwo>

        {filteredRows.length > 0 ? (
          <Dropdown
            isDark={isDark}
            options={STAT_OPTIONS}
            selectedValue={statView}
            onSelect={(value) => setStatView(value as StatView)}
            style={styles.dropdown}
            width={160}
          />
        ) : null}
      </View>

      {showSeasonTypeTabs ? (
        <PillTabs
          tabs={SEASON_TYPE_OPTIONS}
          selectedValue={selectedSeasonType}
          onChange={setSelectedSeasonType}
        />
      ) : null}
    </>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <PlayerStatTableSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <View style={global.emptyContainer}>
        <Text style={global.errorText}>Failed to load stats</Text>
      </View>
    );
  }

  if (!normalizedRows.length) {
    if (isPostseasonSelected) {
      return (
        <View style={styles.container}>
          {renderHeader()}
          <Text style={global.emptyText}>{emptyText}</Text>
        </View>
      );
    }

    return (
      <View style={global.emptyContainer}>
        <Text style={global.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      {!filteredRows.length ? (
        <Text style={global.emptyText}>{emptyText}</Text>
      ) : (
        <>
          <View style={styles.tableWrapper}>
            <View style={styles.fixedSection}>
              <View style={styles.seasonColumn}>
                <View
                  style={[styles.row, styles.headerRow, styles.tableHeaderRow]}
                >
                  <Text style={[styles.fixedCell, styles.fixedHeaderCell]}>
                    SEASON
                  </Text>
                </View>

                {filteredRows.map((row, index) => (
                  <View
                    key={`${row.rowKey}-season`}
                    style={getDataRowStyle(row, index)}
                  >
                    <Text
                      style={styles.fixedCell}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {getRowDisplaySeason(row, showSeasonTypeTabs)}
                    </Text>
                  </View>
                ))}

                <View style={[styles.row, styles.careerRow, styles.lastRow]}>
                  <Text
                    style={[
                      styles.fixedCell,
                      styles.fixedHeaderCell,
                      styles.fixedCareerHeaderCell,
                    ]}
                  >
                    CAREER
                  </Text>
                </View>
              </View>

              <View style={styles.teamColumn}>
                <View
                  style={[styles.row, styles.headerRow, styles.tableHeaderRow]}
                >
                  <Text style={[styles.fixedTeamCell, styles.fixedHeaderCell]}>
                    TEAM
                  </Text>
                </View>

                {filteredRows.map((row, index) => (
                  <View
                    key={`${row.rowKey}-team`}
                    style={getDataRowStyle(row, index)}
                  >
                    <Text
                      style={styles.fixedTeamCell}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {row.team}
                    </Text>
                  </View>
                ))}

                <View style={[styles.row, styles.careerRow, styles.lastRow]}>
                  <Text style={styles.fixedCareerCell}></Text>
                </View>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.scrollSection}
              contentContainerStyle={styles.scrollContentContainer}
            >
              <View style={styles.statScrollContent}>
                <View
                  style={[styles.row, styles.headerRow, styles.tableHeaderRow]}
                >
                  {TABLE_HEADERS.map((header) => (
                    <Text key={header} style={[styles.cell, styles.headerCell]}>
                      {header}
                    </Text>
                  ))}
                </View>

                {filteredRows.map((row, index) => (
                  <View
                    key={`${row.rowKey}-stats`}
                    style={getDataRowStyle(row, index)}
                  >
                    {getRowStatCells(row, statView).map((cell) => (
                      <Text key={cell.key} style={styles.cell}>
                        {cell.value}
                      </Text>
                    ))}
                  </View>
                ))}

                <View style={[styles.row, styles.careerRow, styles.lastRow]}>
                  {getCareerStatCells(career, statView).map((cell) => (
                    <Text key={cell.key} style={styles.careerCell}>
                      {cell.value}
                    </Text>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>

          <View style={styles.glossaryContainer}>
            <Text style={styles.headerName}>Stat Glossary</Text>

            {chunk(NBA_STAT_GLOSSARY, 2).map((row, rowIndex) => {
              const isAlt = rowIndex % 2 === 1;

              return (
                <View
                  key={`glossary-row-${rowIndex}`}
                  style={styles.glossaryRow}
                >
                  {row.map((item, colIndex) => (
                    <View
                      key={item.abbr}
                      style={[
                        styles.glossaryCell,
                        isAlt && styles.glossaryCellAlt,
                        colIndex === 0 && styles.glossaryCellWithRightBorder,
                      ]}
                    >
                      <Text style={styles.glossaryAbbr}>
                        {item.abbr}{" "}
                        <Text style={styles.glossaryDisplayName}>
                          {item.label}
                        </Text>
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}
