import PillTabs from "@/components/TabBars/PillTabs";
import { getCFBTeamByESPNId } from "@/constants/teamsCFB";
import { getNFLTeamByESPNId } from "@/constants/teamsNFL";
import type {
  Category,
  FootballPlayerSeason,
  Stat,
} from "@/hooks/FootballHooks/usePlayerSeasons";
import { Dropdown } from "components/Dropdown";
import HeadingTwo from "components/Headings/HeadingTwo";
import PlayerStatTableSkeleton from "components/Skeletons/PlayerStatsTableSkeleton";
import { globalStyles } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { statsTableStyles } from "styles/PlayerStyles/StatsTableStyles";
type StatTableProps = {
  data: FootballPlayerSeason[];
  loading?: boolean;
  error?: string | null;
  position?: string | null;
  league: "nfl" | "cfb";
};

type SeasonTypeTab = "regular" | "postseason";

const SEASON_TYPE_TABS: { label: string; value: SeasonTypeTab }[] = [
  { label: "Regular Season", value: "regular" },
  { label: "Postseason", value: "postseason" },
];

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];

  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }

  return out;
};

const CATEGORY_ORDER = [
  "Passing",
  "Rushing",
  "Receiving",
  "Scoring",
  "Defense",
  "Defensive Interceptions",
  "Returns",
  "Kicking",
  "Punting",
  "Totals",
  "Averages",
  "General",
];

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  totals: "Totals",
  passing: "Passing",
  rushing: "Rushing",
  receiving: "Receiving",
  defensive: "Defense",
  defensiveInterceptions: "Defensive Interceptions",
  returning: "Returns",
  scoring: "Scoring",
  kicking: "Kicking",
  punting: "Punting",
  averages: "Averages",
  general: "General",
};

const STAT_LABELS: Record<string, string> = {
  gamesPlayed: "GP",

  passingYards: "YDS",
  passingTouchdowns: "TD",
  passingAttempts: "ATT",
  completions: "CMP",
  completionPct: "CMP%",
  interceptions: "INT",
  sacks: "SACK",
  longPassing: "LONG",
  yardsPerPassAttempt: "AVG",
  QBRating: "RTG",
  adjQBR: "QBR",

  rushingAttempts: "ATT",
  rushingYards: "YDS",
  yardsPerRushAttempt: "AVG",
  rushingTouchdowns: "TD",
  longRushing: "LONG",
  rushingFirstDowns: "1ST",
  rushingFumbles: "FUM",
  rushingFumblesLost: "LST",

  receptions: "REC",
  receivingTargets: "TGTS",
  receivingYards: "YDS",
  yardsPerReception: "AVG",
  receivingTouchdowns: "TD",
  longReception: "LONG",
  receivingFirstDowns: "1ST",
  receivingFumbles: "FUM",
  receivingFumblesLost: "LST",

  totalPoints: "PTS",
  totalTouchdowns: "TD",
  passingTouchdownsScoring: "PASS TD",
  rushingTouchdownsScoring: "RUSH TD",
  receivingTouchdownsScoring: "REC TD",
  returnTouchdowns: "RET TD",
  totalTwoPointConvs: "2PT",

  totalTackles: "TOT",
  soloTackles: "SOLO",
  assistTackles: "AST",
  stuffs: "STF",
  stuffYards: "STF YDS",
  fumblesForced: "FF",
  fumblesRecovered: "FR",
  passesDefended: "PD",
  kicksBlocked: "KB",
  interceptionYards: "INT YDS",
  interceptionTouchdowns: "INT TD",
  avgInterceptionYards: "INT AVG",
  longInterception: "LONG",

  fieldGoals: "FG",
  fieldGoalPct: "FG%",
  extraPointsMade: "XPM",
  extraPointAttempts: "XPA",
  kickExtraPoints: "XP",
  totalKickingPoints: "PTS",
  longFieldGoalMade: "LONG",
  "fieldGoalsMade-fieldGoalAttempts": "FGM-FGA",
  "fieldGoalsMade50-fieldGoalAttempts50": "50+",
  "fieldGoalsMade1_19-fieldGoalAttempts1_19": "1-19",
  "fieldGoalsMade20_29-fieldGoalAttempts20_29": "20-29",
  "fieldGoalsMade30_39-fieldGoalAttempts30_39": "30-39",
  "fieldGoalsMade40_49-fieldGoalAttempts40_49": "40-49",

  punts: "PUNTS",
  puntYards: "YDS",
  puntAvg: "AVG",
  longPunt: "LONG",
  puntsInside20: "IN20",
  puntTouchbacks: "TB",

  kickReturns: "KR",
  kickReturnYards: "KR YDS",
  longKickReturn: "KR LONG",
  puntReturns: "PR",
  puntReturnYards: "PR YDS",
  longPuntReturn: "PR LONG",
};

const STAT_DISPLAY_NAMES: Record<string, string> = {
  gamesPlayed: "Games Played",

  passingYards: "Passing Yards",
  passingTouchdowns: "Passing Touchdowns",
  passingAttempts: "Passing Attempts",
  completions: "Completions",
  completionPct: "Completion Percentage",
  interceptions: "Interceptions",
  sacks: "Sacks",
  longPassing: "Longest Pass",
  yardsPerPassAttempt: "Yards Per Pass Attempt",
  QBRating: "QB Rating",
  adjQBR: "Adjusted QBR",

  rushingAttempts: "Rushing Attempts",
  rushingYards: "Rushing Yards",
  yardsPerRushAttempt: "Yards Per Rush Attempt",
  rushingTouchdowns: "Rushing Touchdowns",
  longRushing: "Longest Rush",
  rushingFirstDowns: "Rushing First Downs",
  rushingFumbles: "Rushing Fumbles",
  rushingFumblesLost: "Rushing Fumbles Lost",

  receptions: "Receptions",
  receivingTargets: "Receiving Targets",
  receivingYards: "Receiving Yards",
  yardsPerReception: "Yards Per Reception",
  receivingTouchdowns: "Receiving Touchdowns",
  longReception: "Longest Reception",
  receivingFirstDowns: "Receiving First Downs",
  receivingFumbles: "Receiving Fumbles",
  receivingFumblesLost: "Receiving Fumbles Lost",

  totalPoints: "Total Points",
  totalTouchdowns: "Total Touchdowns",
  returnTouchdowns: "Return Touchdowns",
  totalTwoPointConvs: "Two-Point Conversions",

  totalTackles: "Total Tackles",
  soloTackles: "Solo Tackles",
  assistTackles: "Assisted Tackles",
  stuffs: "Stuffs",
  stuffYards: "Stuff Yards",
  fumblesForced: "Forced Fumbles",
  fumblesRecovered: "Fumbles Recovered",
  passesDefended: "Passes Defended",
  kicksBlocked: "Kicks Blocked",
  interceptionYards: "Interception Yards",
  interceptionTouchdowns: "Interception Touchdowns",
  avgInterceptionYards: "Average Interception Yards",
  longInterception: "Longest Interception",

  fieldGoals: "Field Goals",
  fieldGoalPct: "Field Goal Percentage",
  extraPointsMade: "Extra Points Made",
  extraPointAttempts: "Extra Point Attempts",
  kickExtraPoints: "Kick Extra Points",
  totalKickingPoints: "Total Kicking Points",
  longFieldGoalMade: "Longest Field Goal Made",
  "fieldGoalsMade-fieldGoalAttempts": "Field Goals Made-Attempted",
  "fieldGoalsMade50-fieldGoalAttempts50": "Field Goals Made-Attempted 50+",
  "fieldGoalsMade1_19-fieldGoalAttempts1_19": "Field Goals Made-Attempted 1-19",
  "fieldGoalsMade20_29-fieldGoalAttempts20_29":
    "Field Goals Made-Attempted 20-29",
  "fieldGoalsMade30_39-fieldGoalAttempts30_39":
    "Field Goals Made-Attempted 30-39",
  "fieldGoalsMade40_49-fieldGoalAttempts40_49":
    "Field Goals Made-Attempted 40-49",

  punts: "Punts",
  puntYards: "Punt Yards",
  puntAvg: "Punt Average",
  longPunt: "Longest Punt",
  puntsInside20: "Punts Inside 20",
  puntTouchbacks: "Punt Touchbacks",

  kickReturns: "Kick Returns",
  kickReturnYards: "Kick Return Yards",
  longKickReturn: "Longest Kick Return",
  puntReturns: "Punt Returns",
  puntReturnYards: "Punt Return Yards",
  longPuntReturn: "Longest Punt Return",
};

const defaultStatKeys: Record<string, string[]> = {
  Passing: [
    "gamesPlayed",
    "completions",
    "passingAttempts",
    "completionPct",
    "passingYards",
    "passingTouchdowns",
    "interceptions",
    "sacks",
    "QBRating",
    "adjQBR",
    "yardsPerPassAttempt",
    "longPassing",
  ],
  Rushing: [
    "gamesPlayed",
    "rushingAttempts",
    "rushingYards",
    "yardsPerRushAttempt",
    "rushingTouchdowns",
    "rushingFirstDowns",
    "longRushing",
    "rushingFumbles",
    "rushingFumblesLost",
  ],
  Receiving: [
    "gamesPlayed",
    "receptions",
    "receivingTargets",
    "receivingYards",
    "yardsPerReception",
    "receivingTouchdowns",
    "receivingFirstDowns",
    "longReception",
    "receivingFumbles",
    "receivingFumblesLost",
  ],
  Scoring: [
    "gamesPlayed",
    "totalPoints",
    "totalTouchdowns",
    "passingTouchdowns",
    "rushingTouchdowns",
    "receivingTouchdowns",
    "returnTouchdowns",
    "totalTwoPointConvs",
    "fieldGoals",
    "kickExtraPoints",
  ],
  Defense: [
    "gamesPlayed",
    "totalTackles",
    "soloTackles",
    "assistTackles",
    "sacks",
    "interceptions",
    "passesDefended",
    "fumblesForced",
    "fumblesRecovered",
    "stuffs",
    "stuffYards",
    "kicksBlocked",
  ],
  "Defensive Interceptions": [
    "interceptions",
    "interceptionYards",
    "avgInterceptionYards",
    "longInterception",
    "interceptionTouchdowns",
  ],
  Kicking: [
    "gamesPlayed",
    "fieldGoalsMade-fieldGoalAttempts",
    "fieldGoalPct",
    "extraPointsMade",
    "extraPointAttempts",
    "totalKickingPoints",
    "longFieldGoalMade",
    "fieldGoalsMade1_19-fieldGoalAttempts1_19",
    "fieldGoalsMade20_29-fieldGoalAttempts20_29",
    "fieldGoalsMade30_39-fieldGoalAttempts30_39",
    "fieldGoalsMade40_49-fieldGoalAttempts40_49",
    "fieldGoalsMade50-fieldGoalAttempts50",
  ],
  Punting: [
    "gamesPlayed",
    "punts",
    "puntYards",
    "puntAvg",
    "longPunt",
    "puntsInside20",
    "puntTouchbacks",
  ],
  Returns: [
    "gamesPlayed",
    "kickReturns",
    "kickReturnYards",
    "longKickReturn",
    "puntReturns",
    "puntReturnYards",
    "longPuntReturn",
    "returnTouchdowns",
  ],
  Totals: ["gamesPlayed", "totalTouchdowns", "totalPoints"],
  Averages: ["yardsPerPassAttempt", "yardsPerRushAttempt", "yardsPerReception"],
  General: ["gamesPlayed"],
};

function isRateStat(key: string) {
  return /pct|percentage|avg|average|rating|per|qbr/i.test(key);
}

function isMaxStat(key: string) {
  return /long/i.test(key);
}

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

  return STAT_DISPLAY_NAMES[key] || stat?.displayName || formatStatName(key);
}

function normalizeCategoryDisplayName(category: Category) {
  return (
    CATEGORY_DISPLAY_NAMES[category.name] ||
    category.displayName ||
    category.name
  );
}

function normalizeSeasonTypeTab(seasonType?: string | null): SeasonTypeTab {
  return seasonType === "postseason" ? "postseason" : "regular";
}

function getOrderedStatGroups(position?: string | null) {
  const base = CATEGORY_ORDER;

  if (!position) return base;

  const pos = position.toUpperCase();

  if (pos === "QB") {
    return [
      "Passing",
      "Rushing",
      "Scoring",
      "Totals",
      ...base.filter(
        (group) => !["Passing", "Rushing", "Scoring", "Totals"].includes(group),
      ),
    ];
  }

  if (pos === "RB") {
    return [
      "Rushing",
      "Receiving",
      "Returns",
      "Scoring",
      "Totals",
      ...base.filter(
        (group) =>
          !["Rushing", "Receiving", "Returns", "Scoring", "Totals"].includes(
            group,
          ),
      ),
    ];
  }

  if (["WR", "TE"].includes(pos)) {
    return [
      "Receiving",
      "Rushing",
      "Returns",
      "Scoring",
      "Totals",
      ...base.filter(
        (group) =>
          !["Receiving", "Rushing", "Returns", "Scoring", "Totals"].includes(
            group,
          ),
      ),
    ];
  }

  if (
    [
      "DB",
      "CB",
      "S",
      "FS",
      "SS",
      "LB",
      "DE",
      "DT",
      "DL",
      "OLB",
      "ILB",
    ].includes(pos)
  ) {
    return [
      "Defense",
      "Defensive Interceptions",
      "Totals",
      ...base.filter(
        (group) =>
          !["Defense", "Defensive Interceptions", "Totals"].includes(group),
      ),
    ];
  }

  if (pos === "K") {
    return [
      "Kicking",
      "Scoring",
      "Totals",
      ...base.filter(
        (group) => !["Kicking", "Scoring", "Totals"].includes(group),
      ),
    ];
  }

  if (pos === "P") {
    return [
      "Punting",
      "Totals",
      ...base.filter((group) => !["Punting", "Totals"].includes(group)),
    ];
  }

  return base;
}

function getSeasonTeamCode(
  season: FootballPlayerSeason,
  league: "nfl" | "cfb",
) {
  const teamId = Number(season.teamId);

  if (!Number.isFinite(teamId)) {
    return "—";
  }

  const team =
    league === "nfl" ? getNFLTeamByESPNId(teamId) : getCFBTeamByESPNId(teamId);

  return team?.code || "—";
}

function getSeasonTypeRank(seasonType?: string | null) {
  return seasonType === "postseason" ? 1 : 0;
}

function getSeasonLabel(
  season: FootballPlayerSeason,
  showSeasonTypeSuffix = true,
) {
  const displaySeason = season.displaySeason || season.year || season.season;

  if (showSeasonTypeSuffix && season.seasonType === "postseason") {
    return `${displaySeason} POST`;
  }

  return String(displaySeason);
}

function getRowId(season: FootballPlayerSeason, index: number) {
  return [
    season.id,
    season.season,
    season.teamId,
    season.seasonType,
    index,
  ].join("-");
}

function getDisplayValue(stat?: Stat) {
  if (!stat) return "—";

  if (
    stat.displayValue === null ||
    stat.displayValue === undefined ||
    stat.displayValue === ""
  ) {
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
  position,
  league,
}: StatTableProps) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = statsTableStyles(isDark);
  const global = globalStyles(isDark);

  const showSeasonTypeTabs = league === "nfl";

  const [selectedSeasonType, setSelectedSeasonType] =
    useState<SeasonTypeTab>("regular");

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (b.season !== a.season) {
        return b.season - a.season;
      }

      const seasonTypeCompare =
        getSeasonTypeRank(a.seasonType) - getSeasonTypeRank(b.seasonType);

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

    return sortedData.filter(
      (season) =>
        normalizeSeasonTypeTab(season.seasonType) === selectedSeasonType,
    );
  }, [selectedSeasonType, showSeasonTypeTabs, sortedData]);

  const availableGroups = useMemo(() => {
    const ordered = getOrderedStatGroups(position);
    const actualGroups = new Set<string>();

    visibleData.forEach((season) => {
      season.categories?.forEach((category) => {
        if (category?.stats?.length > 0) {
          actualGroups.add(normalizeCategoryDisplayName(category));
        }
      });
    });

    const orderedGroups = ordered.filter((group) => actualGroups.has(group));
    const extraGroups = Array.from(actualGroups).filter(
      (group) => !orderedGroups.includes(group),
    );

    return orderedGroups.length ? [...orderedGroups, ...extraGroups] : ordered;
  }, [visibleData, position]);

  const [selectedGroup, setSelectedGroup] = useState<string>("");

  useEffect(() => {
    if (!availableGroups.length) return;

    if (!selectedGroup || !availableGroups.includes(selectedGroup)) {
      setSelectedGroup(availableGroups[0]);
    }
  }, [availableGroups, selectedGroup]);

  const activeGroup = selectedGroup || availableGroups[0];

  const seasonsWithGroup = useMemo(() => {
    return visibleData.map((season, index) => {
      const category = season.categories?.find(
        (item) => normalizeCategoryDisplayName(item) === activeGroup,
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
  }, [visibleData, activeGroup, league, showSeasonTypeTabs]);

  const statKeys = useMemo(() => {
    const actualKeys = new Set<string>();

    seasonsWithGroup.forEach((season) => {
      season.stats.forEach((stat) => {
        if (stat?.name) {
          actualKeys.add(stat.name);
        }
      });
    });

    const preferredKeys = defaultStatKeys[activeGroup] || [];
    const orderedKeys = preferredKeys.filter((key) => actualKeys.has(key));

    const extraKeys = Array.from(actualKeys).filter(
      (key) => !orderedKeys.includes(key),
    );

    return [...orderedKeys, ...extraKeys];
  }, [seasonsWithGroup, activeGroup]);

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
    let max = Number.NEGATIVE_INFINITY;

    seasonsWithGroup.forEach((season) => {
      const stat = season.stats.find((item) => item.name === primaryKey);
      const value = getNumericValue(stat);

      if (value !== null && value > max) {
        max = value;
        bestId = season.id;
      }
    });

    return max > 0 ? bestId : null;
  }, [seasonsWithGroup, statKeys]);

  const emptyText =
    showSeasonTypeTabs && selectedSeasonType === "postseason"
      ? "No postseason stats available"
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
              label: group,
              value: group,
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

  if (!sortedData.length) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <Text style={global.emptyText}>No stats available</Text>
      </View>
    );
  }

  if (!visibleData.length) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <Text style={global.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  if (error) {
    return <Text style={global.errorText}>{error}</Text>;
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
