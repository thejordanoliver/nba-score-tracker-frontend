import { Ionicons } from "@expo/vector-icons";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import { LEAGUE_CONFIG } from "constants/leagues";
import { Colors, Fonts } from "constants/styles";
import { getCBBTeamByESPNId, getCBBTeamLogo } from "constants/teamsCBB";
import {
  getCFBTeam,
  getCFBTeamByESPNId,
  getCFBTeamLogo,
} from "constants/teamsCFB";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  type CBBTeamRank,
  useCBBRankings,
} from "hooks/BasketballHooks/useCBBRankings";
import {
  type CFBTeamRank,
  useCFBRankings,
} from "hooks/FootballHooks/useCFBRankings";
import type { ComponentProps } from "react";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  ExploreCollegePollLeague,
  ExploreCollegePollType,
  ExploreWidgetSize,
} from "types/widgets";
import {
  getCollegePollLabel,
  getCollegePollPreviewLimit,
  normalizeCollegePollType,
} from "utils/collegePollWidget";
import CollegePollSettingsModal from "../CollegePollSettingsModal";
import { WidgetEditControls } from "./WidgetSlider";

type CollegePollWidgetProps = {
  isDark: boolean;
  size: ExploreWidgetSize;
  width: number;
  height: number;
  league: ExploreCollegePollLeague;
  pollType: ExploreCollegePollType;
  onChangeSelection: (
    league: ExploreCollegePollLeague,
    pollType: ExploreCollegePollType,
  ) => void;
  widgetId: string;
  widgetSize: ExploreWidgetSize;
  isEditing: boolean;
  availableSizeOptions: readonly ExploreWidgetSize[];
  onResizeWidget: (widgetId: string, size: ExploreWidgetSize) => void;
  onRemoveWidget: (widgetId: string) => void;
  onMoveWidget: (widgetId: string, direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
};

type CollegePollRow = {
  key: string;
  rank: number;
  trend: number;
  points: number;
  record: string;
  teamId?: string | number;
  teamCode: string;
  teamName: string;
  logo?: ComponentProps<typeof Image>["source"];
};

type CollegePollTableProps = {
  compact: boolean;
  isDark: boolean;
  isEditing: boolean;
  league: ExploreCollegePollLeague;
  loading: boolean;
  error: string | null;
  rows: CollegePollRow[];
  onRetry: () => void | Promise<void>;
};

function CollegePollTable({
  compact,
  isDark,
  isEditing,
  league,
  loading,
  error,
  rows,
  onRetry,
}: CollegePollTableProps) {
  const router = useRouter();
  const styles = useMemo(
    () => collegePollWidgetStyles(isDark, compact),
    [compact, isDark],
  );

  if (loading) {
    return (
      <View style={styles.state}>
        <CustomActivityIndicator />
        <Text style={styles.stateText}>Loading poll…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <Pressable
        disabled={isEditing}
        onPress={() => {
          void onRetry();
        }}
        style={({ pressed }) => [
          styles.state,
          pressed && !isEditing && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Retry loading college poll"
        accessibilityState={{ disabled: isEditing }}
      >
        <Ionicons name="refresh" size={22} color={Colors.midTone} />
        <Text style={styles.stateTitle}>Unable to load poll</Text>
        <Text style={styles.stateText}>Tap to try again.</Text>
      </Pressable>
    );
  }

  if (rows.length === 0) {
    return (
      <View style={styles.state}>
        <Ionicons name="school-outline" size={24} color={Colors.midTone} />
        <Text style={styles.stateTitle}>No poll available</Text>
        <Text style={styles.stateText} numberOfLines={2}>
          Rankings will appear when the next poll is published.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.table, isEditing && styles.tableEditing]}>
      <View style={styles.tableHeader}>
        <Text style={[styles.columnLabel, styles.rankColumn]}>#</Text>
        <Text style={[styles.columnLabel, styles.teamColumn]}>Team</Text>
        <Text style={[styles.columnLabel, styles.recordColumn]}>Record</Text>
        {!compact ? (
          <Text style={[styles.columnLabel, styles.pointsColumn]}>PTS</Text>
        ) : null}
      </View>

      {rows.map((row) => {
        const movement = row.trend;
        const movedUp = movement > 0;
        const movementColor = movedUp
          ? isDark
            ? Colors.dark.leafGreen
            : Colors.light.green
          : isDark
            ? Colors.dark.lightRed
            : Colors.light.red;

        return (
          <Pressable
            key={row.key}
            disabled={isEditing || row.teamId == null}
            onPress={() => {
              if (row.teamId == null) return;

              router.push({
                pathname:
                  league === "cfb"
                    ? "/team/cfb/[teamId]"
                    : "/team/cbb/[teamId]",
                params: { teamId: String(row.teamId) },
              });
            }}
            style={({ pressed }) => [
              styles.row,
              pressed && !isEditing && styles.pressed,
            ]}
            accessibilityRole={row.teamId == null ? undefined : "button"}
            accessibilityLabel={
              row.teamId == null ? undefined : `Open ${row.teamName} team page`
            }
            accessibilityState={{ disabled: isEditing || row.teamId == null }}
          >
            <Text style={[styles.rank, styles.rankColumn]}>{row.rank}</Text>
            <View style={[styles.teamCell, styles.teamColumn]}>
              {row.logo ? (
                <Image
                  source={row.logo}
                  style={styles.teamLogo}
                  contentFit="contain"
                />
              ) : (
                <View style={styles.logoFallback}>
                  <Text style={styles.logoFallbackText}>
                    {row.teamCode.slice(0, 2)}
                  </Text>
                </View>
              )}
              <Text style={styles.teamName} numberOfLines={1}>
                {row.teamCode || row.teamName}
              </Text>
              {!compact && movement !== 0 ? (
                <View style={styles.trend}>
                  <Ionicons
                    name={movedUp ? "arrow-up" : "arrow-down"}
                    size={9}
                    color={movementColor}
                  />
                  <Text style={[styles.trendText, { color: movementColor }]}>
                    {Math.abs(movement)}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.stat, styles.recordColumn]} numberOfLines={1}>
              {row.record || "—"}
            </Text>
            {!compact ? (
              <Text style={[styles.stat, styles.pointsColumn]}>
                {row.points}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function CFBPollTable({
  compact,
  isDark,
  isEditing,
  pollType,
  rowLimit,
}: {
  compact: boolean;
  isDark: boolean;
  isEditing: boolean;
  pollType: ExploreCollegePollType;
  rowLimit: number;
}) {
  const { rankings, loading, error, refresh } = useCFBRankings();
  const selectedPoll = rankings.find((poll) => poll.type === pollType);
  const rows = useMemo<CollegePollRow[]>(
    () =>
      (selectedPoll?.ranks ?? [])
        .slice(0, rowLimit)
        .map((rank, index) => createCFBRow(rank, index, isDark)),
    [isDark, rowLimit, selectedPoll?.ranks],
  );

  return (
    <CollegePollTable
      compact={compact}
      isDark={isDark}
      isEditing={isEditing}
      league="cfb"
      loading={loading}
      error={error}
      rows={rows}
      onRetry={refresh}
    />
  );
}

function CBBPollTable({
  compact,
  isDark,
  isEditing,
  pollType,
  rowLimit,
}: {
  compact: boolean;
  isDark: boolean;
  isEditing: boolean;
  pollType: ExploreCollegePollType;
  rowLimit: number;
}) {
  const { rankings, loading, error, refresh } = useCBBRankings("cbb");
  const selectedPoll =
    rankings.find((poll) => poll.type === pollType) ??
    rankings.find((poll) =>
      pollType === "ap"
        ? poll.shortName === "AP Poll"
        : poll.shortName === "Coaches Poll",
    );
  const rows = useMemo<CollegePollRow[]>(
    () =>
      (selectedPoll?.ranks ?? [])
        .slice(0, rowLimit)
        .map((rank, index) => createCBBRow(rank, index, isDark)),
    [isDark, rowLimit, selectedPoll?.ranks],
  );

  return (
    <CollegePollTable
      compact={compact}
      isDark={isDark}
      isEditing={isEditing}
      league="cbb"
      loading={loading}
      error={error}
      rows={rows}
      onRetry={refresh}
    />
  );
}

function createCFBRow(
  rank: CFBTeamRank,
  index: number,
  isDark: boolean,
): CollegePollRow {
  const apiTeam = rank.team;
  const localTeam = apiTeam
    ? (getCFBTeam(apiTeam.id) ??
      (apiTeam.espnId != null ? getCFBTeamByESPNId(apiTeam.espnId) : undefined))
    : undefined;
  const teamCode = localTeam?.code || apiTeam?.code || "N/A";

  return {
    key: `cfb:${localTeam?.id ?? apiTeam?.id ?? index}:${rank.current}`,
    rank: rank.current,
    trend: Number(rank.trend) || 0,
    points: rank.points ?? 0,
    record: rank.recordSummary,
    teamId: localTeam?.id,
    teamCode,
    teamName:
      localTeam?.shortName || localTeam?.name || apiTeam?.name || teamCode,
    logo: localTeam ? getCFBTeamLogo(localTeam.id, isDark) : undefined,
  };
}

function createCBBRow(
  rank: CBBTeamRank,
  index: number,
  isDark: boolean,
): CollegePollRow {
  const apiTeam = rank.team;
  const localTeam = apiTeam
    ? getCBBTeamByESPNId(apiTeam.espnId ?? apiTeam.id ?? "")
    : undefined;
  const teamCode = localTeam?.code || apiTeam?.code || "N/A";

  return {
    key: `cbb:${localTeam?.id ?? apiTeam?.id ?? index}:${rank.current}`,
    rank: rank.current,
    trend: Number(rank.trend) || 0,
    points: rank.points ?? 0,
    record: rank.recordSummary,
    teamId: localTeam?.id ?? undefined,
    teamCode,
    teamName:
      localTeam?.shortName || localTeam?.name || apiTeam?.name || teamCode,
    logo: localTeam
      ? getCBBTeamLogo(localTeam.id ?? undefined, isDark)
      : undefined,
  };
}

export default function CollegePollWidget({
  isDark,
  size,
  width,
  height,
  league,
  pollType,
  onChangeSelection,
  widgetId,
  widgetSize,
  isEditing,
  availableSizeOptions,
  onResizeWidget,
  onRemoveWidget,
  onMoveWidget,
  canMoveUp,
  canMoveDown,
}: CollegePollWidgetProps) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const compact = size === "small" || width < 240;
  const styles = useMemo(
    () => collegePollWidgetStyles(isDark, compact),
    [compact, isDark],
  );
  const leagueConfig = LEAGUE_CONFIG[league];
  const normalizedPollType = normalizeCollegePollType(league, pollType);
  const pollLabel = getCollegePollLabel(league, normalizedPollType);
  const rowLimit = getCollegePollPreviewLimit(height, compact);

  return (
    <>
      <BlurView intensity={100} style={[styles.container, { width, height }]}>
        <View style={styles.header}>
          <View style={styles.headingCopy}>
            <Text style={styles.title} numberOfLines={1}>
              College Polls
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {pollLabel}
            </Text>
          </View>

          <Pressable
            disabled={isEditing}
            onPress={() => setPickerVisible(true)}
            style={({ pressed }) => [
              styles.leagueButton,
              pressed && !isEditing && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Change college poll. Currently ${leagueConfig.label}, ${pollLabel}`}
            accessibilityState={{ disabled: isEditing }}
          >
            <Image
              source={isDark ? leagueConfig.logoLight : leagueConfig.logo}
              style={styles.leagueLogo}
              contentFit="contain"
            />
            <Text style={styles.leagueLabel}>{league.toUpperCase()}</Text>
            <Ionicons name="chevron-down" size={13} color={Colors.midTone} />
          </Pressable>
        </View>

        {league === "cfb" ? (
          <CFBPollTable
            key={`cfb:${normalizedPollType}`}
            compact={compact}
            isDark={isDark}
            isEditing={isEditing}
            pollType={normalizedPollType}
            rowLimit={rowLimit}
          />
        ) : (
          <CBBPollTable
            key={`cbb:${normalizedPollType}`}
            compact={compact}
            isDark={isDark}
            isEditing={isEditing}
            pollType={normalizedPollType}
            rowLimit={rowLimit}
          />
        )}

        {isEditing ? (
          <WidgetEditControls
            isDark={isDark}
            widgetId={widgetId}
            widgetSize={widgetSize}
            availableSizeOptions={availableSizeOptions}
            onResizeWidget={onResizeWidget}
            onRemoveWidget={onRemoveWidget}
            onMoveWidget={onMoveWidget}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            compact={compact}
          />
        ) : null}
      </BlurView>

      <CollegePollSettingsModal
        visible={pickerVisible}
        isDark={isDark}
        selectedLeague={league}
        selectedPollType={normalizedPollType}
        onClose={() => setPickerVisible(false)}
        onSelect={onChangeSelection}
      />
    </>
  );
}

const collegePollWidgetStyles = (isDark: boolean, compact: boolean) =>
  StyleSheet.create({
    container: {
      position: "relative",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 8,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: compact ? 6 : 12,
      minHeight: compact ? 54 : 58,
      paddingHorizontal: compact ? 8 : 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    headingCopy: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontFamily: Fonts.SEMIBOLD,
      fontSize: compact ? 14 : 17,
      color: isDark ? Colors.white : Colors.black,
    },
    subtitle: {
      paddingTop: 1,
      fontFamily: Fonts.REGULAR,
      fontSize: compact ? 10 : 11,
      color: Colors.midTone,
    },
    
    leagueButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: compact ? 4 : 5,
      minHeight: compact ? 32 : 34,
      paddingHorizontal: compact ? 6 : 9,
      borderRadius: 17,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },
    leagueLogo: {
      width: 22,
      height: 22,
    },
    leagueLabel: {
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 12,
      color: isDark ? Colors.white : Colors.black,
    },
    table: {
      flex: 1,
      minHeight: 0,
    },
    tableEditing: {
      opacity: 0.62,
    },
    tableHeader: {
      flexDirection: "row",
      alignItems: "center",
      height: 25,
      paddingHorizontal: compact ? 6 : 9,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      height: 30,
      paddingHorizontal: compact ? 6 : 9,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    columnLabel: {
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 9,
      color: Colors.midTone,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    rankColumn: {
      width: compact ? 22 : 25,
      textAlign: "center",
    },
    teamColumn: {
      flex: 1,
      minWidth: 0,
    },
    recordColumn: {
      width: compact ? 50 : 58,
      textAlign: "center",
    },
    pointsColumn: {
      width: 42,
      textAlign: "right",
    },
    rank: {
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 12,
      color: isDark ? Colors.white : Colors.black,
    },
    teamCell: {
      flexDirection: "row",
      alignItems: "center",
      gap: compact ? 4 : 6,
    },
    teamLogo: {
      width: compact ? 20 : 21,
      height: compact ? 20 : 21,
    },
    logoFallback: {
      alignItems: "center",
      justifyContent: "center",
      width: compact ? 20 : 21,
      height: compact ? 20 : 21,
      borderRadius: 6,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },
    logoFallbackText: {
      fontFamily: Fonts.BOLD,
      fontSize: 7,
      color: isDark ? Colors.white : Colors.black,
    },
    teamName: {
      flexShrink: 1,
      fontFamily: Fonts.MEDIUM,
      fontSize: compact ? 10 : 11,
      color: isDark ? Colors.white : Colors.black,
    },
    trend: {
      flexDirection: "row",
      alignItems: "center",
      gap: 1,
    },
    trendText: {
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 8,
    },
    stat: {
      fontFamily: Fonts.REGULAR,
      fontSize: 10,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      fontVariant: ["tabular-nums"],
    },
    state: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      padding: 12,
    },
    stateTitle: {
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 14,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    stateText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      lineHeight: 15,
      color: Colors.midTone,
      textAlign: "center",
    },
    pressed: {
      opacity: 0.72,
    },
  });
