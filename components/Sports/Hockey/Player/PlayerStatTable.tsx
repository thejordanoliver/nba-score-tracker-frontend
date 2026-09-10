import PillTabs from "@/components/TabBars/PillTabs";
import { getNHLTeamByEspnId } from "@/constants/teamsNHL";
import { Dropdown } from "components/Dropdown";
import HeadingTwo from "components/Headings/HeadingTwo";
import PlayerStatTableSkeleton from "components/Skeletons/PlayerStatsTableSkeleton";
import { globalStyles } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { Season, StatValue } from "hooks/HockeyHooks/usePlayerSeasons";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { statsTableStyles } from "styles/PlayerStyles/StatsTableStyles";

interface Props {
  seasons: Season[];
  loading: boolean;
  error: string | null;
  league: "NHL";
}

type StatView = "totals" | "pergame";
type SeasonType = "regularseason" | "postseason";

type CountingStatKey =
  | "goals"
  | "assists"
  | "points"
  | "plusMinus"
  | "penaltyMinutes"
  | "shootoutGoals"
  | "powerPlayGoals"
  | "powerPlayAssists"
  | "shortHandedGoals"
  | "shortHandedAssists"
  | "gameWinningGoals";

type CountingStats = Record<CountingStatKey, number | null>;
type StatRecord = Record<string, StatValue>;

type NormalizedSeasonRow = {
  rowKey: string;
  seasonNumber: number;
  seasonSortValue: number;
  displaySeason: string;
  team: string;
  seasonType: SeasonType;
  games: number | null;
  stats: CountingStats;
  shootingPct: number | null;
  timeOnIcePerGame: string | null;
  production: string | null;
};

type CareerStats = {
  games: number;
  stats: Record<CountingStatKey, number>;
  shootingPct: number | null;
  timeOnIcePerGame: string | null;
  production: string | null;
};

type StatCell = {
  key: string;
  value: string;
};

const EMPTY_STAT = "-";

const STAT_OPTIONS: { label: string; value: StatView }[] = [
  {
    label: "Totals",
    value: "totals",
  },
  {
    label: "Per Game",
    value: "pergame",
  },
];

const SEASON_TYPE_OPTIONS: {
  label: string;
  value: SeasonType;
}[] = [
  {
    label: "Regular Season",
    value: "regularseason",
  },
  {
    label: "Postseason",
    value: "postseason",
  },
];

const TABLE_HEADERS = [
  "GP",
  "G",
  "A",
  "PTS",
  "+/-",
  "PIM",
  "SOG",
  "SPCT",
  "PPG",
  "PPA",
  "SHG",
  "SHA",
  "GWG",
  "TOI/G",
  "PROD",
];

const NHL_STAT_GLOSSARY = [
  {
    abbr: "+/-",
    label: "Plus/Minus Rating",
  },
  {
    abbr: "A",
    label: "Assists",
  },
  {
    abbr: "G",
    label: "Goals",
  },
  {
    abbr: "GP",
    label: "Games Played",
  },
  {
    abbr: "GWG",
    label: "Game-Winning Goals",
  },
  {
    abbr: "PIM",
    label: "Penalty Minutes",
  },
  {
    abbr: "PPA",
    label: "Power Play Assists",
  },
  {
    abbr: "PPG",
    label: "Power Play Goals",
  },
  {
    abbr: "PROD",
    label: "Production",
  },
  {
    abbr: "PTS",
    label: "Points",
  },
  {
    abbr: "SHA",
    label: "Short-Handed Assists",
  },
  {
    abbr: "SHG",
    label: "Short-Handed Goals",
  },
  {
    abbr: "SOG",
    label: "Shootout Goals",
  },
  {
    abbr: "SPCT",
    label: "Shooting Percentage",
  },
  {
    abbr: "TOI/G",
    label: "Time On Ice Per Game",
  },
];

const COUNTING_STAT_KEYS: CountingStatKey[] = [
  "goals",
  "assists",
  "points",
  "plusMinus",
  "penaltyMinutes",
  "shootoutGoals",
  "powerPlayGoals",
  "powerPlayAssists",
  "shortHandedGoals",
  "shortHandedAssists",
  "gameWinningGoals",
];

const COMBINED_TEAM_CODES = new Set(["TOT", "2TM", "3TM", "4TM", "5TM"]);

const createEmptyCountingStats = (): CountingStats => ({
  goals: null,
  assists: null,
  points: null,
  plusMinus: null,
  penaltyMinutes: null,
  shootoutGoals: null,
  powerPlayGoals: null,
  powerPlayAssists: null,
  shortHandedGoals: null,
  shortHandedAssists: null,
  gameWinningGoals: null,
});

const createEmptyCareerStats = (): CareerStats => ({
  games: 0,
  stats: {
    goals: 0,
    assists: 0,
    points: 0,
    plusMinus: 0,
    penaltyMinutes: 0,
    shootoutGoals: 0,
    powerPlayGoals: 0,
    powerPlayAssists: 0,
    shortHandedGoals: 0,
    shortHandedAssists: 0,
    gameWinningGoals: 0,
  },
  shootingPct: null,
  timeOnIcePerGame: null,
  production: null,
});

const chunk = <T,>(items: T[], size: number): T[][] => {
  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
};

const isMissing = (value: StatValue) => {
  return value === null || value === undefined || value === "";
};

const toNumberOrNull = (value: StatValue): number | null => {
  if (isMissing(value)) {
    return null;
  }

  const normalizedValue = String(value)
    .replace("%", "")
    .replace(/,/g, "")
    .trim();

  const numberValue = Number(normalizedValue);

  return Number.isFinite(numberValue) ? numberValue : null;
};

const firstNumber = (...values: StatValue[]): number | null => {
  for (const value of values) {
    const parsedValue = toNumberOrNull(value);

    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return null;
};

const firstString = (...values: StatValue[]): string | null => {
  for (const value of values) {
    if (!isMissing(value)) {
      return String(value).trim();
    }
  }

  return null;
};

const toStatRecord = (value: unknown): StatRecord => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as StatRecord;
};

const getSeasonNumber = (value: StatValue): number => {
  const directNumber = toNumberOrNull(value);

  if (directNumber !== null) {
    return directNumber;
  }

  const yearMatch = String(value ?? "").match(/\d{4}/);

  return yearMatch ? Number(yearMatch[0]) : 0;
};

const formatNumber = (value: StatValue): string => {
  const numberValue = toNumberOrNull(value);

  if (numberValue === null) {
    return EMPTY_STAT;
  }

  if (Number.isInteger(numberValue)) {
    return String(numberValue);
  }

  return numberValue.toFixed(1);
};

const formatOneDecimal = (value: StatValue): string => {
  const numberValue = toNumberOrNull(value);

  if (numberValue === null) {
    return EMPTY_STAT;
  }

  return numberValue.toFixed(1);
};

const formatPercent = (value: StatValue): string => {
  const numberValue = toNumberOrNull(value);

  if (numberValue === null) {
    return EMPTY_STAT;
  }

  const percentage =
    Math.abs(numberValue) <= 1 ? numberValue * 100 : numberValue;

  return `${percentage.toFixed(1)}%`;
};

const parseClockToSeconds = (value: StatValue): number | null => {
  if (isMissing(value)) {
    return null;
  }

  const normalizedValue = String(value).trim();

  if (!normalizedValue.includes(":")) {
    const numericValue = toNumberOrNull(value);

    if (numericValue === null) {
      return null;
    }

    return numericValue * 60;
  }

  const parts = normalizedValue.split(":").map(Number);

  if (
    parts.length < 2 ||
    parts.some((part) => !Number.isFinite(part) || part < 0)
  ) {
    return null;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = parts;

  return hours * 3600 + minutes * 60 + seconds;
};

const formatSecondsAsClock = (
  totalSeconds: number | null | undefined,
): string => {
  if (
    totalSeconds === null ||
    totalSeconds === undefined ||
    !Number.isFinite(totalSeconds) ||
    totalSeconds < 0
  ) {
    return EMPTY_STAT;
  }

  const roundedSeconds = Math.round(totalSeconds);
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);
  const seconds = roundedSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      seconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const formatClockValue = (value: StatValue): string => {
  const seconds = parseClockToSeconds(value);

  if (seconds !== null) {
    return formatSecondsAsClock(seconds);
  }

  return firstString(value) ?? EMPTY_STAT;
};

const sumNullableNumbers = (
  values: (number | null | undefined)[],
): number | null => {
  let total = 0;
  let foundValue = false;

  values.forEach((value) => {
    if (value === null || value === undefined) {
      return;
    }

    total += value;
    foundValue = true;
  });

  return foundValue ? total : null;
};

const averageFromTotals = (
  total: number | null | undefined,
  games: number | null,
): number | null => {
  if (total === null || total === undefined || games === null || games <= 0) {
    return null;
  }

  return total / games;
};

const areNumbersClose = (
  first: number | null | undefined,
  second: number | null | undefined,
): boolean => {
  if (
    first === null ||
    first === undefined ||
    second === null ||
    second === undefined
  ) {
    return false;
  }

  return Math.abs(first - second) < 0.001;
};

const getSeasonType = (season: Season): SeasonType => {
  const seasonTypeValue = String(season.season_type_value ?? "").trim();

  if (seasonTypeValue === "3") {
    return "postseason";
  }

  if (seasonTypeValue === "2") {
    return "regularseason";
  }

  const seasonTypeLabel = String(season.season_type_label ?? "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  if (
    seasonTypeLabel.includes("postseason") ||
    seasonTypeLabel.includes("playoff")
  ) {
    return "postseason";
  }

  const seasonType = String(season.season_type ?? "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  if (seasonType.includes("postseason") || seasonType.includes("playoff")) {
    return "postseason";
  }

  return "regularseason";
};

const getDisplaySeason = (season: Season): string => {
  if (!isMissing(season.display_season)) {
    return String(season.display_season);
  }

  if (!isMissing(season.season)) {
    return String(season.season);
  }

  return EMPTY_STAT;
};

const getRowDisplaySeason = (
  row: NormalizedSeasonRow,
  showSeasonTypeTabs: boolean,
): string => {
  if (!showSeasonTypeTabs && row.seasonType === "postseason") {
    return `${row.displaySeason} POST`;
  }

  return row.displaySeason;
};

const getTeamCodeFromSeason = (season: Season): string => {
  const numericTeamId = Number(season.team_id);

  const fallbackTeamCode = !isMissing(season.team_slug)
    ? String(season.team_slug).toUpperCase()
    : "";

  if (!Number.isFinite(numericTeamId)) {
    return fallbackTeamCode;
  }

  const team = getNHLTeamByEspnId(numericTeamId);

  return team?.code ?? fallbackTeamCode;
};

const getSeasonRowSortValue = (season: Season, index: number): number => {
  const seasonRowId = toNumberOrNull(season.id);

  return seasonRowId ?? index;
};

const normalizeStatsRow = (
  season: Season,
  index: number,
): NormalizedSeasonRow => {
  const totals = toStatRecord(season.totals);

  const games = firstNumber(totals.games, totals.gamesPlayed);

  const seasonType = getSeasonType(season);
  const seasonNumber = getSeasonNumber(season.season);
  const teamCode = getTeamCodeFromSeason(season);

  return {
    rowKey: `${seasonNumber}-${seasonType}-${teamCode}-${season.id ?? index}`,
    seasonNumber,
    seasonSortValue: getSeasonRowSortValue(season, index),
    displaySeason: getDisplaySeason(season),
    team: teamCode,
    seasonType,
    games,
    stats: {
      goals: firstNumber(totals.goals),
      assists: firstNumber(totals.assists),
      points: firstNumber(totals.points),
      plusMinus: firstNumber(totals.plusMinus),
      penaltyMinutes: firstNumber(totals.penaltyMinutes),
      shootoutGoals: firstNumber(
        totals.shootoutGoals,
        totals.shotsOnGoal,
        totals.shotsTotal,
      ),
      powerPlayGoals: firstNumber(totals.powerPlayGoals),
      powerPlayAssists: firstNumber(totals.powerPlayAssists),
      shortHandedGoals: firstNumber(totals.shortHandedGoals),
      shortHandedAssists: firstNumber(totals.shortHandedAssists),
      gameWinningGoals: firstNumber(totals.gameWinningGoals),
    },
    shootingPct: firstNumber(totals.shootingPct, totals.shootingPercentage),
    timeOnIcePerGame: firstString(totals.timeOnIcePerGame, totals.avgTimeOnIce),
    production: firstString(totals.production),
  };
};

const getSeasonGroupKey = (row: NormalizedSeasonRow): string => {
  return `${row.seasonNumber}-${row.seasonType}`;
};

const getSeasonGroupSortValue = (rows: NormalizedSeasonRow[]): number => {
  return rows.reduce(
    (lowestValue, row) => Math.min(lowestValue, row.seasonSortValue),
    Number.POSITIVE_INFINITY,
  );
};

const isCombinedTeamCode = (teamCode: string): boolean => {
  return COMBINED_TEAM_CODES.has(teamCode.toUpperCase());
};

const isExplicitCombinedRow = (row: NormalizedSeasonRow): boolean => {
  return !row.team || isCombinedTeamCode(row.team);
};

const getCombinedTeamCode = (rows: NormalizedSeasonRow[]): string => {
  const uniqueTeamCodes = rows
    .map((row) => row.team)
    .filter(Boolean)
    .filter((teamCode) => !isCombinedTeamCode(teamCode))
    .filter(
      (teamCode, index, teamCodes) => teamCodes.indexOf(teamCode) === index,
    );

  return uniqueTeamCodes.join("-");
};

const findCombinedSeasonRow = (
  rows: NormalizedSeasonRow[],
): NormalizedSeasonRow | null => {
  const explicitCombinedRow = rows
    .filter(isExplicitCombinedRow)
    .sort(
      (firstRow, secondRow) => (secondRow.games ?? 0) - (firstRow.games ?? 0),
    )[0];

  if (explicitCombinedRow) {
    return explicitCombinedRow;
  }

  if (rows.length < 3) {
    return null;
  }

  return (
    rows.find((candidateRow, candidateIndex) => {
      const otherRows = rows.filter(
        (_, rowIndex) => rowIndex !== candidateIndex,
      );

      const otherGames = sumNullableNumbers(otherRows.map((row) => row.games));

      const otherPoints = sumNullableNumbers(
        otherRows.map((row) => row.stats.points),
      );

      const gamesMatch = areNumbersClose(candidateRow.games, otherGames);

      const pointsMatch =
        candidateRow.stats.points === null ||
        otherPoints === null ||
        areNumbersClose(candidateRow.stats.points, otherPoints);

      return gamesMatch && pointsMatch;
    }) ?? null
  );
};

const getWeightedShootingPct = (rows: NormalizedSeasonRow[]): number | null => {
  let weightedTotal = 0;
  let totalWeight = 0;

  rows.forEach((row) => {
    if (row.shootingPct === null || row.games === null || row.games <= 0) {
      return;
    }

    weightedTotal += row.shootingPct * row.games;
    totalWeight += row.games;
  });

  return totalWeight > 0 ? weightedTotal / totalWeight : null;
};

const getTotalIceTimeSeconds = (rows: NormalizedSeasonRow[]): number | null => {
  let totalSeconds = 0;
  let foundValue = false;

  rows.forEach((row) => {
    const secondsPerGame = parseClockToSeconds(row.timeOnIcePerGame);

    if (secondsPerGame === null || row.games === null || row.games <= 0) {
      return;
    }

    totalSeconds += secondsPerGame * row.games;
    foundValue = true;
  });

  return foundValue ? totalSeconds : null;
};

const aggregateSeasonRows = (
  rows: NormalizedSeasonRow[],
): NormalizedSeasonRow => {
  const firstRow = rows[0];
  const games = sumNullableNumbers(rows.map((row) => row.games));

  const stats = createEmptyCountingStats();

  COUNTING_STAT_KEYS.forEach((statKey) => {
    stats[statKey] = sumNullableNumbers(rows.map((row) => row.stats[statKey]));
  });

  const totalIceTimeSeconds = getTotalIceTimeSeconds(rows);

  const timeOnIcePerGame =
    totalIceTimeSeconds !== null && games !== null && games > 0
      ? formatSecondsAsClock(totalIceTimeSeconds / games)
      : null;

  const production =
    totalIceTimeSeconds !== null && stats.points !== null && stats.points > 0
      ? formatSecondsAsClock(totalIceTimeSeconds / stats.points)
      : null;

  const combinedTeamCode = getCombinedTeamCode(rows);

  return {
    rowKey: `${getSeasonGroupKey(firstRow)}-${combinedTeamCode || "all"}`,
    seasonNumber: firstRow.seasonNumber,
    seasonSortValue: getSeasonGroupSortValue(rows),
    displaySeason: firstRow.displaySeason,
    team: combinedTeamCode || firstRow.team,
    seasonType: firstRow.seasonType,
    games,
    stats,
    shootingPct: getWeightedShootingPct(rows),
    timeOnIcePerGame,
    production,
  };
};

const getCombinedSeasonRow = (
  combinedRow: NormalizedSeasonRow,
  rows: NormalizedSeasonRow[],
): NormalizedSeasonRow => {
  const combinedTeamCode = getCombinedTeamCode(rows);

  return {
    ...combinedRow,
    rowKey: `${getSeasonGroupKey(combinedRow)}-${
      combinedTeamCode || combinedRow.team || "all"
    }`,
    seasonSortValue: getSeasonGroupSortValue(rows),
    team: combinedTeamCode || combinedRow.team,
  };
};

const collapseSplitSeasonRows = (
  rows: NormalizedSeasonRow[],
): NormalizedSeasonRow[] => {
  const groupedRows = new Map<string, NormalizedSeasonRow[]>();

  rows.forEach((row) => {
    const groupKey = getSeasonGroupKey(row);
    const existingRows = groupedRows.get(groupKey) ?? [];

    existingRows.push(row);
    groupedRows.set(groupKey, existingRows);
  });

  return Array.from(groupedRows.values()).map((seasonRows) => {
    if (seasonRows.length === 1) {
      return seasonRows[0];
    }

    const combinedRow = findCombinedSeasonRow(seasonRows);

    if (combinedRow) {
      return getCombinedSeasonRow(combinedRow, seasonRows);
    }

    return aggregateSeasonRows(seasonRows);
  });
};

const sortRows = (rows: NormalizedSeasonRow[]): NormalizedSeasonRow[] => {
  return [...rows].sort((firstRow, secondRow) => {
    if (secondRow.seasonNumber !== firstRow.seasonNumber) {
      return secondRow.seasonNumber - firstRow.seasonNumber;
    }

    return firstRow.seasonSortValue - secondRow.seasonSortValue;
  });
};

const hasUsableRowStats = (row: NormalizedSeasonRow): boolean => {
  if (row.games !== null && row.games > 0) {
    return true;
  }

  if (
    row.shootingPct !== null ||
    row.timeOnIcePerGame !== null ||
    row.production !== null
  ) {
    return true;
  }

  return COUNTING_STAT_KEYS.some((statKey) => row.stats[statKey] !== null);
};

const normalizeStatsData = (seasons: Season[]): NormalizedSeasonRow[] => {
  const normalizedRows = seasons.map((season, index) =>
    normalizeStatsRow(season, index),
  );

  return sortRows(collapseSplitSeasonRows(normalizedRows));
};

const calculateCareerStats = (rows: NormalizedSeasonRow[]): CareerStats => {
  const career = createEmptyCareerStats();

  rows.forEach((row) => {
    career.games += row.games ?? 0;

    COUNTING_STAT_KEYS.forEach((statKey) => {
      career.stats[statKey] += row.stats[statKey] ?? 0;
    });
  });

  career.shootingPct = getWeightedShootingPct(rows);

  const totalIceTimeSeconds = getTotalIceTimeSeconds(rows);

  if (totalIceTimeSeconds !== null && career.games > 0) {
    career.timeOnIcePerGame = formatSecondsAsClock(
      totalIceTimeSeconds / career.games,
    );
  }

  if (totalIceTimeSeconds !== null && career.stats.points > 0) {
    career.production = formatSecondsAsClock(
      totalIceTimeSeconds / career.stats.points,
    );
  }

  return career;
};

const formatCountingStat = (
  total: number | null,
  games: number | null,
  statView: StatView,
): string => {
  if (statView === "totals") {
    return formatNumber(total);
  }

  return formatOneDecimal(averageFromTotals(total, games));
};

const formatCareerCountingStat = (
  career: CareerStats,
  statKey: CountingStatKey,
  statView: StatView,
): string => {
  const total = career.stats[statKey];

  if (statView === "totals") {
    return formatNumber(total);
  }

  return career.games > 0 ? formatOneDecimal(total / career.games) : EMPTY_STAT;
};

const getRowStatCells = (
  row: NormalizedSeasonRow,
  statView: StatView,
): StatCell[] => {
  const formatStat = (statKey: CountingStatKey) =>
    formatCountingStat(row.stats[statKey], row.games, statView);

  return [
    {
      key: "games",
      value: formatNumber(row.games),
    },
    {
      key: "goals",
      value: formatStat("goals"),
    },
    {
      key: "assists",
      value: formatStat("assists"),
    },
    {
      key: "points",
      value: formatStat("points"),
    },
    {
      key: "plusMinus",
      value: formatStat("plusMinus"),
    },
    {
      key: "penaltyMinutes",
      value: formatStat("penaltyMinutes"),
    },
    {
      key: "shootoutGoals",
      value: formatStat("shootoutGoals"),
    },
    {
      key: "shootingPct",
      value: formatPercent(row.shootingPct),
    },
    {
      key: "powerPlayGoals",
      value: formatStat("powerPlayGoals"),
    },
    {
      key: "powerPlayAssists",
      value: formatStat("powerPlayAssists"),
    },
    {
      key: "shortHandedGoals",
      value: formatStat("shortHandedGoals"),
    },
    {
      key: "shortHandedAssists",
      value: formatStat("shortHandedAssists"),
    },
    {
      key: "gameWinningGoals",
      value: formatStat("gameWinningGoals"),
    },
    {
      key: "timeOnIcePerGame",
      value: formatClockValue(row.timeOnIcePerGame),
    },
    {
      key: "production",
      value: formatClockValue(row.production),
    },
  ];
};

const getCareerStatCells = (
  career: CareerStats,
  statView: StatView,
): StatCell[] => {
  const formatStat = (statKey: CountingStatKey) =>
    formatCareerCountingStat(career, statKey, statView);

  return [
    {
      key: "games",
      value: formatNumber(career.games),
    },
    {
      key: "goals",
      value: formatStat("goals"),
    },
    {
      key: "assists",
      value: formatStat("assists"),
    },
    {
      key: "points",
      value: formatStat("points"),
    },
    {
      key: "plusMinus",
      value: formatStat("plusMinus"),
    },
    {
      key: "penaltyMinutes",
      value: formatStat("penaltyMinutes"),
    },
    {
      key: "shootoutGoals",
      value: formatStat("shootoutGoals"),
    },
    {
      key: "shootingPct",
      value: formatPercent(career.shootingPct),
    },
    {
      key: "powerPlayGoals",
      value: formatStat("powerPlayGoals"),
    },
    {
      key: "powerPlayAssists",
      value: formatStat("powerPlayAssists"),
    },
    {
      key: "shortHandedGoals",
      value: formatStat("shortHandedGoals"),
    },
    {
      key: "shortHandedAssists",
      value: formatStat("shortHandedAssists"),
    },
    {
      key: "gameWinningGoals",
      value: formatStat("gameWinningGoals"),
    },
    {
      key: "timeOnIcePerGame",
      value: formatClockValue(career.timeOnIcePerGame),
    },
    {
      key: "production",
      value: formatClockValue(career.production),
    },
  ];
};

export default function PlayerStatTable({ seasons, loading, error }: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = statsTableStyles(isDark);
  const global = globalStyles(isDark);
  const [statView, setStatView] = useState<StatView>("totals");

  const [selectedSeasonType, setSelectedSeasonType] =
    useState<SeasonType>("regularseason");

  const normalizedRows = useMemo(() => normalizeStatsData(seasons), [seasons]);

  const filteredRows = useMemo(() => {
    const rowsForSeasonType = normalizedRows.filter(
      (row) => row.seasonType === selectedSeasonType,
    );

    if (selectedSeasonType === "postseason") {
      return rowsForSeasonType.filter(hasUsableRowStats);
    }

    return rowsForSeasonType;
  }, [normalizedRows, selectedSeasonType]);

  const bestRowKey = useMemo(() => {
    let bestRow: string | null = null;
    let bestPointsPerGame = Number.NEGATIVE_INFINITY;

    filteredRows.forEach((row) => {
      const pointsPerGame = averageFromTotals(row.stats.points, row.games);

      if (pointsPerGame !== null && pointsPerGame > bestPointsPerGame) {
        bestPointsPerGame = pointsPerGame;
        bestRow = row.rowKey;
      }
    });

    return bestRow;
  }, [filteredRows]);

  const career = useMemo(
    () => calculateCareerStats(filteredRows),
    [filteredRows],
  );

  const isPostseasonSelected = selectedSeasonType === "postseason";

  const emptyText = isPostseasonSelected
    ? "Stats not available"
    : "No stats available";

  const getDataRowStyle = (row: NormalizedSeasonRow, index: number) => {
    const zebraStyle =
      index % 2 === 1
        ? isDark
          ? styles.rowAltDark
          : styles.rowAltLight
        : null;

    const highlightStyle = row.rowKey === bestRowKey ? styles.best : null;

    return [styles.row, zebraStyle, highlightStyle];
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
          />
        ) : null}
      </View>

      <PillTabs
        tabs={SEASON_TYPE_OPTIONS}
        selectedValue={selectedSeasonType}
        onChange={setSelectedSeasonType}
      />
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
    return (
      <View style={global.emptyContainer}>
        <Text style={global.emptyText}>No stats available</Text>
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
                      {getRowDisplaySeason(row, true)}
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
                      {row.team || EMPTY_STAT}
                    </Text>
                  </View>
                ))}

                <View style={[styles.row, styles.careerRow, styles.lastRow]}>
                  <Text style={styles.fixedCareerCell}> </Text>
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

            {chunk(NHL_STAT_GLOSSARY, 2).map((glossaryRow, rowIndex) => {
              const isAlternateRow = rowIndex % 2 === 1;

              return (
                <View
                  key={`glossary-row-${rowIndex}`}
                  style={styles.glossaryRow}
                >
                  {glossaryRow.map((item, columnIndex) => (
                    <View
                      key={item.abbr}
                      style={[
                        styles.glossaryCell,
                        isAlternateRow && styles.glossaryCellAlt,
                        columnIndex === 0 && styles.glossaryCellWithRightBorder,
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
