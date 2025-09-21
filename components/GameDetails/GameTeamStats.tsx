import { Fonts } from "constants/fonts";
import { teamsById } from "constants/teams";
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
import HeadingTwo from "../Headings/HeadingTwo";

const COLLAPSED_ROWS = 5;
const ROW_HEIGHT = 64;

const STAT_KEYS = [
  { key: "assists", label: "Assists" },
  { key: "totReb", label: "Rebounds" },
  { key: "offReb", label: "Offensive Rebounds" },
  { key: "defReb", label: "Defensive Rebounds" },
  { key: "steals", label: "Steals" },
  { key: "blocks", label: "Blocks" },
  { key: "turnovers", label: "Turnovers" },
  { key: "biggestLead", label: "Biggest Lead" },
  { key: "pointsInPaint", label: "Points in Paint" },
  { key: "secondChancePoints", label: "Second Chance Points" },
  { key: "longestRun", label: "Longest Run" },
  { key: "pFouls", label: "Personal Fouls" },
  { key: "fgm", label: "Field Goals Made" },
  { key: "fga", label: "Field Goals Attempted" },
  { key: "fgp", label: "Field Goals Percentage" },
  { key: "ftm", label: "Free Throws Made" },
  { key: "fta", label: "Free Throws Attempted" },
  { key: "ftp", label: "Free Throws Percentage" },
  { key: "tpm", label: "Three Points Made" },
  { key: "tpa", label: "Three Points Attempted" },
  { key: "plusMinus", label: "Plus/Minus" },
];

export default function GameTeamStats({
  stats,
  lighter,
}: {
  stats: any[];
  lighter?: boolean;
}) {
  const isDark = useColorScheme() === "dark";
  if (!stats || stats.length < 2) return null;

  const [expanded, setExpanded] = useState(false);
  const heightAnim = useRef(
    new Animated.Value(COLLAPSED_ROWS * ROW_HEIGHT)
  ).current;

  const teamA = stats[0];
  const teamB = stats[1];
  const statA = teamA.statistics?.[0];
  const statB = teamB.statistics?.[0];
  if (!statA || !statB) return null;

  const teamDataA = teamsById[teamA.team.id];
  const teamDataB = teamsById[teamB.team.id];
  const textColor = lighter ? "#fff" : isDark ? "#fff" : "#000";
  const dividerColor = lighter ? "#fff" : isDark ? "#888" : "#888";
  const getTeamBarColor = (team: any) => {
    const darkTeams = [
      "MEM",
      "BKN",
      "NOP",
      "MIN",
      "DEN",
      "PHX",
      "MIL",
      "SAS",
      "CLE",
      "WAS",
      "IND",
      "LAL",
      "UTA",
      "ATL",
      "NYK",
      "LAC",
      "SAC",
      "WAS",
    ];
    const isDarkTeam = darkTeams.includes(team?.code);
    if (isDark && isDarkTeam && team?.secondaryColor) {
      return team.secondaryColor;
    }
    return team?.color;
  };

  useEffect(() => {
    const toValue = expanded
      ? STAT_KEYS.length * ROW_HEIGHT
      : COLLAPSED_ROWS * ROW_HEIGHT;
    Animated.timing(heightAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  return (
    <View>
      <HeadingTwo lighter={lighter}>Game Stats</HeadingTwo>
      <View style={[styles.logosRow, { borderColor: dividerColor }]}>
        <View style={styles.teamContainer}>
          <Image
            source={
              isDark ? teamDataB.logoLight || teamDataB.logo : teamDataB.logo
            }
            style={styles.logo}
          />
          <Text style={[styles.teamLabel, { color: textColor, marginLeft: 4 }]}>
            {teamDataB.code}
          </Text>
        </View>

        <View style={styles.teamContainer}>
          <Image
            source={
              isDark ? teamDataA.logoLight || teamDataA.logo : teamDataA.logo
            }
            style={styles.logo}
          />
          <Text style={[styles.teamLabel, { color: textColor }]}>
            {teamDataA.code}
          </Text>
        </View>
      </View>
      <ScrollView style={[styles.container, { borderColor: dividerColor }]}>
        <Animated.View style={{ maxHeight: heightAnim, overflow: "hidden" }}>
          {STAT_KEYS.map(({ key, label }) => {
            const rawValueA = statA[key];
            const rawValueB = statB[key];
            if (rawValueA == null && rawValueB == null) return null;

            const valueA = rawValueA ?? 0;
            const valueB = rawValueB ?? 0;
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
                    {["fgp", "ftp", "tpp"].includes(key)
                      ? `${valueB}%`
                      : valueB}
                  </Text>
                  <View style={styles.barContainerLeft}>
                    <View
                      style={[
                        styles.bar,
                        {
                          backgroundColor: getTeamBarColor(teamDataB),
                          width: `${(Math.abs(valueB) / max) * 100}%`, // for team B,                          opacity: isTeamBLower ? 0.5 : 1,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.barContainerRight}>
                    <View
                      style={[
                        styles.bar,
                        {
                          backgroundColor: getTeamBarColor(teamDataA),
                          width: `${(Math.abs(valueA) / max) * 100}%`, // for team A
                          opacity: isTeamALower ? 0.5 : 1,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barText, { color: textColor }]}>
                    {["fgp", "ftp", "tpp"].includes(key)
                      ? `${valueA}%`
                      : valueA}
                  </Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

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
    zIndex: 1,
    elevation: 3,
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
