import PillTabs from "@/components/TabBars/PillTabs";
import { getCBTeam } from "@/constants/teamsCB";
import { getMLBTeamByEspnId } from "@/constants/teamsMLB";
import type {
  BaseballPlayerSeason,
  Category,
  Stat,
} from "@/hooks/BaseballHooks/usePlayerSeasons";
import Dropdown from "components/Dropdown";
import HeadingTwo from "components/Headings/HeadingTwo";
import PlayerStatTableSkeleton from "components/Skeletons/PlayerStatsTableSkeleton";
import { globalStyles } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { statsTableStyles } from "styles/PlayerStyles/StatsTableStyles";

type StatTableProps = {
  data: BaseballPlayerSeason[];
  loading?: boolean;
  error?: string | null;
  position?: string | null;
  league: "MLB" | "CB" | "SB";
};

type SeasonTypeTab = "regular" | "postseason";

const SEASON_TYPE_TABS: { label: string; value: SeasonTypeTab }[] = [
  { label: "Regular Season", value: "regular" },
  { label: "Postseason", value: "postseason" },
];

const GROUP_ORDER = [
  "batting",
  "pitching",
  "fielding",
  "postseason-batting",
  "postseason-pitching",
  "postseason-fielding",
  "career-batting",
  "career-pitching",
  "career-fielding",
  "advanced-batting",
  "expanded-batting",
  "advanced-pitching",
  "expanded-pitching",
  "expanded-fielding",
  "baserunning",
];

const GROUP_DISPLAY_NAMES: Record<string, string> = {
  "career-batting": "Batting",
  "postseason-batting": "Postseason Batting",
  "advanced-batting": "Advanced Batting",
  "expanded-batting": "Expanded Batting",

  "career-pitching": "Pitching",
  "postseason-pitching": "Postseason Pitching",
  "advanced-pitching": "Advanced Pitching",
  "expanded-pitching": "Expanded Pitching",

  "career-fielding": "Fielding",
  "postseason-fielding": "Postseason Fielding",
  fielding: "Fielding",
  "expanded-fielding": "Expanded Fielding",

  batting: "Batting",
  pitching: "Pitching",
  baserunning: "Baserunning",
};

const STAT_LABELS: Record<string, string> = {
  gamesPlayed: "GP",
  gamesStarted: "GS",

  OPS: "OPS",
  ops: "OPS",
  avg: "AVG",
  battingAverage: "AVG",
  RBIs: "RBI",
  rbi: "RBI",
  runsBattedIn: "RBI",
  hits: "H",
  runs: "R",
  WARBR: "WAR",
  offWARBR: "oWAR",
  walks: "BB",
  baseOnBalls: "BB",
  atBats: "AB",
  doubles: "2B",
  triples: "3B",
  homeRuns: "HR",
  slugAvg: "SLG",
  sluggingPercentage: "SLG",
  onBasePct: "OBP",
  onBasePercentage: "OBP",
  onBasePlusSlugging: "OPS",
  hitByPitch: "HBP",
  strikeouts: "SO",
  stolenBases: "SB",
  caughtStealing: "CS",

  wildPitches: "WP",
  avgGame: "WP",
  avgGameScore: "GSC",
  completeGames: "CG",
  qualityStarts: "QS",
  pitchesPerStart: "P/S",
  pitchesPerInning: "P/I",
  inheritedRunners: "IR",
  inheritedRunnersScored: "IRS",
  strikeoutsPerNineInnings: "K/9",
  flyBalls: "FB",
  shutouts: "SHO",
  runSupport: "RSUP",

  groundBalls: "GB",
  runsCreated: "RC",
  secondaryAvg: "SecA",
  isolatedPower: "ISO",
  atBatsPerHomeRun: "AB/HR",
  groundToFlyRatio: "GB/FB",
  runsCreatedPer27Outs: "RC/27",
  walkToStrikeoutRatio: "BB/K",
  walksPerPlateAppearance: "BB/PA",

  GIDPs: "GIDP",
  pitches: "P",
  sacHits: "SH",
  sacFlies: "SF",
  totalBases: "TB",
  extraBaseHits: "XBH",
  stolenBasePct: "SB%",
  intentionalWalks: "IBB",
  plateAppearances: "PA",
  pitchesPerPlateAppearance: "P/PA",

  ERA: "ERA",
  era: "ERA",
  earnedRunAverage: "ERA",
  WHIP: "WHIP",
  whip: "WHIP",
  wins: "W",
  losses: "L",
  winPct: "WIN%",
  holds: "HLD",
  saves: "SV",
  innings: "IP",
  inningsPitched: "IP",
  blownSaves: "BS",
  earnedRuns: "ER",
  runsAllowed: "R Allowed",
  hitsAllowed: "H Allowed",
  homeRunsAllowed: "HR Allowed",
  walksAllowed: "BB Allowed",
  strikeoutsPitching: "SO",
  battersFaced: "BF",
  pitchesThrown: "NP",
  strikeoutToWalkRatio: "K/BB",

  putouts: "PO",
  assists: "A",
  errors: "E",
  fieldingPercentage: "FLD%",
  doublePlays: "DP",
  chances: "TC",
};

const STAT_DISPLAY_NAMES: Record<string, string> = {
  gamesPlayed: "Games Played",
  gamesStarted: "Games Started",

  OPS: "On-base Plus Slugging",
  ops: "On-base Plus Slugging",
  avg: "Batting Average",
  battingAverage: "Batting Average",
  RBIs: "Runs Batted In",
  rbi: "Runs Batted In",
  runsBattedIn: "Runs Batted In",
  hits: "Hits",
  runs: "Runs",
  WARBR: "Wins Above Replacement",
  offWARBR: "Offensive Wins Above Replacement",
  walks: "Walks",
  baseOnBalls: "Walks",
  atBats: "At Bats",
  doubles: "Doubles",
  triples: "Triples",
  homeRuns: "Home Runs",
  slugAvg: "Slugging Percentage",
  sluggingPercentage: "Slugging Percentage",
  onBasePct: "On-base Percentage",
  onBasePercentage: "On-base Percentage",
  onBasePlusSlugging: "On-base Plus Slugging",
  hitByPitch: "Hit By Pitch",
  strikeouts: "Strikeouts",
  stolenBases: "Stolen Bases",
  caughtStealing: "Caught Stealing",

  flyBalls: "Fly Balls",
  groundBalls: "Ground Balls",
  runsCreated: "Runs Created",
  secondaryAvg: "Secondary Average",
  isolatedPower: "Isolated Power",
  atBatsPerHomeRun: "At Bats Per Home Run",
  groundToFlyRatio: "Ground Ball To Fly Ball Ratio",
  runsCreatedPer27Outs: "Runs Created Per 27 Outs",
  walkToStrikeoutRatio: "Walk To Strikeout Ratio",
  walksPerPlateAppearance: "Walks Per Plate Appearance",

  GIDPs: "Grounded Into Double Plays",
  pitches: "Pitches",
  sacHits: "Sacrifice Hits",
  sacFlies: "Sacrifice Flies",
  totalBases: "Total Bases",
  extraBaseHits: "Extra Base Hits",
  stolenBasePct: "Stolen Base Percentage",
  intentionalWalks: "Intentional Walks",
  plateAppearances: "Plate Appearances",
  pitchesPerPlateAppearance: "Pitches Per Plate Appearance",

  ERA: "Earned Run Average",
  era: "Earned Run Average",
  earnedRunAverage: "Earned Run Average",
  WHIP: "Walks And Hits Per Inning Pitched",
  whip: "Walks And Hits Per Inning Pitched",
  wins: "Wins",
  losses: "Losses",
  winPct: "Win Percentage",
  holds: "Holds",
  saves: "Saves",
  innings: "Innings Pitched",
  inningsPitched: "Innings Pitched",
  blownSaves: "Blown Saves",
  earnedRuns: "Earned Runs",
  runsAllowed: "Runs Allowed",
  hitsAllowed: "Hits Allowed",
  homeRunsAllowed: "Home Runs Allowed",
  walksAllowed: "Walks Allowed",
  strikeoutsPitching: "Pitching Strikeouts",
  battersFaced: "Batters Faced",
  pitchesThrown: "Pitches Thrown",
  strikeoutToWalkRatio: "Strikeout To Walk Ratio",

  putouts: "Putouts",
  assists: "Assists",
  errors: "Errors",
  fieldingPercentage: "Fielding Percentage",
  doublePlays: "Double Plays",
  chances: "Total Chances",
};

const defaultStatKeys: Record<string, string[]> = {
  "career-batting": [
    "OPS",
    "avg",
    "RBIs",
    "hits",
    "runs",
    "WARBR",
    "walks",
    "atBats",
    "doubles",
    "slugAvg",
    "triples",
    "homeRuns",
    "onBasePct",
    "hitByPitch",
    "strikeouts",
    "gamesPlayed",
    "stolenBases",
    "caughtStealing",
  ],
  "postseason-batting": [
    "OPS",
    "avg",
    "RBIs",
    "hits",
    "runs",
    "walks",
    "atBats",
    "doubles",
    "slugAvg",
    "triples",
    "homeRuns",
    "onBasePct",
    "hitByPitch",
    "strikeouts",
    "gamesPlayed",
    "stolenBases",
    "caughtStealing",
  ],
  "advanced-batting": [
    "WARBR",
    "offWARBR",
    "runsCreated",
    "secondaryAvg",
    "isolatedPower",
    "atBatsPerHomeRun",
    "groundToFlyRatio",
    "runsCreatedPer27Outs",
    "walkToStrikeoutRatio",
    "walksPerPlateAppearance",
    "flyBalls",
    "groundBalls",
  ],
  "expanded-batting": [
    "plateAppearances",
    "totalBases",
    "extraBaseHits",
    "GIDPs",
    "sacHits",
    "sacFlies",
    "hitByPitch",
    "stolenBases",
    "stolenBasePct",
    "caughtStealing",
    "intentionalWalks",
    "pitches",
    "pitchesPerPlateAppearance",
  ],
  "career-pitching": [
    "ERA",
    "WHIP",
    "wins",
    "losses",
    "winPct",
    "holds",
    "saves",
    "innings",
    "hits",
    "runs",
    "earnedRuns",
    "walks",
    "strikeouts",
    "gamesPlayed",
    "gamesStarted",
    "blownSaves",
    "strikeoutToWalkRatio",
    "WARBR",
  ],
  "postseason-pitching": [
    "ERA",
    "WHIP",
    "wins",
    "losses",
    "holds",
    "saves",
    "innings",
    "hits",
    "runs",
    "earnedRuns",
    "walks",
    "strikeouts",
    "gamesPlayed",
    "gamesStarted",
    "blownSaves",
    "strikeoutToWalkRatio",
  ],
};

const RATE_STAT_KEYS = new Set([
  "OPS",
  "ops",
  "avg",
  "battingAverage",
  "slugAvg",
  "sluggingPercentage",
  "onBasePct",
  "onBasePercentage",
  "onBasePlusSlugging",
  "stolenBasePct",
  "ERA",
  "era",
  "earnedRunAverage",
  "WHIP",
  "whip",
  "winPct",
  "fieldingPercentage",
  "secondaryAvg",
  "isolatedPower",
  "groundToFlyRatio",
  "runsCreatedPer27Outs",
  "walkToStrikeoutRatio",
  "walksPerPlateAppearance",
  "atBatsPerHomeRun",
  "pitchesPerPlateAppearance",
  "strikeoutToWalkRatio",
]);

const LOWER_IS_BETTER_STAT_KEYS = new Set([
  "ERA",
  "era",
  "earnedRunAverage",
  "WHIP",
  "whip",
]);

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];

  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }

  return out;
};

function parseNumber(value?: string | number | null) {
  if (value === null || value === undefined || value === "" || value === "-") {
    return null;
  }

  const parsed = Number(String(value).replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : null;
}

function parseMadeAttemptValue(value?: string | null) {
  if (!value) return null;

  const match = String(value)
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)$/);

  if (!match) return null;

  const made = Number(match[1]);
  const attempted = Number(match[2]);

  if (!Number.isFinite(made) || !Number.isFinite(attempted)) {
    return null;
  }

  return {
    made,
    attempted,
  };
}

function parseInningsOuts(value?: string | number | null) {
  if (value === null || value === undefined || value === "" || value === "-") {
    return null;
  }

  const [wholePart, decimalPart = "0"] = String(value).split(".");
  const whole = Number(wholePart);
  const outs = Number(decimalPart.charAt(0) || 0);

  if (!Number.isFinite(whole) || !Number.isFinite(outs) || outs > 2) {
    return null;
  }

  return whole * 3 + outs;
}

function formatInningsOuts(totalOuts: number) {
  const innings = Math.floor(totalOuts / 3);
  const outs = totalOuts % 3;

  return outs === 0 ? String(innings) : `${innings}.${outs}`;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatStatName(statName: string) {
  return statName
    .replace(/_/g, " ")
    .replace(/-/g, " - ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatLabel(stat?: Stat, key?: string) {
  if (!key) return "";

  return STAT_LABELS[key] || stat?.label || formatStatName(key);
}

function getStatDisplayName(stat?: Stat, key?: string) {
  if (!key) return "";

  return (
    STAT_DISPLAY_NAMES[key] ||
    stat?.description ||
    stat?.displayName ||
    formatStatName(key)
  );
}

function getGroupDisplayName(category?: Category | null, key?: string) {
  if (!key) return "";

  return (
    GROUP_DISPLAY_NAMES[key] ||
    category?.displayName ||
    formatStatName(key)
  ).replace(/^Career\s+-?\s*/i, "");
}

function normalizeSeasonTypeTab(seasonType?: string | number | null) {
  const normalized = String(seasonType || "")
    .replace(/[\s_-]/g, "")
    .toLowerCase();

  if (
    normalized === "postseason" ||
    normalized === "playoffs" ||
    normalized === "playoff" ||
    normalized === "3"
  ) {
    return "postseason";
  }

  return "regular";
}

function getNormalizedSeasonType(season: BaseballPlayerSeason) {
  return normalizeSeasonTypeTab(
    season.seasonTypeValue || season.seasonTypeLabel || season.seasonType,
  );
}

function getSeasonTypeRank(season: BaseballPlayerSeason) {
  return getNormalizedSeasonType(season) === "postseason" ? 1 : 0;
}

function getSeasonTeamCode(
  season: BaseballPlayerSeason,
  league: "MLB" | "CB" | "SB",
) {
  const teamId = Number(season.teamId);

  if (!Number.isFinite(teamId)) {
    return "—";
  }

  if (league === "MLB") {
    const team = getMLBTeamByEspnId(teamId);
    return team?.code || "—";
  }

  if (league === "CB") {
    const team = getCBTeam(teamId);
    return team?.code || "—";
  }

  return season.teamSlug
    ? season.teamSlug
        .split("-")
        .map((part) => part[0])
        .join("")
        .slice(0, 4)
        .toUpperCase()
    : String(teamId);
}

function getSeasonLabel(
  season: BaseballPlayerSeason,
  showSeasonTypeSuffix = true,
) {
  const displaySeason = season.displaySeason || season.year || season.season;

  if (
    showSeasonTypeSuffix &&
    getNormalizedSeasonType(season) === "postseason"
  ) {
    return `${displaySeason} POST`;
  }

  return String(displaySeason);
}

function getRowId(season: BaseballPlayerSeason, index: number) {
  return [
    season.id,
    season.season,
    season.teamId,
    season.seasonType,
    index,
  ].join("-");
}

function getDisplayValue(stat?: Stat) {
  if (!stat || stat.displayValue === null || stat.displayValue === undefined) {
    return "—";
  }

  if (stat.displayValue === "") {
    return "—";
  }

  return stat.displayValue;
}

function getNumericValue(stat?: Stat) {
  if (!stat) return null;

  if (typeof stat.value === "number" && Number.isFinite(stat.value)) {
    return stat.value;
  }

  return parseNumber(stat.displayValue);
}

function isRateStat(key: string) {
  return (
    RATE_STAT_KEYS.has(key) ||
    /pct|percentage|avg|average|rating|ratio|per|qbr|era|whip/i.test(key)
  );
}

function isMaxStat(key: string) {
  return /long/i.test(key);
}

function isInningsStat(key: string) {
  return key === "innings" || key === "inningsPitched";
}

function isLowerBetterStat(key: string) {
  return LOWER_IS_BETTER_STAT_KEYS.has(key);
}

function isPostseasonCategory(categoryName: string) {
  return categoryName.startsWith("postseason-");
}

function hasPostseasonStats(season: BaseballPlayerSeason) {
  return (season.categories || []).some(
    (category) =>
      isPostseasonCategory(category.name) && category.stats.length > 0,
  );
}

function shouldSkipCategoryForSeasonType(
  category: Category,
  selectedSeasonType: SeasonTypeTab | null,
) {
  if (selectedSeasonType === "regular") {
    return isPostseasonCategory(category.name);
  }

  if (selectedSeasonType === "postseason") {
    return !isPostseasonCategory(category.name);
  }

  return false;
}

function getFilteredCategories(
  season: BaseballPlayerSeason,
  selectedSeasonType: SeasonTypeTab | null,
) {
  const categories = season.categories || [];

  return categories.filter((category) => {
    if (!category?.stats?.length) {
      return false;
    }

    return !shouldSkipCategoryForSeasonType(category, selectedSeasonType);
  });
}

function getGroupRank(groupName: string) {
  const index = GROUP_ORDER.indexOf(groupName);

  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function sortGroupNames(a: string, b: string) {
  const rankDiff = getGroupRank(a) - getGroupRank(b);

  if (rankDiff !== 0) {
    return rankDiff;
  }

  return a.localeCompare(b);
}

function formatCareerValue(key: string, displayValues: string[]) {
  const cleanedValues = displayValues.filter(
    (value) =>
      value !== null && value !== undefined && value !== "" && value !== "—",
  );

  if (cleanedValues.length === 0) {
    return "—";
  }

  const madeAttemptValues = cleanedValues
    .map(parseMadeAttemptValue)
    .filter(Boolean) as { made: number; attempted: number }[];

  if (madeAttemptValues.length === cleanedValues.length) {
    const made = madeAttemptValues.reduce((sum, value) => sum + value.made, 0);
    const attempted = madeAttemptValues.reduce(
      (sum, value) => sum + value.attempted,
      0,
    );

    return `${formatNumber(made)}-${formatNumber(attempted)}`;
  }

  if (isInningsStat(key)) {
    const totalOuts = cleanedValues
      .map(parseInningsOuts)
      .filter((value): value is number => value !== null)
      .reduce((sum, value) => sum + value, 0);

    return totalOuts > 0 ? formatInningsOuts(totalOuts) : "—";
  }

  if (isRateStat(key)) {
    return "—";
  }

  const numericValues = cleanedValues
    .map(parseNumber)
    .filter((value): value is number => value !== null);

  if (numericValues.length === 0) {
    return "—";
  }

  if (isMaxStat(key)) {
    return formatNumber(Math.max(...numericValues));
  }

  const total = numericValues.reduce((sum, value) => sum + value, 0);

  return formatNumber(total);
}

export default function PlayerStatTable({
  data,
  loading = false,
  error = null,
  league,
}: StatTableProps) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = statsTableStyles(isDark);
  const global = globalStyles(isDark);

  const showSeasonTypeTabs = league === "MLB";

  const [selectedSeasonType, setSelectedSeasonType] =
    useState<SeasonTypeTab>("regular");

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (b.season !== a.season) {
        return b.season - a.season;
      }

      const seasonTypeCompare = getSeasonTypeRank(a) - getSeasonTypeRank(b);

      if (seasonTypeCompare !== 0) {
        return seasonTypeCompare;
      }

      return String(a.teamId).localeCompare(String(b.teamId));
    });
  }, [data]);

  const visibleData = useMemo(() => {
    if (!showSeasonTypeTabs) {
      return sortedData;
    }

    if (selectedSeasonType === "postseason") {
      return sortedData.filter(
        (season) =>
          getNormalizedSeasonType(season) === "postseason" &&
          hasPostseasonStats(season),
      );
    }

    return sortedData.filter(
      (season) => getNormalizedSeasonType(season) === "regular",
    );
  }, [selectedSeasonType, showSeasonTypeTabs, sortedData]);

  const seasonTypeContext = showSeasonTypeTabs ? selectedSeasonType : null;

  const availableGroups = useMemo(() => {
    const groupsByName = new Map<string, Category>();

    visibleData.forEach((season) => {
      getFilteredCategories(season, seasonTypeContext).forEach((category) => {
        if (!groupsByName.has(category.name)) {
          groupsByName.set(category.name, category);
        }
      });
    });

    return Array.from(groupsByName.values()).sort((a, b) =>
      sortGroupNames(a.name, b.name),
    );
  }, [seasonTypeContext, visibleData]);

  const [selectedGroup, setSelectedGroup] = useState<string>("");

  useEffect(() => {
    if (!availableGroups.length) {
      setSelectedGroup("");
      return;
    }

    const availableGroupNames = availableGroups.map((group) => group.name);

    if (!selectedGroup || !availableGroupNames.includes(selectedGroup)) {
      setSelectedGroup(availableGroups[0].name);
    }
  }, [availableGroups, selectedGroup]);

  const activeGroup = selectedGroup || availableGroups[0]?.name;

  const seasonsWithGroup = useMemo(() => {
    return visibleData.map((season, index) => {
      const category = getFilteredCategories(season, seasonTypeContext).find(
        (item) => item.name === activeGroup,
      );

      return {
        id: getRowId(season, index),
        season,
        year: getSeasonLabel(season, !showSeasonTypeTabs),
        seasonNumber: season.season,
        teamId: season.teamId,
        teamCode: getSeasonTeamCode(season, league),
        seasonType: season.seasonType,
        stats: category?.stats || [],
      };
    });
  }, [activeGroup, league, seasonTypeContext, showSeasonTypeTabs, visibleData]);

  const statKeys = useMemo(() => {
    const actualKeys = new Set<string>();

    seasonsWithGroup.forEach((season) => {
      season.stats.forEach((stat) => {
        if (stat?.name) {
          actualKeys.add(stat.name);
        }
      });
    });

    const preferredKeys = activeGroup ? defaultStatKeys[activeGroup] || [] : [];
    const orderedKeys = preferredKeys.filter((key) => actualKeys.has(key));

    const extraKeys = Array.from(actualKeys).filter(
      (key) => !orderedKeys.includes(key),
    );

    return [...orderedKeys, ...extraKeys];
  }, [activeGroup, seasonsWithGroup]);

  const allStats = useMemo(() => {
    return seasonsWithGroup.flatMap((season) => season.stats);
  }, [seasonsWithGroup]);

  const careerDisplayValues = useMemo(() => {
    const values: Record<string, string[]> = {};

    statKeys.forEach((key) => {
      values[key] = seasonsWithGroup
        .map((season) => season.stats.find((stat) => stat.name === key))
        .filter(Boolean)
        .map((stat) => getDisplayValue(stat));
    });

    return values;
  }, [seasonsWithGroup, statKeys]);

  const bestRowId = useMemo(() => {
    const primaryKey = statKeys[0];

    if (!primaryKey) return null;

    let bestId: string | null = null;
    let bestValue = isLowerBetterStat(primaryKey)
      ? Number.POSITIVE_INFINITY
      : Number.NEGATIVE_INFINITY;

    seasonsWithGroup.forEach((season) => {
      const stat = season.stats.find((item) => item.name === primaryKey);
      const value = getNumericValue(stat);

      if (value === null) return;

      const isBetter = isLowerBetterStat(primaryKey)
        ? value < bestValue
        : value > bestValue;

      if (isBetter) {
        bestValue = value;
        bestId = season.id;
      }
    });

    if (isLowerBetterStat(primaryKey)) {
      return Number.isFinite(bestValue) ? bestId : null;
    }

    return bestValue > 0 ? bestId : null;
  }, [seasonsWithGroup, statKeys]);

  const emptyText =
    showSeasonTypeTabs && selectedSeasonType === "postseason"
      ? "Stats not available"
      : "No stats available";

  const shouldShowCategoryDropdown =
    visibleData.length > 0 && availableGroups.length > 0 && statKeys.length > 0;

  const renderHeader = () => (
    <>
      <View style={styles.statsHeader}>
        <HeadingTwo isDark={isDark}>Career Stats</HeadingTwo>

        {shouldShowCategoryDropdown ? (
          <Dropdown
            options={availableGroups.map((group) => ({
              label: getGroupDisplayName(group, group.name).replace(
                /^Postseason\s+/i,
                selectedSeasonType === "postseason" ? "" : "Postseason ",
              ),
              value: group.name,
            }))}
            selectedValue={activeGroup}
            onSelect={setSelectedGroup}
            isDark={isDark}
            style={styles.dropdown}
          />
        ) : null}
      </View>

      {showSeasonTypeTabs ? (
        <PillTabs
          tabs={SEASON_TYPE_TABS}
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
    return <Text style={global.errorText}>{error}</Text>;
  }

  if (!sortedData.length) {
    return <Text style={global.emptyText}>No stats available</Text>;
  }

  if (!visibleData.length) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <Text style={global.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  if (!activeGroup || statKeys.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <Text style={global.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <View style={styles.tableWrapper}>
        <View style={styles.seasonColumn}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.fixedCell, styles.fixedHeaderCell]}>
              SEASON
            </Text>
          </View>

          {seasonsWithGroup.map((season, index) => {
            const zebra =
              index % 2 === 1
                ? isDark
                  ? styles.rowAltDark
                  : styles.rowAltLight
                : null;

            const highlight = season.id === bestRowId ? styles.best : null;

            return (
              <View key={season.id} style={[styles.row, zebra, highlight]}>
                <Text style={styles.fixedCell}>{season.year}</Text>
              </View>
            );
          })}

          <View style={[styles.row, styles.careerRow]}>
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
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.fixedTeamCell, styles.fixedHeaderCell]}>
              TEAM
            </Text>
          </View>

          {seasonsWithGroup.map((season, index) => {
            const zebra =
              index % 2 === 1
                ? isDark
                  ? styles.rowAltDark
                  : styles.rowAltLight
                : null;

            const highlight = season.id === bestRowId ? styles.best : null;

            return (
              <View
                key={`${season.id}-team`}
                style={[styles.row, zebra, highlight]}
              >
                <Text style={styles.fixedTeamCell}>{season.teamCode}</Text>
              </View>
            );
          })}

          <View style={[styles.row, styles.careerRow]}>
            <Text style={styles.fixedCareerCell}></Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollSection}
          contentContainerStyle={styles.scrollContentContainer}
        >
          <View style={styles.statScrollContent}>
            <View style={[styles.row, styles.headerRow]}>
              {statKeys.map((key) => {
                const stat = allStats.find((item) => item.name === key);

                return (
                  <Text key={key} style={[styles.cell, styles.headerCell]}>
                    {getStatLabel(stat, key)}
                  </Text>
                );
              })}
            </View>

            {seasonsWithGroup.map((season, index) => {
              const zebra =
                index % 2 === 1
                  ? isDark
                    ? styles.rowAltDark
                    : styles.rowAltLight
                  : null;

              const highlight = season.id === bestRowId ? styles.best : null;

              return (
                <View
                  key={`${season.id}-stats`}
                  style={[styles.row, zebra, highlight]}
                >
                  {statKeys.map((key) => {
                    const stat = season.stats.find((item) => item.name === key);

                    return (
                      <Text key={key} style={styles.cell}>
                        {getDisplayValue(stat)}
                      </Text>
                    );
                  })}
                </View>
              );
            })}

            <View style={[styles.row, styles.careerRow]}>
              {statKeys.map((key) => {
                const display = formatCareerValue(
                  key,
                  careerDisplayValues[key] || [],
                );

                return (
                  <Text key={key} style={styles.careerCell}>
                    {display}
                  </Text>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.glossaryContainer}>
        <Text style={styles.headerName}>Stat Glossary</Text>

        {chunk(statKeys, 2).map((row, rowIdx) => (
          <View key={rowIdx} style={styles.glossaryRow}>
            {row.map((key, colIdx) => {
              const isAlt = rowIdx % 2 === 1;
              const stat = allStats.find((item) => item.name === key);

              return (
                <View
                  key={key}
                  style={[
                    styles.glossaryCell,
                    isAlt && styles.glossaryCellAlt,
                    colIdx === 0 && styles.glossaryCellWithRightBorder,
                  ]}
                >
                  <Text style={styles.glossaryAbbr}>
                    {getStatLabel(stat, key)}{" "}
                    <Text style={styles.glossaryDisplayName}>
                      {getStatDisplayName(stat, key)}
                    </Text>
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
