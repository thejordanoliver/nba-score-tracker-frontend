import MainScrollTabBar from "@/components/TabBars/MainTabScrollBar";
import {
  getTeamDisplayAverages,
  getTeamDisplayTotals,
  getTeamSummaryRows,
  TeamStatRow,
} from "@/utils/stats";
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

type StatValue = string | number | null | undefined;
type StatMap = Record<string, StatValue>;

type BasketballSeasonStats = {
  id: number;
  season: number;
  totals: StatMap | null;
  averages: StatMap | null;
  miscellaneous: StatMap | null;
  team_id: string | number | null;
  team_slug: string | null;
  position: string | null;
  player_id: number;
  player_name: string;
  season_type: string | null;
  season_type_label: string | null;
  season_type_value: string | number | null;
  display_season: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type RosterPlayer = {
  id: number;
  playerId: number;
  full_name: string;
  first_name: string;
  last_name: string;
  team_id: number;
  position: string | null;
  jersey_number: number | null;
  headshot_url: string | null;
  active: boolean;
  short_name: string;
  team: string;
  currentSeasonStats: BasketballSeasonStats | null;
  latestSeason: BasketballSeasonStats | null;
  latestSeasonStats: BasketballSeasonStats | null;
  seasonStats: BasketballSeasonStats[];
  careerStats: BasketballSeasonStats[];
};

type RosterStatsResponse = {
  teamId: string;
  count: number;
  players: RosterPlayer[];
};

type RosterStatsComponentProps = {
  rosterStats: RosterStatsResponse | RosterPlayer[] | null | undefined;
  teamId: string | number;
  teamStats?: Parameters<typeof getTeamSummaryRows>[0] | null;
  loading: boolean;
  error: Error | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  league?: string;
};

const STAT_TABS = ["Player Stats", "Team Stats"] as const;
type StatTab = (typeof STAT_TABS)[number];

const PLAYER_NAME_WIDTH = 140;
const STAT_CELL_WIDTH = 80;

const STAT_HEADERS = [
  "GP",
  "MIN",
  "PTS",
  "FGM-A",
  "FG%",
  "3PM-A",
  "3P%",
  "FTM-A",
  "FT%",
  "OREB",
  "DREB",
  "REB",
  "AST",
  "STL",
  "BLK",
  "TO",
  "PF",
  "+/-",
];

const LEADER_STATS = [
  { label: "Points", averageKey: "avgPoints" },
  { label: "Rebounds", averageKey: "avgRebounds" },
  { label: "Assists", averageKey: "avgAssists" },
  { label: "Blocks", averageKey: "avgBlocks" },
  { label: "Steals", averageKey: "avgSteals" },
] as const;

const numberFormatter = new Intl.NumberFormat("en-US");

const formatStatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "number") {
    return numberFormatter.format(value);
  }

  const raw = String(value).trim();

  if (raw.endsWith("%")) {
    const numeric = Number(raw.replace("%", ""));

    return Number.isFinite(numeric)
      ? `${numberFormatter.format(numeric)}%`
      : raw;
  }

  const numeric = Number(raw);

  return Number.isFinite(numeric) ? numberFormatter.format(numeric) : raw;
};

const getNumericStatValue = (value: StatValue) => {
  if (value === null || value === undefined || value === "") return 0;

  const numeric = Number(String(value).replace("%", ""));

  return Number.isFinite(numeric) ? numeric : 0;
};

const getPlayersFromRosterStats = (
  rosterStats: RosterStatsResponse | RosterPlayer[] | null | undefined,
) => {
  if (Array.isArray(rosterStats)) return rosterStats;

  return rosterStats?.players ?? [];
};

const getBestSeasonStats = (player: RosterPlayer) => {
  return (
    player.latestSeasonStats ??
    player.latestSeason ??
    player.currentSeasonStats ??
    null
  );
};

const getAverages = (player: RosterPlayer) => {
  return getBestSeasonStats(player)?.averages ?? {};
};

const getTotals = (player: RosterPlayer) => {
  return getBestSeasonStats(player)?.totals ?? {};
};

const getGamesPlayed = (player: RosterPlayer) => {
  return getNumericStatValue(getAverages(player).gamesPlayed);
};

const getMadeAttemptedStat = (
  averages: StatMap,
  totals: StatMap,
  averageKey: string,
  totalKey: string,
) => {
  return averages[averageKey] ?? totals[totalKey] ?? null;
};

export default function RosterStats({
  rosterStats,
  teamId,
  teamStats,
  loading,
  error,
  refreshing = false,
  onRefresh,
  league = "NBA",
}: RosterStatsComponentProps) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = rosterStatsStyles(isDark);
  const global = globalStyles(isDark);

  const [selectedTab, setSelectedTab] = useState<StatTab>(STAT_TABS[0]);
  const [mountedTabs, setMountedTabs] = useState<Record<StatTab, boolean>>({
    "Player Stats": true,
    "Team Stats": false,
  });

  const players = useMemo(
    () => getPlayersFromRosterStats(rosterStats),
    [rosterStats],
  );

  const activeRoster = useMemo(
    () => players.filter((player) => getGamesPlayed(player) > 0),
    [players],
  );

  const handleTabPress = (tab: StatTab) => {
    setSelectedTab(tab);

    setMountedTabs((prev) => ({
      ...prev,
      [tab]: true,
    }));
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

  const statLeaders = LEADER_STATS.map((item) => {
    const player = [...activeRoster].sort(
      (a, b) =>
        getNumericStatValue(getAverages(b)[item.averageKey]) -
        getNumericStatValue(getAverages(a)[item.averageKey]),
    )[0];

    return {
      ...item,
      player,
      value: player ? getAverages(player)[item.averageKey] : null,
    };
  });

  const handlePress = (playerId: string | number) => {
    const id = String(playerId);
    const currentTeamId = String(teamId);

    router.push({
      pathname: "/player/basketball/[id]",
      params: {
        id,
        teamId: currentTeamId,
        league,
      },
    });
  };

  const LeaderCard = ({
    player,
    label,
    value,
    index,
    total,
  }: {
    player: RosterPlayer;
    label: string;
    value: StatValue;
    index: number;
    total: number;
  }) => {
    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          activeOpacity={activeOpacity}
          onPress={() => handlePress(player.playerId)}
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
                {player.short_name}{" "}
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

  const getPlayerCells = (player: RosterPlayer) => {
    const averages = getAverages(player);
    const totals = getTotals(player);

    const fieldGoalsMadeAttempted = getMadeAttemptedStat(
      averages,
      totals,
      "avgFieldGoalsMade-avgFieldGoalsAttempted",
      "fieldGoalsMade-fieldGoalsAttempted",
    );

    const threePointMadeAttempted = getMadeAttemptedStat(
      averages,
      totals,
      "avgThreePointFieldGoalsMade-avgThreePointFieldGoalsAttempted",
      "threePointFieldGoalsMade-threePointFieldGoalsAttempted",
    );

    const freeThrowsMadeAttempted = getMadeAttemptedStat(
      averages,
      totals,
      "avgFreeThrowsMade-avgFreeThrowsAttempted",
      "freeThrowsMade-freeThrowsAttempted",
    );

    return [
      averages.gamesPlayed,
      averages.avgMinutes,
      averages.avgPoints,
      fieldGoalsMadeAttempted,
      averages.fieldGoalPct ?? totals.fieldGoalPct,
      threePointMadeAttempted,
      averages.threePointFieldGoalPct ?? totals.threePointFieldGoalPct,
      freeThrowsMadeAttempted,
      averages.freeThrowPct ?? totals.freeThrowPct,
      averages.avgOffensiveRebounds,
      averages.avgDefensiveRebounds,
      averages.avgRebounds,
      averages.avgAssists,
      averages.avgSteals,
      averages.avgBlocks,
      averages.avgTurnovers,
      averages.avgFouls,
      "—",
    ];
  };

  const renderStickyPlayerCell = (player: RosterPlayer, index: number) => (
    <View
      key={`${player.playerId}-sticky-name`}
      style={[
        styles.tableRow,
        stickyColumnBg,
        rowBg(index),
        index === activeRoster.length - 1 && { borderBottomWidth: 0 },
      ]}
    >
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={() => handlePress(player.playerId)}
        style={{ width: PLAYER_NAME_WIDTH }}
      >
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.tableCell, styles.playerName]}
        >
          {player.short_name}{" "}
          <Text style={styles.number}>#{player.jersey_number ?? "—"}</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderScrollableStatRow = (player: RosterPlayer, index: number) => {
    const cells = getPlayerCells(player);

    return (
      <View
        key={`${player.playerId}-stats-row`}
        style={[
          styles.tableRow,
          rowBg(index),
          index === activeRoster.length - 1 && { borderBottomWidth: 0 },
        ]}
      >
        {cells.map((val, cellIndex) => (
          <Text
            key={`${player.playerId}-stat-${cellIndex}`}
            style={[
              styles.tableCell,
              styles.statValue,
              {
                width: STAT_CELL_WIDTH,
              },
            ]}
          >
            {formatStatValue(val)}
          </Text>
        ))}
      </View>
    );
  };

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

          {activeRoster.map((player, index) =>
            renderStickyPlayerCell(player, index),
          )}
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
              { width: STAT_HEADERS.length * STAT_CELL_WIDTH },
            ]}
          >
            <View style={[styles.tableRow, headerBg]}>
              {STAT_HEADERS.map((header) => (
                <Text
                  key={header}
                  style={[
                    styles.tableCell,
                    styles.headerText,
                    {
                      width: STAT_CELL_WIDTH,
                    },
                  ]}
                >
                  {header}
                </Text>
              ))}
            </View>

            {activeRoster.map((player, index) =>
              renderScrollableStatRow(player, index),
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );

  const renderPlayerStats = () => {
    if (!activeRoster.length) {
      return (
        <View style={styles.center}>
          <Text style={global.emptyText}>No player stats available.</Text>
        </View>
      );
    }

    const visibleLeaders = statLeaders.filter((item) => item.player);

    return (
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
          {visibleLeaders.map((item, idx) => (
            <LeaderCard
              key={item.label}
              player={item.player}
              label={item.label}
              value={item.value}
              index={idx}
              total={visibleLeaders.length}
            />
          ))}
        </ScrollView>

        {renderPlayerStatsTable()}
      </>
    );
  };

  const renderTeamStats = () => {
    if (!teamStats) return null;

    const summaryRows = getTeamSummaryRows(teamStats);
    const displayAverages = getTeamDisplayAverages(teamStats);
    const displayTotals = getTeamDisplayTotals(teamStats);

    const renderTable = (rows: TeamStatRow[]) => (
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
            <Text style={[styles.tableCell, styles.headerText]}>
              {item.label}
            </Text>

            <Text style={[styles.tableCell, styles.teamStatValue]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    );

    return (
      <View style={styles.teamTableContainer}>
        <View>
          <Text style={styles.categoryTitle}>Team Summary</Text>
          {renderTable(summaryRows)}
        </View>

        <View>
          <Text style={styles.categoryTitle}>Per-Game Averages</Text>
          {renderTable(displayAverages)}
        </View>

        <View>
          <Text style={styles.categoryTitle}>Team Totals</Text>
          {renderTable(displayTotals)}
        </View>
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

  if (!activeRoster.length && !teamStats) {
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
