import { Fonts } from "constants/fonts";
import { teamsById } from "constants/teams";
import { useGameLeaders } from "hooks/useGameLeaders";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  useColorScheme,
  View,
} from "react-native";

import HeadingTwo from "../Headings/HeadingTwo";

const COLUMN_WIDTH = 50;
const NAME_COLUMN_WIDTH = 160;
const PLAYER_ROW_HEIGHT = 36;
const COLLAPSED_ROWS = 5;
const COLLAPSED_HEIGHT = PLAYER_ROW_HEIGHT * COLLAPSED_ROWS;

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  gameId: string;
  homeTeamId: number;
  awayTeamId: number;
};

export default function BoxScore({ gameId, homeTeamId, awayTeamId }: Props) {
  const { data, isLoading, isError } = useGameLeaders(
    gameId,
    homeTeamId,
    awayTeamId
  );
  const isDark = useColorScheme() === "dark";

  const [expandedTeams, setExpandedTeams] = useState<{
    [teamCode: string]: boolean;
  }>({});

  const heightAnimMap = useRef<{ [teamCode: string]: Animated.Value }>({});

  const homeTeam = teamsById[String(homeTeamId)];
  const awayTeam = teamsById[String(awayTeamId)];

  const homePlayers = data?.filter((p) => p.teamType === "home") || [];
  const awayPlayers = data?.filter((p) => p.teamType === "away") || [];

  // Return null if no players
  if (!homePlayers.length && !awayPlayers.length) return null;

  // Initialize animated values for teams once
  [homeTeam?.code, awayTeam?.code].forEach((code) => {
    if (code && !heightAnimMap.current[code]) {
      heightAnimMap.current[code] = new Animated.Value(COLLAPSED_HEIGHT);
    }
  });

  // Animate height changes when expandedTeams changes
  useEffect(() => {
    [homeTeam?.code, awayTeam?.code].forEach((code) => {
      if (!code) return;
      const isExpanded = expandedTeams[code] ?? false;
      const players = code === homeTeam?.code ? homePlayers : awayPlayers;
      const toValue = isExpanded
        ? players.length * PLAYER_ROW_HEIGHT
        : COLLAPSED_HEIGHT;

      Animated.timing(heightAnimMap.current[code], {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, [expandedTeams, homePlayers.length, awayPlayers.length]);

  const formatMin = (min: string | number) => {
    if (!min) return "0.0";
    if (typeof min === "string" && min.includes(":")) {
      const [minPart, secPart] = min.split(":").map(Number);
      return (minPart + secPart / 60).toFixed(1);
    }
    return Number(min).toFixed(0);
  };

  const STAT_LABELS = [
    "MIN",
    "PTS",
    "FGM",
    "FGA",
    "FG%",
    "3PM",
    "3PA",
    "3P%",
    "FTM",
    "FTA",
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

  const percent = (made: number, att: number) =>
    att ? ((made / att) * 100).toFixed(1) + "%" : "0.0%";

  const toggleExpand = (teamCode: string) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamCode]: !prev[teamCode],
    }));
  };

  // Now renderTeamBox just receives everything it needs via params
  const renderTeamBox = (
    players: any[],
    teamName: string,
    teamLogo: any,
    teamColor: string,
    secondaryColor: string,
    teamCode: string,
    isExpanded: boolean,
    heightAnim: Animated.Value
  ) => {
    if (!players.length) return null;

    const borderColor =
      isDark &&
      [
        "BKN",
        "MIN",
        "IND",
        "DEN",
        "SAS",
        "PHX",
        "LAL",
        "UTA",
        "ATL",
        "NYK",
        "LAC",
        "NOP",
        "MEM",
        "MIL",
        "SAC",
        "WAS",
        "CLE",
      ].includes(teamCode)
        ? (secondaryColor ?? teamColor)
        : teamColor;

    return (
      <View
        style={[
          styles.teamBox,
          {
            backgroundColor: isDark ? "#1d1d1d" : "#fff",
            borderColor: borderColor,
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 10,
          }}
        >
          <Text
            style={[styles.teamLabel, { color: isDark ? "#fff" : teamColor }]}
          >
            {teamName}
          </Text>
          {!!teamLogo && (
            <Image
              source={teamLogo}
              style={styles.teamLogo}
              resizeMode="contain"
            />
          )}
        </View>

        <View style={{ flexDirection: "row", width: "100%" }}>
          {/* Player Names */}
          <View style={{ width: NAME_COLUMN_WIDTH }}>
            <View
              style={[
                styles.tableHeader,
                {
                  borderColor: isDark ? "#444" : "#ccc",
                  backgroundColor: isDark ? "#1d1d1d" : "#fff",
                },
              ]}
            >
              <Text
                style={[
                  styles.cellName,
                  { color: isDark ? "#f2f2f2" : "#1d1d1d" },
                ]}
              >
                Player
              </Text>
            </View>

            <Animated.View
              style={{ maxHeight: heightAnim, overflow: "hidden" }}
            >
              {players.map((p) => (
                <Pressable
                  key={p.localPlayer?.id}
                  onPress={() =>
                    router.push(
                      `/player/${p.localPlayer?.player_id}?teamId=${p.team?.id}`
                    )
                  }
                  style={[
                    styles.tableRow,
                    {
                      borderColor: isDark ? "#333" : "#eee",
                      backgroundColor: isDark ? "#1d1d1d" : "#fff",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cellName,
                      { color: isDark ? "#eee" : "#1d1d1d" },
                    ]}
                  >
                    {p.localPlayer?.first_name} {p.localPlayer?.last_name}
                  </Text>
                </Pressable>
              ))}
            </Animated.View>
          </View>

          {/* Stats Columns */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View
                style={[
                  styles.tableHeader,
                  {
                    borderColor: isDark ? "#444" : "#ccc",
                    backgroundColor: isDark ? "#1d1d1d" : "#fff",
                    minWidth: STAT_LABELS.length * COLUMN_WIDTH,
                  },
                ]}
              >
                {STAT_LABELS.map((label) => (
                  <Text
                    key={label}
                    style={[
                      styles.cell,
                      {
                        color: isDark ? "#ccc" : "#333",
                        fontFamily: Fonts.OSMEDIUM,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                ))}
              </View>

              <Animated.View
                style={{ maxHeight: heightAnim, overflow: "hidden" }}
              >
                {players.map((p) => (
                  <View
                    key={p.localPlayer?.id}
                    style={[
                      styles.tableRow,
                      { borderColor: isDark ? "#333" : "#eee" },
                    ]}
                  >
                    {[
                      formatMin(p.min),
                      p.points ?? 0,
                      p.fgm ?? 0,
                      p.fga ?? 0,
                      percent(p.fgm ?? 0, p.fga ?? 0),
                      p.tpm ?? 0,
                      p.tpa ?? 0,
                      percent(p.tpm ?? 0, p.tpa ?? 0),
                      p.ftm ?? 0,
                      p.fta ?? 0,
                      percent(p.ftm ?? 0, p.fta ?? 0),
                      p.offReb ?? 0,
                      p.defReb ?? 0,
                      p.totReb ?? 0,
                      p.assists ?? 0,
                      p.steals ?? 0,
                      p.blocks ?? 0,
                      p.turnovers ?? 0,
                      p.pFouls ?? 0,
                      p.plusMinus ?? 0,
                    ].map((val, i) => (
                      <View key={i} style={styles.cellContainer}>
                        <Text
                          style={[
                            styles.cell,
                            {
                              color: isDark ? "#ccc" : "#333",
                              fontFamily: Fonts.OSREGULAR,
                            },
                          ]}
                        >
                          {val}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </Animated.View>
            </View>
          </ScrollView>
        </View>

        {players.length > COLLAPSED_ROWS && (
          <TouchableOpacity
            onPress={() => toggleExpand(teamCode)}
            style={{ padding: 10, alignItems: "center" }}
          >
            <Text
              style={{
                color: isDark ? "#ccc" : "#333",
                fontFamily: Fonts.OSMEDIUM,
                fontSize: 14,
              }}
            >
              {isExpanded ? "Show Less" : "Show More"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!gameId) return null;

  if (isLoading)
    return (
      <Text style={[styles.loading, { color: isDark ? "#fff" : "#000" }]}>
        Loading box score...
      </Text>
    );
  if (isError)
    return (
      <Text style={[styles.error, { color: isDark ? "#ff6666" : "red" }]}>
        Failed to load box score.
      </Text>
    );

  return (
    <>
      <ScrollView style={styles.container}>
        <HeadingTwo>Box Score</HeadingTwo>
        {renderTeamBox(
          awayPlayers,
          awayTeam?.fullName ?? "Away Team",
          isDark
            ? awayTeam?.logoLight || awayTeam?.logo
            : (awayTeam?.logo ?? null),
          awayTeam?.color ?? "#1d1d1d",
          awayTeam?.secondaryColor,
          awayTeam?.code || "away",
          expandedTeams[awayTeam?.code || "away"] ?? false,
          heightAnimMap.current[awayTeam?.code || "away"] ||
            new Animated.Value(COLLAPSED_HEIGHT)
        )}
        {renderTeamBox(
          homePlayers,
          homeTeam?.fullName ?? "Home Team",
          isDark
            ? homeTeam?.logoLight || homeTeam?.logo
            : (homeTeam?.logo ?? null),
          homeTeam?.color ?? "#1d1d1d",
          homeTeam?.secondaryColor,
          homeTeam?.code || "home",
          expandedTeams[homeTeam?.code || "home"] ?? false,
          heightAnimMap.current[homeTeam?.code || "home"] ||
            new Animated.Value(COLLAPSED_HEIGHT)
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {},
  loading: {
    textAlign: "center",
    padding: 20,
    fontFamily: Fonts.OSREGULAR,
    fontSize: 16,
  },
  error: {
    textAlign: "center",
    padding: 20,
    fontFamily: Fonts.OSREGULAR,
    fontSize: 16,
  },
  teamBox: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 24,
    overflow: "hidden",
  },
  teamLabel: {
    fontSize: 20,
    fontFamily: Fonts.OSBOLD,
    marginVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingVertical: 8,
    height: 40,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingVertical: 6,
    height: PLAYER_ROW_HEIGHT,
  },
  cellName: {
    width: NAME_COLUMN_WIDTH,
    fontFamily: Fonts.OSBOLD,
    fontSize: 14,
    paddingHorizontal: 8,
    textAlignVertical: "center",
  },
  cell: {
    width: COLUMN_WIDTH,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 4,
    textAlignVertical: "center",
  },
  cellContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  teamLogo: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
});
