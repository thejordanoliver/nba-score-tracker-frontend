import PillTabs, { PillTabOption } from "@/components/TabBars/PillTabs";
import {
  FootballLeaderConfig,
  FootballPlayerStatTable,
  FootballRosterStatsPlayer,
  FootballRosterStatsProps,
  FootballRosterStatsResponse,
  FootballSeasonStats,
  FootballStatGroup,
  FootballStatPath,
  FootballStatValue,
  FootballTableColumn,
  STAT_TABS,
  StatDisplayCategory,
  StatRow,
  StatTab,
  TeamStats,
} from "@/types/football/stats";
import { formatStatValue } from "@/utils/stats";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import { Colors, activeOpacity, globalStyles } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { rosterStatsStyles } from "styles/TeamStyles/RosterStatStyles";

const STAT_TAB_OPTIONS = STAT_TABS.map(
  (tab): PillTabOption<StatTab> => ({
    label: tab,
    value: tab,
  }),
);

const formatValue = (value: number | undefined | null, suffix = "") => {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;

  return `${safeValue}${suffix}`;
};

const formatTime = (seconds: number | undefined | null) => {
  const safeSeconds = Number.isFinite(Number(seconds)) ? Number(seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = Math.floor(safeSeconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const createRow = (
  name: string,
  displayName: string,
  value: number,
  suffix = "",
): StatRow => ({
  name,
  displayName,
  value,
  displayValue: formatValue(value, suffix),
});

const parseStatNumber = (value: FootballStatValue) => {
  if (value === null || value === undefined || value === "") return 0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value).trim().replace(/,/g, "").replace(/%$/, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
};

const isStatGroup = (value: unknown): value is FootballStatGroup =>
  !!value && typeof value === "object" && !Array.isArray(value);

const hasStatValue = (value: FootballStatValue) =>
  value !== null && value !== undefined && value !== "";

const getPlayersFromRosterStats = (
  rosterStats:
    | FootballRosterStatsResponse
    | FootballRosterStatsPlayer[]
    | null
    | undefined,
) => {
  if (Array.isArray(rosterStats)) return rosterStats;

  return rosterStats?.players ?? [];
};

const getStatByPath = (
  stats: FootballSeasonStats | null | undefined,
  path: FootballStatPath,
): FootballStatValue => {
  const nestedGroup = stats?.stats?.[path.group];

  if (isStatGroup(nestedGroup)) {
    return nestedGroup[path.key];
  }

  const legacyGroup = stats?.[path.group];

  return isStatGroup(legacyGroup) ? legacyGroup[path.key] : undefined;
};

const getPlayerStatValue = (
  player: FootballRosterStatsPlayer,
  column: FootballTableColumn,
): FootballStatValue => {
  const paths = [column, ...(column.fallbacks ?? [])];

  for (const path of paths) {
    const value = getStatByPath(player.latestSeasonStats, path);

    if (hasStatValue(value)) {
      return value;
    }
  }

  return undefined;
};

const hasAnyStatForTable = (
  player: FootballRosterStatsPlayer,
  columns: FootballTableColumn[],
) => columns.some((column) => hasStatValue(getPlayerStatValue(player, column)));

const getPlayerName = (player: FootballRosterStatsPlayer) =>
  player.short_name ||
  player.full_name ||
  [player.first_name, player.last_name].filter(Boolean).join(" ") ||
  "Unknown Player";

const getPlayerKey = (player: FootballRosterStatsPlayer, index: number) =>
  String(player.playerId || player.player_id || player.id || index);

const getPlayerInitials = (player: FootballRosterStatsPlayer) => {
  const nameParts = getPlayerName(player).split(/\s+/).filter(Boolean);
  const initials = nameParts
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return initials || "?";
};

const LEADER_STATS: FootballLeaderConfig[] = [
  {
    label: "Passing",
    path: { group: "passing", key: "passingYards" },
  },
  {
    label: "Rushing",
    path: { group: "rushing", key: "rushingYards" },
  },
  {
    label: "Receiving",
    path: { group: "receiving", key: "receivingYards" },
  },
  {
    label: "Tackles",
    path: { group: "defensive", key: "totalTackles" },
  },
  {
    label: "Interceptions",
    path: { group: "defensive", key: "interceptions" },
  },
];

const PLAYER_STAT_TABLES: FootballPlayerStatTable[] = [
  {
    title: "Passing",
    columns: [
      { label: "CMP", group: "passing", key: "completions" },
      { label: "ATT", group: "passing", key: "passingAttempts" },
      { label: "CMP%", group: "passing", key: "completionPct" },
      { label: "YDS", group: "passing", key: "passingYards" },
      { label: "TD", group: "passing", key: "passingTouchdowns" },
      { label: "INT", group: "passing", key: "interceptions" },
      { label: "AVG", group: "passing", key: "yardsPerPassAttempt" },
      { label: "LNG", group: "passing", key: "longPassing" },
      { label: "SACK", group: "passing", key: "sacks" },
      { label: "RTG", group: "passing", key: "QBRating" },
    ],
  },
  {
    title: "Rushing",
    columns: [
      { label: "CAR", group: "rushing", key: "rushingAttempts" },
      { label: "YDS", group: "rushing", key: "rushingYards" },
      { label: "AVG", group: "rushing", key: "yardsPerRushAttempt" },
      { label: "TD", group: "rushing", key: "rushingTouchdowns" },
      { label: "LNG", group: "rushing", key: "longRushing" },
    ],
  },
  {
    title: "Receiving",
    columns: [
      { label: "REC", group: "receiving", key: "receptions" },
      { label: "YDS", group: "receiving", key: "receivingYards" },
      { label: "AVG", group: "receiving", key: "yardsPerReception" },
      { label: "TD", group: "receiving", key: "receivingTouchdowns" },
      { label: "LNG", group: "receiving", key: "longReception" },
    ],
  },
  {
    title: "Defense",
    columns: [
      { label: "TOT", group: "defensive", key: "totalTackles" },
      { label: "SOLO", group: "defensive", key: "soloTackles" },
      { label: "AST", group: "defensive", key: "assistTackles" },
      { label: "SACK", group: "defensive", key: "sacks" },
      { label: "INT", group: "defensive", key: "interceptions" },
      { label: "PD", group: "defensive", key: "passesDefended" },
      { label: "FF", group: "defensive", key: "fumblesForced" },
      { label: "INT YDS", group: "defensive", key: "interceptionYards" },
      { label: "INT TD", group: "defensive", key: "interceptionTouchdowns" },
    ],
  },
  {
    title: "Special Teams",
    columns: [
      { label: "KR", group: "returning", key: "kickReturns" },
      { label: "KR YDS", group: "returning", key: "kickReturnYards" },
      { label: "KR LNG", group: "returning", key: "longKickReturn" },
      { label: "KR TD", group: "returning", key: "kickReturnTouchdowns" },
      { label: "PR", group: "returning", key: "puntReturns" },
      { label: "PR YDS", group: "returning", key: "puntReturnYards" },
      { label: "PR LNG", group: "returning", key: "longPuntReturn" },
      { label: "PR TD", group: "returning", key: "puntReturnTouchdowns" },
      {
        label: "FG",
        group: "scoring",
        key: "fieldGoals",
        fallbacks: [{ group: "kicking", key: "fieldGoals" }],
      },
      {
        label: "PAT",
        group: "scoring",
        key: "kickExtraPoints",
        fallbacks: [{ group: "kicking", key: "kickExtraPoints" }],
      },
      { label: "PUNTS", group: "punting", key: "punts" },
      { label: "P YDS", group: "punting", key: "puntYards" },
      { label: "P LNG", group: "punting", key: "longPunt" },
    ],
  },
];

const buildFootballStatCategories = (
  stats: TeamStats,
): StatDisplayCategory[] => [
  {
    key: "passing",
    name: "Passing",
    stats: [
      createRow("completionPct", "Completion %", stats.completionPct, "%"),
      createRow("completions", "Completions", stats.completions),
      createRow("passingAttempts", "Passing Attempts", stats.passingAttempts),
      createRow("passingYards", "Passing Yards", stats.passingYards),
      createRow(
        "passingYardsPerGame",
        "Passing Yards/Game",
        stats.passingYardsPerGame,
      ),
      createRow(
        "yardsPerPassAttempt",
        "Yards/Pass Attempt",
        stats.yardsPerPassAttempt,
      ),
      createRow(
        "passingTouchdowns",
        "Passing Touchdowns",
        stats.passingTouchdowns,
      ),
      createRow("interceptions", "Interceptions", stats.interceptions),
      createRow(
        "interceptionPct",
        "Interception %",
        stats.interceptionPct,
        "%",
      ),
      createRow("QBRating", "QB Rating", stats.QBRating),
      createRow("sacks", "Sacks Taken", stats.sacks),
      createRow("sackYardsLost", "Sack Yards Lost", stats.sackYardsLost),
      createRow("longPassing", "Long Pass", stats.longPassing),
    ],
  },
  {
    key: "rushing",
    name: "Rushing",
    stats: [
      createRow("rushingAttempts", "Rushing Attempts", stats.rushingAttempts),
      createRow("rushingYards", "Rushing Yards", stats.rushingYards),
      createRow(
        "rushingYardsPerGame",
        "Rushing Yards/Game",
        stats.rushingYardsPerGame,
      ),
      createRow(
        "yardsPerRushAttempt",
        "Yards/Rush Attempt",
        stats.yardsPerRushAttempt,
      ),
      createRow(
        "rushingTouchdowns",
        "Rushing Touchdowns",
        stats.rushingTouchdowns,
      ),
      createRow("longRushing", "Long Rush", stats.longRushing),
      createRow("rushingBigPlays", "Rushing Big Plays", stats.rushingBigPlays),
      createRow("rushingFumbles", "Rushing Fumbles", stats.rushingFumbles),
      createRow(
        "rushingFumblesLost",
        "Rushing Fumbles Lost",
        stats.rushingFumblesLost,
      ),
      createRow(
        "rushingFirstDowns",
        "Rushing First Downs",
        stats.rushingFirstDowns,
      ),
    ],
  },
  {
    key: "receiving",
    name: "Receiving",
    stats: [
      createRow("receptions", "Receptions", stats.receptions),
      createRow("receivingTargets", "Targets", stats.receivingTargets),
      createRow("receivingYards", "Receiving Yards", stats.receivingYards),
      createRow(
        "receivingYardsPerGame",
        "Receiving Yards/Game",
        stats.receivingYardsPerGame,
      ),
      createRow(
        "yardsPerReception",
        "Yards/Reception",
        stats.yardsPerReception,
      ),
      createRow(
        "receivingTouchdowns",
        "Receiving Touchdowns",
        stats.receivingTouchdowns,
      ),
      createRow("longReception", "Long Reception", stats.longReception),
      createRow(
        "receivingBigPlays",
        "Receiving Big Plays",
        stats.receivingBigPlays,
      ),
      createRow(
        "receivingYardsAfterCatch",
        "Yards After Catch",
        stats.receivingYardsAfterCatch,
      ),
      createRow(
        "receivingFirstDowns",
        "Receiving First Downs",
        stats.receivingFirstDowns,
      ),
      createRow(
        "receivingFumbles",
        "Receiving Fumbles",
        stats.receivingFumbles,
      ),
      createRow(
        "receivingFumblesLost",
        "Receiving Fumbles Lost",
        stats.receivingFumblesLost,
      ),
    ],
  },
  {
    key: "efficiency",
    name: "First Downs / Efficiency",
    stats: [
      createRow("firstDowns", "First Downs", stats.firstDowns),
      createRow(
        "firstDownsRushing",
        "Rushing First Downs",
        stats.firstDownsRushing,
      ),
      createRow(
        "firstDownsPassing",
        "Passing First Downs",
        stats.firstDownsPassing,
      ),
      createRow(
        "firstDownsPenalty",
        "Penalty First Downs",
        stats.firstDownsPenalty,
      ),
      createRow(
        "thirdDownConvs",
        "Third Down Conversions",
        stats.thirdDownConvs,
      ),
      createRow(
        "thirdDownAttempts",
        "Third Down Attempts",
        stats.thirdDownAttempts,
      ),
      createRow(
        "thirdDownConvPct",
        "Third Down %",
        stats.thirdDownConvPct,
        "%",
      ),
      createRow(
        "fourthDownConvs",
        "Fourth Down Conversions",
        stats.fourthDownConvs,
      ),
      createRow(
        "fourthDownAttempts",
        "Fourth Down Attempts",
        stats.fourthDownAttempts,
      ),
      createRow(
        "fourthDownConvPct",
        "Fourth Down %",
        stats.fourthDownConvPct,
        "%",
      ),
      {
        name: "possessionTimeSeconds",
        displayName: "Possession Time",
        value: stats.possessionTimeSeconds,
        displayValue: formatTime(stats.possessionTimeSeconds),
      },
      createRow(
        "redzoneScoringPct",
        "Red Zone Scoring %",
        stats.redzoneScoringPct,
        "%",
      ),
      createRow(
        "redzoneTouchdownPct",
        "Red Zone TD %",
        stats.redzoneTouchdownPct,
        "%",
      ),
      createRow("totalPenalties", "Penalties", stats.totalPenalties),
      createRow("totalPenaltyYards", "Penalty Yards", stats.totalPenaltyYards),
      createRow("totalTakeaways", "Takeaways", stats.totalTakeaways),
      createRow("totalGiveaways", "Giveaways", stats.totalGiveaways),
      createRow(
        "turnOverDifferential",
        "Turnover Differential",
        stats.turnOverDifferential,
      ),
    ],
  },
  {
    key: "defense",
    name: "Defense",
    stats: [
      createRow("soloTackles", "Solo Tackles", stats.soloTackles),
      createRow("assistTackles", "Assisted Tackles", stats.assistTackles),
      createRow("totalTackles", "Total Tackles", stats.totalTackles),
      createRow("tacklesForLoss", "Tackles For Loss", stats.tacklesForLoss),
      createRow("sackYards", "Sack Yards", stats.sackYards),
      createRow("stuffs", "Stuffs", stats.stuffs),
      createRow("passesDefended", "Passes Defended", stats.passesDefended),
      createRow(
        "interceptionYards",
        "Interception Yards",
        stats.interceptionYards,
      ),
      createRow(
        "interceptionTouchdowns",
        "Interception Touchdowns",
        stats.interceptionTouchdowns,
      ),
      createRow(
        "longInterception",
        "Long Interception",
        stats.longInterception,
      ),
      createRow("fumblesForced", "Fumbles Forced", stats.fumblesForced),
      createRow(
        "fumblesRecovered",
        "Fumbles Recovered",
        stats.fumblesRecovered,
      ),
      createRow(
        "fumblesTouchdowns",
        "Fumble Touchdowns",
        stats.fumblesTouchdowns,
      ),
      createRow("kicksBlocked", "Kicks Blocked", stats.kicksBlocked),
    ],
  },
  {
    key: "returns",
    name: "Returns",
    stats: [
      createRow("kickReturns", "Kick Returns", stats.kickReturns),
      createRow("kickReturnYards", "Kick Return Yards", stats.kickReturnYards),
      createRow(
        "yardsPerKickReturn",
        "Yards/Kick Return",
        stats.yardsPerKickReturn,
      ),
      createRow("longKickReturn", "Long Kick Return", stats.longKickReturn),
      createRow(
        "kickReturnTouchdowns",
        "Kick Return Touchdowns",
        stats.kickReturnTouchdowns,
      ),
      createRow("puntReturns", "Punt Returns", stats.puntReturns),
      createRow("puntReturnYards", "Punt Return Yards", stats.puntReturnYards),
      createRow(
        "yardsPerPuntReturn",
        "Yards/Punt Return",
        stats.yardsPerPuntReturn,
      ),
      createRow("longPuntReturn", "Long Punt Return", stats.longPuntReturn),
      createRow(
        "puntReturnTouchdowns",
        "Punt Return Touchdowns",
        stats.puntReturnTouchdowns,
      ),
    ],
  },
  {
    key: "kicking",
    name: "Kicking",
    stats: [
      createRow("fieldGoalsMade", "Field Goals Made", stats.fieldGoalsMade),
      createRow(
        "fieldGoalAttempts",
        "Field Goal Attempts",
        stats.fieldGoalAttempts,
      ),
      createRow("fieldGoalPct", "Field Goal %", stats.fieldGoalPct, "%"),
      createRow(
        "longFieldGoalMade",
        "Long Field Goal",
        stats.longFieldGoalMade,
      ),
      createRow("extraPointsMade", "Extra Points Made", stats.extraPointsMade),
      createRow(
        "extraPointAttempts",
        "Extra Point Attempts",
        stats.extraPointAttempts,
      ),
      createRow("extraPointPct", "Extra Point %", stats.extraPointPct, "%"),
      createRow(
        "totalKickingPoints",
        "Kicking Points",
        stats.totalKickingPoints,
      ),
      createRow("touchbackPct", "Touchback %", stats.touchbackPct, "%"),
    ],
  },
  {
    key: "punting",
    name: "Punting",
    stats: [
      createRow("punts", "Punts", stats.punts),
      createRow("puntYards", "Punt Yards", stats.puntYards),
      createRow("longPunt", "Long Punt", stats.longPunt),
      createRow(
        "grossAvgPuntYards",
        "Gross Avg Punt Yards",
        stats.grossAvgPuntYards,
      ),
      createRow("netAvgPuntYards", "Net Avg Punt Yards", stats.netAvgPuntYards),
      createRow("puntsBlocked", "Punts Blocked", stats.puntsBlocked),
      createRow("puntsInside20", "Punts Inside 20", stats.puntsInside20),
      createRow("touchbacks", "Touchbacks", stats.touchbacks),
      createRow("fairCatches", "Fair Catches", stats.fairCatches),
    ],
  },
  {
    key: "scoring",
    name: "Scoring / Totals",
    stats: [
      createRow("gamesPlayed", "Games Played", stats.gamesPlayed),
      createRow("totalPoints", "Total Points", stats.totalPoints),
      createRow("totalPointsPerGame", "Points/Game", stats.totalPointsPerGame),
      createRow("totalYards", "Total Yards", stats.totalYards),
      createRow("yardsPerGame", "Yards/Game", stats.yardsPerGame),
      createRow(
        "totalOffensivePlays",
        "Offensive Plays",
        stats.totalOffensivePlays,
      ),
      createRow("totalTouchdowns", "Total Touchdowns", stats.totalTouchdowns),
      createRow(
        "returnTouchdowns",
        "Return Touchdowns",
        stats.returnTouchdowns,
      ),
      createRow("fieldGoals", "Field Goals", stats.fieldGoals),
      createRow("kickExtraPoints", "Kick Extra Points", stats.kickExtraPoints),
      createRow(
        "totalTwoPointConvs",
        "Two Point Conversions",
        stats.totalTwoPointConvs,
      ),
    ],
  },
];

export default function RosterStats({
  rosterStats,
  teamStats,
  league,
  loading = false,
  error = null,
  teamId,
  category,
  refreshing = false,
  onRefresh = () => undefined,
}: FootballRosterStatsProps) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = rosterStatsStyles(isDark);
  const global = globalStyles(isDark);
  const router = useRouter();
  const roster = useMemo(
    () => getPlayersFromRosterStats(rosterStats),
    [rosterStats],
  );

  const [selectedTab, setSelectedTab] = useState<StatTab>(STAT_TABS[0]);
  const [mountedTabs, setMountedTabs] = useState<Record<StatTab, boolean>>({
    "Player Stats": true,
    "Team Stats": false,
  });

  const handleTabPress = (tab: StatTab) => {
    setSelectedTab(tab);

    setMountedTabs((prev) => ({
      ...prev,
      [tab]: true,
    }));
  };

  const rowBg = (index: number) =>
    index % 2 === 1
      ? {
          backgroundColor: isDark
            ? Colors.dark.itemBackground
            : Colors.light.itemBackground,
        }
      : {};

  const headerBg = {
    backgroundColor: isDark
      ? Colors.dark.itemBackground
      : Colors.light.itemBackground,
  };

  const leaders = useMemo(() => {
    type FootballLeader = FootballLeaderConfig & {
      player: FootballRosterStatsPlayer;
      value: FootballStatValue;
    };

    return LEADER_STATS.map((leader) => {
      const sortedPlayers = roster
        .map((player) => {
          const value = getStatByPath(player.latestSeasonStats, leader.path);

          return {
            player,
            value,
            numericValue: parseStatNumber(value),
          };
        })
        .filter((item) => item.numericValue > 0)
        .sort((a, b) => b.numericValue - a.numericValue);

      const leaderPlayer = sortedPlayers[0];

      return leaderPlayer
        ? {
            ...leader,
            player: leaderPlayer.player,
            value: leaderPlayer.value,
          }
        : null;
    }).filter((leader): leader is FootballLeader => Boolean(leader));
  }, [roster]);

  const playerTables = useMemo(
    () =>
      PLAYER_STAT_TABLES.map((table) => ({
        ...table,
        players: roster.filter((player) =>
          hasAnyStatForTable(player, table.columns),
        ),
      })).filter(
        (
          table,
        ): table is FootballPlayerStatTable & {
          players: FootballRosterStatsPlayer[];
        } => table.players.length > 0,
      ),
    [roster],
  );

  const route = "/player/football/[id]";
  const handlePress = (player: FootballRosterStatsPlayer) => {
    const id = player.playerId || player.player_id || player.id;

    if (!route) {
      console.warn(`[RosterStats] No player route configured for ${league}`);
      return;
    }

    if (!id) {
      console.warn("[RosterStats] Missing player id", player);
      return;
    }

    router.push({
      pathname: route,
      params: {
        id: String(id),
        teamId: String(teamId),
        league,
      },
    });
  };

  const renderPlayerName = (player: FootballRosterStatsPlayer) => (
    <Text numberOfLines={1} style={[styles.playerName, { width: 132 }]}>
      {getPlayerName(player)}{" "}
      {player.jersey_number ? (
        <Text style={styles.number}>#{player.jersey_number}</Text>
      ) : null}
    </Text>
  );

  const renderLeaderAvatar = (player: FootballRosterStatsPlayer) => {
    if (player.headshot_url) {
      return (
        <Image source={{ uri: player.headshot_url }} style={styles.avatar} />
      );
    }

    return (
      <View
        style={[
          styles.avatar,
          styles.center,
          {
            backgroundColor: isDark
              ? Colors.dark.background
              : Colors.light.background,
          },
        ]}
      >
        <Text style={styles.nameHeaderText}>{getPlayerInitials(player)}</Text>
      </View>
    );
  };

  const renderLeaderCard = (
    leader: FootballLeaderConfig & {
      player: FootballRosterStatsPlayer;
      value: FootballStatValue;
    },
    index: number,
    total: number,
  ) => (
    <View key={leader.label} style={styles.cardWrapper}>
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={() => handlePress(leader.player)}
        style={styles.cardContainer}
      >
        <Text style={styles.cardLabel}>{leader.label}</Text>

        <View style={styles.statCard}>
          {renderLeaderAvatar(leader.player)}

          <View style={styles.nameValue}>
            <Text numberOfLines={1} style={styles.cardName}>
              {getPlayerName(leader.player)}{" "}
              {leader.player.jersey_number ? (
                <Text style={styles.number}>
                  #{leader.player.jersey_number}
                </Text>
              ) : null}
            </Text>

            <Text style={styles.cardValue}>
              {formatStatValue(leader.value)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {index < total - 1 && <View style={styles.divider} />}
    </View>
  );

  const renderPlayerTable = (
    table: FootballPlayerStatTable & {
      players: FootballRosterStatsPlayer[];
    },
  ) => (
    <View key={table.title} style={{ marginBottom: 20 }}>
      <Text style={styles.categoryTitle}>{table.title}</Text>

      <View style={styles.tableWrapper}>
        <View style={styles.fixedColumnContainer}>
          <View style={[styles.tableRow, headerBg]}>
            <Text
              style={[styles.tableCell, styles.nameHeaderText, { width: 140 }]}
            >
              Player
            </Text>
          </View>

          {table.players.map((player, index) => (
            <View
              key={`${table.title}-name-${getPlayerKey(player, index)}`}
              style={[
                styles.tableRow,
                rowBg(index),
                index === table.players.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <TouchableOpacity
                activeOpacity={activeOpacity}
                onPress={() => handlePress(player)}
                style={[styles.tableCell, { width: 140 }]}
              >
                {renderPlayerName(player)}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollSection}
          contentContainerStyle={styles.scrollContentContainer}
        >
          <View style={styles.statScrollContent}>
            <View style={[styles.tableRow, headerBg]}>
              {table.columns.map((column) => (
                <Text
                  key={`${table.title}-header-${column.label}`}
                  style={[
                    styles.tableCell,
                    styles.headerText,
                    { width: column.width ?? 82 },
                  ]}
                >
                  {column.label}
                </Text>
              ))}
            </View>

            {table.players.map((player, index) => (
              <View
                key={`${table.title}-stats-${getPlayerKey(player, index)}`}
                style={[
                  styles.tableRow,
                  rowBg(index),
                  index === table.players.length - 1 && {
                    borderBottomWidth: 0,
                  },
                ]}
              >
                {table.columns.map((column) => (
                  <Text
                    key={`${table.title}-${getPlayerKey(player, index)}-${
                      column.label
                    }`}
                    style={[
                      styles.tableCell,
                      styles.statValue,
                      { width: column.width ?? 82 },
                    ]}
                  >
                    {formatStatValue(getPlayerStatValue(player, column))}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );

  const renderPlayerStats = () => {
    if (!playerTables.length) {
      return (
        <View style={styles.center}>
          <Text style={global.emptyText}>No player stats available.</Text>
        </View>
      );
    }

    return (
      <>
        {leaders.length > 0 ? (
          <ScrollView
            horizontal
            nestedScrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
            snapToInterval={276}
            decelerationRate="fast"
            snapToAlignment="start"
          >
            {leaders.map((leader, index) =>
              renderLeaderCard(leader, index, leaders.length),
            )}
          </ScrollView>
        ) : null}

        {playerTables.map(renderPlayerTable)}
      </>
    );
  };

  const renderTeamStats = () => {
    if (!teamStats) {
      return (
        <View style={styles.center}>
          <Text style={global.emptyText}>No team stats available.</Text>
        </View>
      );
    }

    const categories = buildFootballStatCategories(teamStats);

    const statsToDisplay = category
      ? categories.filter((statCategory) => statCategory.key === category)
      : categories;

    return (
      <View>
        {statsToDisplay.map((cat) => (
          <View key={cat.key} style={{ marginBottom: 20 }}>
            <Text style={styles.categoryTitle}>{cat.name}</Text>

            <View style={styles.table}>
              {cat.stats.map((stat: StatRow, index: number) => (
                <View
                  key={`${cat.key}-${stat.name}-${index}`}
                  style={[
                    styles.teamTableRow,
                    index === cat.stats.length - 1 && {
                      borderBottomWidth: 0,
                    },
                    index % 2 === 1 && {
                      backgroundColor: isDark
                        ? Colors.dark.itemBackground
                        : Colors.light.itemBackground,
                    },
                  ]}
                >
                  <Text style={[styles.tableCell, styles.headerText]}>
                    {stat.displayName}
                  </Text>

                  <Text style={[styles.tableCell, styles.statValue]}>
                    {stat.displayValue}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={global.emptyContainer}>
        <CustomActivityIndicator />
      </View>
    );
  }

  if (error && !roster.length && !teamStats) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return (
      <View style={global.emptyContainer}>
        <Text style={global.errorText}>Error: {errorMessage}</Text>
      </View>
    );
  }

  if (!roster.length && !teamStats) {
    return (
      <View style={global.emptyContainer}>
        <Text style={global.emptyText}>No stats available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      keyboardShouldPersistTaps="handled"
    >
      <PillTabs<StatTab>
        tabs={STAT_TAB_OPTIONS}
        selectedValue={selectedTab}
        onChange={handleTabPress}
      />

      {mountedTabs["Player Stats"] && (
        <View
          style={[
            styles.tabScene,
            selectedTab !== "Player Stats" && styles.hiddenTabScene,
          ]}
          pointerEvents={selectedTab === "Player Stats" ? "auto" : "none"}
        >
          {renderPlayerStats()}
        </View>
      )}
      
      {mountedTabs["Team Stats"] && (
        <View
          style={[
            styles.tabScene,
            selectedTab !== "Team Stats" && styles.hiddenTabScene,
          ]}
          pointerEvents={selectedTab === "Team Stats" ? "auto" : "none"}
        >
          {renderTeamStats()}
        </View>
      )}
    </ScrollView>
  );
}
