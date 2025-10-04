import { Fonts } from "constants/fonts";
import { getNFLTeamsLogo, getTeamInfo } from "constants/teamsNFL";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import HeadingTwo from "../../Headings/HeadingTwo";
const COLLAPSED_ROWS = 5;
const ROW_HEIGHT = 64;

type NFLGameTeamStatsProps = {
  stats: any[] | null | undefined;
  lighter?: boolean;
};

// NFL-specific stat keys to display
const STAT_KEYS = [
  { key: "first_downs.total", label: "First Downs" },
  { key: "passing.total", label: "Passing Yards" },
  { key: "rushings.total", label: "Rushing Yards" },
  { key: "yards.total", label: "Total Yards" },
  { key: "plays.total", label: "Total Plays" },
  { key: "turnovers.total", label: "Turnovers" },
  { key: "penalties.total", label: "Penalties" },
  { key: "posession.total", label: "Time of Possession" },
  { key: "points_against.total", label: "Points Allowed" },
  { key: "sacks.total", label: "Sacks" },
];

// Safely get nested value from object like "passing.total"
const getValue = (obj: any, path: string) => {
  if (!obj) return undefined;
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
};

export default function NFLGameTeamStats({
  stats,
  lighter,
}: NFLGameTeamStatsProps) {
  const isDark = useColorScheme() === "dark";
  const [expanded, setExpanded] = useState(false);
  const heightAnim = useRef(
    new Animated.Value(COLLAPSED_ROWS * ROW_HEIGHT)
  ).current;

  // ✅ Safe: conditional rendering AFTER hooks
  if (!stats || stats.length < 2) {
    return null;
  }

  const teamA = stats[0];
  const teamB = stats[1];

  const getTeamColor = (teamId?: number) => {
    const team = getTeamInfo(teamId ?? 0);
    if (!team) return "#fff";

    const primary = team.color ?? "#fff";
    const secondary = team.secondaryColor ?? primary;

    if (isDark) {
      // ✅ Apply overrides only in dark mode
      if (team.code === "BAL") return "#fff";
      if (team.code === "ATL") return primary;
      if (team.code === "TB") return primary;
      if (team.code === "PHI") return "#fff";

      // default in dark mode
      return secondary;
    }

    // ✅ Light mode → always primary
    return primary;
  };

  const textColor = lighter ? "#fff" : isDark ? "#fff" : "#000";
  const dividerColor = lighter ? "#fff" : isDark ? "#888" : "#888";

  // Safe: optional chaining
  const teamNameA = getTeamInfo(teamA?.team?.id) ?? { code: "Home" };
  const teamNameB = getTeamInfo(teamB?.team?.id) ?? { code: "Away" };

  const teamALogo = getNFLTeamsLogo(teamA?.team.id, isDark);
  const teamBLogo = getNFLTeamsLogo(teamB?.team.id, isDark);

  // Pick team color, but override for Denver and Raiders

  const teamAColor = getTeamColor(teamA?.team?.id);
  const teamBColor = getTeamColor(teamB?.team?.id);

  useEffect(() => {
    const toValue = expanded
      ? Math.max(STAT_KEYS.length * ROW_HEIGHT, COLLAPSED_ROWS * ROW_HEIGHT)
      : COLLAPSED_ROWS * ROW_HEIGHT;

    Animated.timing(heightAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  return (
    <View>
      <HeadingTwo lighter={lighter}>Team Stats</HeadingTwo>

      {/* Logos Row */}
      <View style={[styles.logosRow, { borderColor: dividerColor }]}>
        <View style={styles.teamContainer}>
          <Image source={teamBLogo} style={styles.logo} />

          <Text style={[styles.teamLabel, { color: textColor, marginLeft: 4 }]}>
            {teamNameB?.code ?? "Away"}
          </Text>
        </View>

        <View style={styles.teamContainer}>
          <Image source={teamALogo} style={styles.logo} />

          <Text style={[styles.teamLabel, { color: textColor }]}>
            {teamNameA?.code ?? "Home"}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <ScrollView style={[styles.container, { borderColor: dividerColor }]}>
        <Animated.View style={{ maxHeight: heightAnim, overflow: "hidden" }}>
          {STAT_KEYS.map(({ key, label }) => {
            const valueA = getValue(teamA?.statistics, key) ?? 0;
            const valueB = getValue(teamB?.statistics, key) ?? 0;

            const max = Math.max(Math.abs(valueA), Math.abs(valueB), 1);
            const isTeamALower = valueA < valueB;
            const isTeamBLower = valueB < valueA;

            return (
              <View key={key} style={styles.statSection}>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: dividerColor },
                  ]}
                />
                <Text style={[styles.statLabel, { color: textColor }]}>
                  {label}
                </Text>
                <View style={styles.row}>
                  <Text style={[styles.barText, { color: textColor }]}>
                    {valueB}
                  </Text>
                  <View style={styles.barContainerLeft}>
                    <View
                      style={[
                        styles.bar,
                        {
                          backgroundColor: teamBColor,
                          width: `${(Math.abs(valueB) / max) * 100}%`,
                          opacity: isTeamBLower ? 0.5 : 1,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.barContainerRight}>
                    <View
                      style={[
                        styles.bar,
                        {
                          backgroundColor: teamAColor,
                          width: `${(Math.abs(valueA) / max) * 100}%`,
                          opacity: isTeamALower ? 0.5 : 1,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barText, { color: textColor }]}>
                    {valueA}
                  </Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* Expand/Collapse */}
        <Pressable
          onPress={() => setExpanded((prev) => !prev)}
          style={{
            paddingVertical: 12,
            justifyContent: "center",
            alignItems: "center",
            borderTopWidth: 1,
            borderColor: dividerColor,
          }}
        >
          <Text
            style={{
              color: textColor,
              fontFamily: Fonts.OSMEDIUM,
              fontSize: 14,
            }}
          >
            {expanded ? "Show Less" : "Show More"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 12,
  },
  logosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
    alignItems: "center",
    borderColor: "#888",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  teamContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  teamLabel: {
    fontFamily: Fonts.OSMEDIUM,
    fontSize: 16,
  },
  statSection: {
    marginBottom: 16,
    height: ROW_HEIGHT,
  },
  dividerLine: {
    height: 1,
    width: "100%",
  },
  statLabel: {
    fontFamily: Fonts.OSREGULAR,
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  barContainerLeft: {
    flex: 1,
    alignItems: "flex-start",
    marginLeft: 12,
  },
  barContainerRight: {
    flex: 1,
    alignItems: "flex-end",
    marginRight: 12,
  },
  bar: {
    height: 8,
    justifyContent: "center",
    borderRadius: 100,
  },
  barText: {
    fontFamily: Fonts.OSSEMIBOLD,
    fontSize: 14,
    textAlign: "center",
  },
});
