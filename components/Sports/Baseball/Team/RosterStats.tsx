import PillTabs, { type PillTabOption } from "@/components/TabBars/PillTabs";
import MainScrollTabBar from "@/components/TabBars/MainTabScrollBar";
import type { TeamAggregatedStats } from "@/hooks/BaseballHooks/useTeamStats";
import type {
  BaseballRosterLeague,
  BaseballRosterPlayer,
  BaseballRosterStats,
  BaseballSeasonStats,
  BaseballStatMap,
  BaseballStatValue,
} from "@/hooks/BaseballHooks/useRosterStats";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import { activeOpacity, Colors, globalStyles } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { router } from "expo-router";
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

type RosterStatsComponentProps = {
  rosterStats: BaseballRosterStats | BaseballRosterPlayer[] | null | undefined;
  teamId: string | number;
  teamStats?: TeamAggregatedStats | null;
  loading: boolean;
  error: Error | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  league?: BaseballRosterLeague;
};

type StatTab = "Player Stats" | "Team Stats";
type PlayerStatView = "Batting" | "Pitching";
type StatGroupKey = "career-batting" | "advanced-batting" | "pitching";

type PlayerStatRow = {
  player: BaseballRosterPlayer;
  season: BaseballSeasonStats;
  primaryStats: BaseballStatMap;
  advancedBattingStats?: BaseballStatMap | null;
};

type StatLeader = {
  row: PlayerStatRow;
  value: BaseballStatValue;
  numericValue: number;
};

type LeaderDefinition = {
  label: string;
  group: StatGroupKey;
  key: string;
  order: "asc" | "desc";
};

type StatColumn = {
  header: string;
  getValue: (row: PlayerStatRow) => BaseballStatValue | undefined;
};

type TeamStatRow = {
  label: string;
  value: BaseballStatValue | undefined;
};

const STAT_TABS = ["Player Stats", "Team Stats"] as const;
const PLAYER_STAT_VIEW_TABS: readonly PillTabOption<PlayerStatView>[] = [
  { label: "Batting", value: "Batting" },
  { label: "Pitching", value: "Pitching" },
];

const PLAYER_NAME_WIDTH = 140;
const STAT_CELL_WIDTH = 80;

const BATTING_LEADERS: readonly LeaderDefinition[] = [
  { label: "Batting Average", group: "career-batting", key: "avg", order: "desc" },
  { label: "Home Runs", group: "career-batting", key: "homeRuns", order: "desc" },
  { label: "RBIs", group: "career-batting", key: "RBIs", order: "desc" },
  { label: "OPS", group: "career-batting", key: "OPS", order: "desc" },
  { label: "Stolen Bases", group: "career-batting", key: "stolenBases", order: "desc" },
];

const PITCHING_LEADERS: readonly LeaderDefinition[] = [
  { label: "ERA", group: "pitching", key: "ERA", order: "asc" },
  { label: "Wins", group: "pitching", key: "wins", order: "desc" },
  { label: "Strikeouts", group: "pitching", key: "strikeouts", order: "desc" },
  { label: "Saves", group: "pitching", key: "saves", order: "desc" },
  { label: "WHIP", group: "pitching", key: "WHIP", order: "asc" },
];

const BATTING_COLUMNS: readonly StatColumn[] = [
  { header: "GP", getValue: (row) => row.primaryStats.gamesPlayed },
  { header: "AB", getValue: (row) => row.primaryStats.atBats },
  { header: "R", getValue: (row) => row.primaryStats.runs },
  { header: "H", getValue: (row) => row.primaryStats.hits },
  { header: "2B", getValue: (row) => row.primaryStats.doubles },
  { header: "3B", getValue: (row) => row.primaryStats.triples },
  { header: "HR", getValue: (row) => row.primaryStats.homeRuns },
  { header: "RBI", getValue: (row) => row.primaryStats.RBIs },
  { header: "BB", getValue: (row) => row.primaryStats.walks },
  { header: "SO", getValue: (row) => row.primaryStats.strikeouts },
  { header: "SB", getValue: (row) => row.primaryStats.stolenBases },
  { header: "AVG", getValue: (row) => row.primaryStats.avg },
  { header: "OBP", getValue: (row) => row.primaryStats.onBasePct },
  { header: "SLG", getValue: (row) => row.primaryStats.slugAvg },
  { header: "OPS", getValue: (row) => row.primaryStats.OPS },
  {
    header: "WAR",
    getValue: (row) =>
      row.primaryStats.WARBR ?? row.advancedBattingStats?.WARBR,
  },
];

const PITCHING_COLUMNS: readonly StatColumn[] = [
  { header: "GP", getValue: (row) => row.primaryStats.gamesPlayed },
  { header: "GS", getValue: (row) => row.primaryStats.gamesStarted },
  { header: "W", getValue: (row) => row.primaryStats.wins },
  { header: "L", getValue: (row) => row.primaryStats.losses },
  { header: "ERA", getValue: (row) => row.primaryStats.ERA },
  { header: "IP", getValue: (row) => row.primaryStats.innings },
  { header: "H", getValue: (row) => row.primaryStats.hits },
  { header: "R", getValue: (row) => row.primaryStats.runs },
  { header: "ER", getValue: (row) => row.primaryStats.earnedRuns },
  { header: "BB", getValue: (row) => row.primaryStats.walks },
  { header: "SO", getValue: (row) => row.primaryStats.strikeouts },
  { header: "WHIP", getValue: (row) => row.primaryStats.WHIP },
  { header: "SV", getValue: (row) => row.primaryStats.saves },
  { header: "HLD", getValue: (row) => row.primaryStats.holds },
  { header: "BS", getValue: (row) => row.primaryStats.blownSaves },
  { header: "K/BB", getValue: (row) => row.primaryStats.strikeoutToWalkRatio },
  { header: "WAR", getValue: (row) => row.primaryStats.WARBR },
];

const numberFormatter = new Intl.NumberFormat("en-US");

const isStatMap = (value: unknown): value is BaseballStatMap => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(
    (item) =>
      item === null ||
      typeof item === "string" ||
      typeof item === "number",
  );
};

const hasDisplayableStatValue = (value: BaseballStatValue | undefined) =>
  value !== null && value !== undefined && String(value).trim() !== "";

const hasUsableStatMap = (
  stats: BaseballStatMap | null | undefined,
): stats is BaseballStatMap =>
  Boolean(stats && Object.values(stats).some(hasDisplayableStatValue));

const getStatsGroup = (
  season: BaseballSeasonStats | null | undefined,
  group: StatGroupKey,
) => {
  const value = season?.stats?.[group];

  return isStatMap(value) ? value : null;
};

const hasUsableSeasonStats = (
  season: BaseballSeasonStats | null | undefined,
  group?: StatGroupKey,
) => {
  if (!season?.stats || typeof season.stats !== "object") return false;

  if (group) return hasUsableStatMap(getStatsGroup(season, group));

  return (
    hasUsableStatMap(getStatsGroup(season, "career-batting")) ||
    hasUsableStatMap(getStatsGroup(season, "advanced-batting")) ||
    hasUsableStatMap(getStatsGroup(season, "pitching"))
  );
};

const getBestSeasonStats = (
  player: BaseballRosterPlayer,
  group?: StatGroupKey,
) => {
  const candidates = [
    player.latestSeasonStats,
    player.currentSeasonStats,
    player.latestSeason,
  ];

  const priorityMatch = candidates.find((season) =>
    hasUsableSeasonStats(season, group),
  );

  if (priorityMatch) return priorityMatch;

  return (player.seasonStats ?? []).find((season) =>
    hasUsableSeasonStats(season, group),
  ) ?? null;
};

const getPlayersFromRosterStats = (
  rosterStats: BaseballRosterStats | BaseballRosterPlayer[] | null | undefined,
) => {
  if (Array.isArray(rosterStats)) return rosterStats;

  return rosterStats?.players ?? [];
};

const parseNumericStat = (value: BaseballStatValue | undefined) => {
  if (!hasDisplayableStatValue(value)) return null;

  const numeric = Number(String(value).replace(/[%,$]/g, "").trim());

  return Number.isFinite(numeric) ? numeric : null;
};

const formatStatValue = (value: BaseballStatValue | undefined): string => {
  if (!hasDisplayableStatValue(value)) return "—";

  if (typeof value === "number") return numberFormatter.format(value);

  return String(value).trim();
};

const getGamesPlayed = (stats: BaseballStatMap | null | undefined) =>
  parseNumericStat(stats?.gamesPlayed) ?? 0;

const getPlayerId = (player: BaseballRosterPlayer) =>
  player.playerId ?? player.id;

const getPlayerDisplayName = (player: BaseballRosterPlayer) =>
  player.short_name ||
  [player.first_name, player.last_name].filter(Boolean).join(" ") ||
  player.full_name;

const getPlayerRows = (
  players: BaseballRosterPlayer[],
  view: PlayerStatView,
) => {
  const group: StatGroupKey = view === "Batting" ? "career-batting" : "pitching";

  return players
    .map<PlayerStatRow | null>((player) => {
      const season = getBestSeasonStats(player, group);
      const primaryStats = getStatsGroup(season, group);

      if (!season || !hasUsableStatMap(primaryStats)) return null;
      if (getGamesPlayed(primaryStats) <= 0) return null;

      return {
        player,
        season,
        primaryStats,
        advancedBattingStats: getStatsGroup(season, "advanced-batting"),
      };
    })
    .filter((row): row is PlayerStatRow => row !== null);
};

const getStatLeader = (
  rows: PlayerStatRow[],
  definition: LeaderDefinition,
) => {
  return rows.reduce<StatLeader | null>((leader, row) => {
    const stats =
      definition.group === "advanced-batting"
        ? row.advancedBattingStats
        : row.primaryStats;
    const value = stats?.[definition.key];
    const numericValue = parseNumericStat(value);

    if (numericValue === null) return leader;

    const leaderValue = value ?? null;

    if (!leader) return { row, value: leaderValue, numericValue };

    const isBetter =
      definition.order === "asc"
        ? numericValue < leader.numericValue
        : numericValue > leader.numericValue;

    return isBetter ? { row, value: leaderValue, numericValue } : leader;
  }, null);
};

export default function RosterStats({
  rosterStats,
  teamId,
  teamStats,
  loading,
  error,
  refreshing = false,
  onRefresh,
  league = "MLB",
}: RosterStatsComponentProps) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = rosterStatsStyles(isDark);
  const global = globalStyles(isDark);

  const [selectedTab, setSelectedTab] = useState<StatTab>(STAT_TABS[0]);
  const [selectedPlayerView, setSelectedPlayerView] =
    useState<PlayerStatView>("Batting");
  const [mountedTabs, setMountedTabs] = useState<Record<StatTab, boolean>>({
    "Player Stats": true,
    "Team Stats": false,
  });

  const players = useMemo(
    () => getPlayersFromRosterStats(rosterStats),
    [rosterStats],
  );

  const battingRows = useMemo(
    () => getPlayerRows(players, "Batting"),
    [players],
  );
  const pitchingRows = useMemo(
    () => getPlayerRows(players, "Pitching"),
    [players],
  );

  const activeRows = selectedPlayerView === "Batting" ? battingRows : pitchingRows;
  const activeColumns =
    selectedPlayerView === "Batting" ? BATTING_COLUMNS : PITCHING_COLUMNS;
  const activeLeaders =
    selectedPlayerView === "Batting" ? BATTING_LEADERS : PITCHING_LEADERS;

  const statLeaders = activeLeaders.reduce<
    (LeaderDefinition & { leader: StatLeader })[]
  >((acc, definition) => {
    const leader = getStatLeader(activeRows, definition);

    if (leader) {
      acc.push({ ...definition, leader });
    }

    return acc;
  }, []);

  const handleTabPress = (tab: StatTab) => {
    setSelectedTab(tab);

    setMountedTabs((prev) => ({
      ...prev,
      [tab]: true,
    }));
  };

  const handlePress = (player: BaseballRosterPlayer) => {
    const id = String(getPlayerId(player));
    const currentTeamId = String(teamId);

    router.push({
      pathname: "/player/baseball/[id]",
      params: {
        id,
        teamId: currentTeamId,
        league,
      },
    });
  };

  const rowBg = (idx: number) =>
    idx % 2 === 1
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

  const stickyColumnBg = {
    backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
  };

  const LeaderCard = ({
    row,
    label,
    value,
    index,
    total,
  }: {
    row: PlayerStatRow;
    label: string;
    value: BaseballStatValue | undefined;
    index: number;
    total: number;
  }) => {
    const { player } = row;

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          activeOpacity={activeOpacity}
          onPress={() => handlePress(player)}
          style={styles.cardContainer}
        >
          <Text style={styles.cardLabel}>{label}</Text>

          <View style={styles.statCard}>
            {player.headshot_url ? (
              <Image
                source={{ uri: player.headshot_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatar} />
            )}

            <View style={styles.nameValue}>
              <Text style={styles.cardName}>
                {getPlayerDisplayName(player)}{" "}
                <Text style={styles.number}>
                  #{player.jersey_number ?? "—"}
                </Text>
              </Text>

              <Text style={styles.cardValue}>{formatStatValue(value)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {index < total - 1 && <View style={styles.divider} />}
      </View>
    );
  };

  const renderStickyPlayerCell = (row: PlayerStatRow, index: number) => (
    <View
      key={`${getPlayerId(row.player)}-${selectedPlayerView}-sticky-name`}
      style={[
        styles.tableRow,
        stickyColumnBg,
        rowBg(index),
        index === activeRows.length - 1 && { borderBottomWidth: 0 },
      ]}
    >
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={() => handlePress(row.player)}
        style={{ width: PLAYER_NAME_WIDTH }}
      >
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.tableCell, styles.playerName]}
        >
          {getPlayerDisplayName(row.player)}{" "}
          <Text style={styles.number}>#{row.player.jersey_number ?? "—"}</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderScrollableStatRow = (row: PlayerStatRow, index: number) => (
    <View
      key={`${getPlayerId(row.player)}-${selectedPlayerView}-stats-row`}
      style={[
        styles.tableRow,
        rowBg(index),
        index === activeRows.length - 1 && { borderBottomWidth: 0 },
      ]}
    >
      {activeColumns.map((column) => (
        <Text
          key={`${getPlayerId(row.player)}-${column.header}`}
          style={[
            styles.tableCell,
            styles.statValue,
            {
              width: STAT_CELL_WIDTH,
            },
          ]}
        >
          {formatStatValue(column.getValue(row))}
        </Text>
      ))}
    </View>
  );

  const renderPlayerStatsTable = () => (
    <View style={styles.tableWrapper}>
      <View style={styles.tableContent}>
        <View
          style={[
            stickyColumnBg,
            {
              width: PLAYER_NAME_WIDTH,
              zIndex: 10,
              elevation: 10,
            },
          ]}
        >
          <View
            style={[
              styles.tableRow,
              headerBg,
              {
                width: PLAYER_NAME_WIDTH,
                zIndex: 10,
                elevation: 10,
              },
            ]}
          >
            <Text
              style={[
                styles.tableCell,
                styles.nameHeaderText,
                {
                  width: PLAYER_NAME_WIDTH,
                },
              ]}
            >
              NAME
            </Text>
          </View>

          {activeRows.map((row, index) => renderStickyPlayerCell(row, index))}
        </View>

        <ScrollView
          horizontal
          nestedScrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          style={styles.scrollSection}
          contentContainerStyle={styles.scrollContentContainer}
        >
          <View
            style={[
              styles.statScrollContent,
              { width: activeColumns.length * STAT_CELL_WIDTH },
            ]}
          >
            <View style={[styles.tableRow, headerBg]}>
              {activeColumns.map((column) => (
                <Text
                  key={column.header}
                  style={[
                    styles.tableCell,
                    styles.headerText,
                    {
                      width: STAT_CELL_WIDTH,
                    },
                  ]}
                >
                  {column.header}
                </Text>
              ))}
            </View>

            {activeRows.map((row, index) =>
              renderScrollableStatRow(row, index),
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );

  const renderPlayerStats = () => {
    const emptyMessage =
      selectedPlayerView === "Batting"
        ? "No batting stats available."
        : "No pitching stats available.";

    return (
      <>
        <PillTabs<PlayerStatView>
          tabs={PLAYER_STAT_VIEW_TABS}
          selectedValue={selectedPlayerView}
          onChange={setSelectedPlayerView}
          containerStyle={styles.playerStatSelector}
          scrollable={false}
          minTabWidth={120}
        />

        {!activeRows.length ? (
          <View style={styles.center}>
            <Text style={global.emptyText}>{emptyMessage}</Text>
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              nestedScrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}
              snapToInterval={276}
              decelerationRate="fast"
              snapToAlignment="start"
            >
              {statLeaders.map((item, idx) => (
                <LeaderCard
                  key={item.label}
                  row={item.leader.row}
                  label={item.label}
                  value={item.leader.value}
                  index={idx}
                  total={statLeaders.length}
                />
              ))}
            </ScrollView>

            {renderPlayerStatsTable()}
          </>
        )}
      </>
    );
  };

  const renderTeamTable = (rows: readonly TeamStatRow[]) => (
    <View style={styles.table}>
      {rows.map((item, idx) => (
        <View
          key={item.label}
          style={[
            styles.teamTableRow,
            idx % 2 === 1 && {
              backgroundColor: isDark
                ? Colors.dark.itemBackground
                : Colors.light.itemBackground,
            },
            idx === rows.length - 1 && { borderBottomWidth: 0 },
          ]}
        >
          <Text style={[styles.tableCell, styles.headerText]}>{item.label}</Text>

          <Text style={[styles.tableCell, styles.teamStatValue]}>
            {formatStatValue(item.value)}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderTeamStatsSection = (
    title: string,
    rows: readonly TeamStatRow[],
  ) => (
    <View>
      <Text style={styles.categoryTitle}>{title}</Text>
      {renderTeamTable(rows)}
    </View>
  );

  const renderTeamStats = () => {
    if (!teamStats) {
      return (
        <View style={styles.center}>
          <Text style={global.emptyText}>No team stats available.</Text>
        </View>
      );
    }

    const summaryRows: readonly TeamStatRow[] = [
      { label: "Team", value: teamStats.team.fullName || teamStats.team.name },
      { label: "Record", value: teamStats.team.recordSummary },
      { label: "Standing", value: teamStats.team.standingSummary },
      { label: "Season", value: teamStats.season.displayName },
    ];

    const battingRowsForTeam: readonly TeamStatRow[] = [
      { label: "Games Played", value: teamStats.batting.gamesPlayed },
      { label: "Batting Average", value: teamStats.batting.battingAverage },
      { label: "On-base %", value: teamStats.batting.onBasePct },
      { label: "Slugging %", value: teamStats.batting.sluggingPct },
      { label: "OPS", value: teamStats.batting.ops },
      { label: "Runs", value: teamStats.batting.runs },
      { label: "Hits", value: teamStats.batting.hits },
      { label: "Doubles", value: teamStats.batting.doubles },
      { label: "Triples", value: teamStats.batting.triples },
      { label: "Home Runs", value: teamStats.batting.homeRuns },
      { label: "RBIs", value: teamStats.batting.rbis },
      { label: "Stolen Bases", value: teamStats.batting.stolenBases },
      { label: "Walks", value: teamStats.batting.walks },
      { label: "Strikeouts", value: teamStats.batting.strikeouts },
    ];

    const pitchingRowsForTeam: readonly TeamStatRow[] = [
      { label: "Games Played", value: teamStats.pitching.gamesPlayed },
      { label: "Wins", value: teamStats.pitching.wins },
      { label: "Losses", value: teamStats.pitching.losses },
      { label: "Win %", value: teamStats.pitching.winPct },
      { label: "ERA", value: teamStats.pitching.era },
      { label: "WHIP", value: teamStats.pitching.whip },
      { label: "Saves", value: teamStats.pitching.saves },
      { label: "Holds", value: teamStats.pitching.holds },
      { label: "Quality Starts", value: teamStats.pitching.qualityStarts },
      { label: "Innings", value: teamStats.pitching.innings },
      { label: "Hits Allowed", value: teamStats.pitching.hitsAllowed },
      { label: "Runs Allowed", value: teamStats.pitching.runsAllowed },
      { label: "Earned Runs", value: teamStats.pitching.earnedRuns },
      { label: "Walks Allowed", value: teamStats.pitching.walksAllowed },
      { label: "Strikeouts", value: teamStats.pitching.strikeouts },
      { label: "K/9", value: teamStats.pitching.strikeoutsPerNine },
      { label: "Opponent AVG", value: teamStats.pitching.opponentAvg },
    ];

    const fieldingRowsForTeam: readonly TeamStatRow[] = [
      { label: "Games Played", value: teamStats.fielding.gamesPlayed },
      { label: "Innings Played", value: teamStats.fielding.inningsPlayed },
      { label: "Total Chances", value: teamStats.fielding.totalChances },
      { label: "Putouts", value: teamStats.fielding.putouts },
      { label: "Assists", value: teamStats.fielding.assists },
      { label: "Errors", value: teamStats.fielding.errors },
      { label: "Double Plays", value: teamStats.fielding.doublePlays },
      { label: "Fielding %", value: teamStats.fielding.fieldingPct },
      { label: "Range Factor", value: teamStats.fielding.rangeFactor },
    ];

    return (
      <View style={styles.teamTableContainer}>
        {renderTeamStatsSection("Team Summary", summaryRows)}
        {renderTeamStatsSection("Batting", battingRowsForTeam)}
        {renderTeamStatsSection("Pitching", pitchingRowsForTeam)}
        {renderTeamStatsSection("Fielding", fieldingRowsForTeam)}
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

  if (error) {
    return <Text style={global.errorText}>{error.message}</Text>;
  }

  if (!battingRows.length && !pitchingRows.length && !teamStats) {
    return <Text style={global.emptyText}>No player stats available.</Text>;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      keyboardShouldPersistTaps="handled"
    >
      <MainScrollTabBar
        tabs={STAT_TABS}
        selected={selectedTab}
        onTabPress={handleTabPress}
        isDark={isDark}
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
