 import { Ionicons } from "@expo/vector-icons";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import { LEAGUE_CONFIG } from "constants/leagues";
import { Colors, Fonts, activeOpacity } from "constants/styles";
import { useFavoriteTeamsContext } from "contexts/FavoriteTeamsContext";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useLeagueStandings } from "hooks/LeagueHooks/useLeagueStandings";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  ExploreStandingsLeague,
  ExploreWidgetSize,
} from "types/widgets";
import {
  buildStandingsPreviewRows,
  formatStandingsMetric,
  formatStandingsRecord,
} from "utils/standingsWidget";
import StandingsLeagueModal from "../StandingsLeagueModal";
import { WidgetEditControls } from "./WidgetSlider";

type StandingsWidgetProps = {
  isDark: boolean;
  size: ExploreWidgetSize;
  width: number;
  height: number;
  league: ExploreStandingsLeague;
  onChangeLeague: (league: ExploreStandingsLeague) => void;
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

type StandingsTableProps = Pick<
  StandingsWidgetProps,
  "height" | "isDark" | "isEditing" | "league"
>;

function StandingsTable({
  height,
  isDark,
  isEditing,
  league,
}: StandingsTableProps) {
  const { allTeams } = useFavoriteTeamsContext();
  const { standings, seasonDisplayName, loading, error, refetch } =
    useLeagueStandings(league);
  const styles = useMemo(() => standingsWidgetStyles(isDark), [isDark]);
  const rowLimit = Math.max(3, Math.min(10, Math.floor((height - 105) / 30)));
  const rows = useMemo(
    () => buildStandingsPreviewRows(standings, rowLimit),
    [rowLimit, standings],
  );
  const teamLogoById = useMemo(
    () =>
      new Map(
        allTeams
          .filter((team) => team.league.toLowerCase() === league)
          .map((team) => [
            String(team.id),
            isDark ? (team.logoLight ?? team.logo) : team.logo,
          ]),
      ),
    [allTeams, isDark, league],
  );

  if (loading) {
    return (
      <View style={styles.state}>
        <CustomActivityIndicator />
        <Text style={styles.stateText}>Loading standings…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <Pressable
        disabled={isEditing}
        onPress={() => {
          void refetch();
        }}
        style={({ pressed }) => [
          styles.state,
          pressed && !isEditing && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Retry loading standings"
        accessibilityState={{ disabled: isEditing }}
      >
        <Ionicons name="refresh" size={22} color={Colors.midTone} />
        <Text style={styles.stateTitle}>Unable to load standings</Text>
        <Text style={styles.stateText} numberOfLines={2}>
          Tap to try again.
        </Text>
      </Pressable>
    );
  }

  if (rows.length === 0) {
    return (
      <View style={styles.state}>
        <Ionicons name="podium-outline" size={24} color={Colors.midTone} />
        <Text style={styles.stateTitle}>No standings available</Text>
        <Text style={styles.stateText} numberOfLines={2}>
          Check back when the league publishes its table.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.table, isEditing && styles.tableEditing]}>
      <View style={styles.tableHeader}>
        <Text style={[styles.columnLabel, styles.positionColumn]}>#</Text>
        <Text style={[styles.columnLabel, styles.teamColumn]}>Team</Text>
        <Text style={[styles.columnLabel, styles.recordColumn]}>Record</Text>
        <Text style={[styles.columnLabel, styles.metricColumn]}>
          {league === "nhl" ? "PTS" : "PCT"}
        </Text>
      </View>

      {rows.map(({ conference, position, team }) => {
        const logo = teamLogoById.get(team.id);

        return (
          <View key={`${conference}:${team.id}`} style={styles.row}>
            <Text style={[styles.position, styles.positionColumn]}>
              {position}
            </Text>
            <View style={[styles.teamCell, styles.teamColumn]}>
              {logo ? (
                <Image source={logo} style={styles.teamLogo} contentFit="contain" />
              ) : (
                <View style={styles.logoFallback}>
                  <Text style={styles.logoFallbackText}>
                    {(team.code || team.name).slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.teamCopy}>
                <Text style={styles.teamName} numberOfLines={1}>
                  {team.shortName || team.name}
                </Text>
                <Text style={styles.conference} numberOfLines={1}>
                  {conference}
                </Text>
              </View>
            </View>
            <Text style={[styles.stat, styles.recordColumn]}>
              {formatStandingsRecord(team, league)}
            </Text>
            <Text style={[styles.stat, styles.metricColumn]}>
              {formatStandingsMetric(team, league)}
            </Text>
          </View>
        );
      })}

      {seasonDisplayName ? (
        <Text style={styles.season} numberOfLines={1}>
          {seasonDisplayName}
        </Text>
      ) : null}
    </View>
  );
}

export default function StandingsWidget({
  isDark,
  size,
  width,
  height,
  league,
  onChangeLeague,
  widgetId,
  widgetSize,
  isEditing,
  availableSizeOptions,
  onResizeWidget,
  onRemoveWidget,
  onMoveWidget,
  canMoveUp,
  canMoveDown,
}: StandingsWidgetProps) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const styles = useMemo(() => standingsWidgetStyles(isDark), [isDark]);
  const leagueConfig = LEAGUE_CONFIG[league];

  const handleSelectLeague = useCallback(
    (nextLeague: ExploreStandingsLeague) => {
      onChangeLeague(nextLeague);
    },
    [onChangeLeague],
  );

  return (
    <>
      <BlurView
        intensity={100}
        style={[styles.container, { width, height }]}
      >
        <View style={styles.header}>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>Standings</Text>
            <Text style={styles.subtitle}>Conference leaders</Text>
          </View>

          <Pressable
            disabled={isEditing}
            onPress={() => setPickerVisible(true)}
            style={({ pressed }) => [
              styles.leagueButton,
              pressed && !isEditing && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Change standings league. Currently ${leagueConfig.label}`}
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

        <StandingsTable
          key={league}
          height={height}
          isDark={isDark}
          isEditing={isEditing}
          league={league}
        />

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
            compact={size === "small"}
          />
        ) : null}
      </BlurView>

      <StandingsLeagueModal
        visible={pickerVisible}
        isDark={isDark}
        selectedLeague={league}
        onClose={() => setPickerVisible(false)}
        onSelect={handleSelectLeague}
      />
    </>
  );
}

const standingsWidgetStyles = (isDark: boolean) =>
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
      gap: 10,
      minHeight: 52,
      paddingHorizontal: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    headingCopy: {
      flex: 1,
    },
    title: {
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 17,
      color: isDark ? Colors.white : Colors.black,
    },
    subtitle: {
      paddingTop: 1,
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
    leagueButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minHeight: 34,
      paddingHorizontal: 9,
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
      paddingHorizontal: 10,
    },
    tableEditing: {
      paddingBottom: 54,
    },
    tableHeader: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 23,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    columnLabel: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 9,
      letterSpacing: 0.5,
      color: Colors.midTone,
      textTransform: "uppercase",
    },
    positionColumn: {
      width: 24,
      textAlign: "center",
    },
    teamColumn: {
      flex: 1,
      minWidth: 0,
    },
    recordColumn: {
      width: 60,
      textAlign: "right",
    },
    metricColumn: {
      width: 45,
      textAlign: "right",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 30,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    position: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 12,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      fontVariant: ["tabular-nums"],
    },
    teamCell: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 5,
    },
    teamLogo: {
      width: 22,
      height: 22,
    },
    logoFallback: {
      alignItems: "center",
      justifyContent: "center",
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },
    logoFallbackText: {
      fontFamily: Fonts.BOLD,
      fontSize: 8,
      color: isDark ? Colors.white : Colors.black,
    },
    teamCopy: {
      flex: 1,
      minWidth: 0,
    },
    teamName: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 12,
      color: isDark ? Colors.white : Colors.black,
    },
    conference: {
      fontFamily: Fonts.REGULAR,
      fontSize: 9,
      color: Colors.midTone,
    },
    stat: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 11,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      fontVariant: ["tabular-nums"],
    },
    season: {
      paddingTop: 4,
      fontFamily: Fonts.REGULAR,
      fontSize: 9,
      color: Colors.midTone,
      textAlign: "right",
    },
    state: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingHorizontal: 18,
    },
    stateTitle: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    stateText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      lineHeight: 15,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textAlign: "center",
    },
    pressed: {
      opacity: activeOpacity,
    },
  });
