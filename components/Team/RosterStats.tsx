import { Fonts } from "constants/fonts";
import { teamsById } from "constants/teams"; // adjust path as needed
import { PlayerInfo, PlayerStats, Props } from "types/types";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
const COLUMN_WIDTH = 50;
const NAME_COLUMN_WIDTH = 140;

const RosterStats: React.FC<Props> = ({ rosterStats, playersDb, teamId }) => {
  const isDark = useColorScheme() === "dark";
  const team = teamsById[teamId];
  const teamPrimaryColor = team?.color ?? "#1d1d1d";

  if (!rosterStats.length) return null;

  const getPG = (val: number, gp: number) =>
    gp ? (val / gp).toFixed(1) : "0.0";

  const playersMap = React.useMemo(() => {
    const map = new Map<number, PlayerInfo>();
    playersDb.forEach((p) => {
      if (typeof p.player_id === "number") {
        map.set(p.player_id, p);
      }
    });
    return map;
  }, [playersDb]);

  const mergedRoster = rosterStats
    .map((stat) => {
      const key = Number(stat.playerId);
      let player = playersMap.get(key);

      if (!player) {
        player = playersDb.find(
          (p) =>
            p.first_name.toLowerCase() ===
              stat.name.split(" ")[0].toLowerCase() &&
            p.last_name.toLowerCase() ===
              stat.name.split(" ").slice(1).join(" ").toLowerCase()
        );
      }

      if (!player || stat.gamesPlayed === 0) return null;

      return {
        ...stat,
        first_name: player.first_name,
        last_name: player.last_name,
        jersey_number: player.jersey_number,
        headshot_url: player.headshot_url,
      };
    })
    .filter(Boolean) as (PlayerStats & PlayerInfo)[];

  if (!mergedRoster.length) return null;

  const topScorer = [...mergedRoster].sort(
    (a, b) => b.totalPoints / b.gamesPlayed - a.totalPoints / a.gamesPlayed
  )[0];
  const topRebounder = [...mergedRoster].sort(
    (a, b) => b.totalRebounds / b.gamesPlayed - a.totalRebounds / a.gamesPlayed
  )[0];
  const topPasser = [...mergedRoster].sort(
    (a, b) => b.totalAssists / b.gamesPlayed - a.totalAssists / a.gamesPlayed
  )[0];
  const topBlocker = [...mergedRoster].sort(
    (a, b) => b.totalBlocks / b.gamesPlayed - a.totalBlocks / a.gamesPlayed
  )[0];
  const topStealer = [...mergedRoster].sort(
    (a, b) => b.totalSteals / b.gamesPlayed - a.totalSteals / a.gamesPlayed
  )[0];

  const formatDisplayName = (first: string, last: string, jersey: string) => {
    const firstInitial = first ? first[0].toUpperCase() : "";
    const lastName = last || "";

    return (
      <Text>
        {firstInitial}. {lastName}{" "}
        <Text
          style={{
            fontSize: 10,
            color: "#888",
            textAlignVertical: "bottom",
            lineHeight: 14,
            // optionally adjust position to look like subscript
            // e.g. shift down a bit
            transform: [{ translateY: 3 }],
          }}
        >
          #{jersey}
        </Text>
      </Text>
    );
  };

  const statLeaders = [
    { label: "Points", stat: "totalPoints", player: topScorer },
    { label: "Rebounds", stat: "totalRebounds", player: topRebounder },
    { label: "Assists", stat: "totalAssists", player: topPasser },
    { label: "Blocks", stat: "totalBlocks", player: topBlocker },
    { label: "Steals", stat: "totalBlocks", player: topStealer },
  ];

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#1d1d1d" : "#fff" },
      ]}
    >
      <FlatList
        horizontal
        data={statLeaders}
        keyExtractor={(item) => `${item.stat}-${item.player.playerId}`}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={styles.cardWrapper}>
            <View style={styles.cardContainer}>
              <Text
                style={[
                  styles.cardLabel,
                  { color: isDark ? "#fff" : teamPrimaryColor },
                ]}
              >
                {item.label}
              </Text>
              <TouchableOpacity
                key={item.player.playerId}
                onPress={() =>
                  router.push(
                    `/player/${item.player.playerId}?teamId=${teamId}`
                  )
                }
              >
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: isDark ? "#2e2e2e" : "#f2f2f2" },
                  ]}
                >
                  <Image
                    source={{
                      uri:
                        item.player.headshot_url ??
                        "https://via.placeholder.com/60",
                    }}
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: isDark ? "#555" : "#888",
                        paddingTop: 4,
                      },
                    ]}
                  />
                  <View style={styles.nameValue}>
                    <Text
                      style={[
                        styles.cardName,
                        { color: isDark ? "#eee" : "#222" },
                      ]}
                    >
                      {formatDisplayName(
                        item.player.first_name,
                        item.player.last_name,
                        item.player.jersey_number
                      )}
                    </Text>
                    <Text
                      style={[
                        styles.cardValue,
                        { color: isDark ? "#aaa" : "#888" },
                      ]}
                    >
                      {getPG(
                        item.player[item.stat as keyof PlayerStats] as number,
                        item.player.gamesPlayed
                      )}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Vertical divider between cards (except last one) */}
            {index < statLeaders.length - 1 && (
              <View
                style={{
                  width: 1,
                  height: "72%",
                  backgroundColor: isDark ? "#444" : "#ccc",
                  alignSelf: "flex-end",
                  marginHorizontal: 16,
                }}
              />
            )}
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />

      <View
        style={{
          flexDirection: "row",
          width: "100%",
          marginTop: 12,
          paddingHorizontal: 16,
        }}
      >
        {/* Name Column */}
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
              Name
            </Text>
          </View>
          {mergedRoster.map((p) => (
            <View
              key={p.playerId}
              style={[
                styles.tableRow,
                {
                  borderColor: isDark ? "#333" : "#eee",
                  backgroundColor: isDark ? "#1d1d1d" : "#fff",
                },
              ]}
            >
              <TouchableOpacity
                key={p.playerId}
                onPress={() =>
                  router.push(`/player/${p.playerId}?teamId=${teamId}`)
                }
              >
                <Text
                  style={[
                    styles.cellName,
                    { color: isDark ? "#fff" : "#1d1d1d" },
                  ]}
                >
                  {formatDisplayName(
                    p.first_name,
                    p.last_name,
                    p.jersey_number
                  )}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Scrollable Stats */}
        <ScrollView horizontal>
          <View>
            <View
              style={[
                styles.tableHeader,
                {
                  borderColor: isDark ? "#444" : "#ccc",
                  backgroundColor: isDark ? "#1d1d1d" : "#fff",
                },
              ]}
            >
              {[
                "GP",
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
              ].map((label) => (
                <Text
                  key={label}
                  style={[
                    styles.cell,
                    {
                      color: isDark ? "#ccc" : "#333",
                      fontFamily: "Oswald_600SemiBold",
                    },
                  ]}
                >
                  {label}
                </Text>
              ))}
            </View>

            {mergedRoster.map((p) => (
              <View
                key={p.playerId}
                style={[
                  styles.tableRow,
                  { borderColor: isDark ? "#333" : "#eee" },
                ]}
              >
                {[
                  p.gamesPlayed,
                  (p.minutesPlayed / p.gamesPlayed).toFixed(1),
                  getPG(p.totalPoints, p.gamesPlayed),
                  getPG(p.totalFGM, p.gamesPlayed),
                  getPG(p.totalFGA, p.gamesPlayed),
                  p.totalFGA
                    ? ((p.totalFGM / p.totalFGA) * 100).toFixed(1) + "%"
                    : "0.0%",
                  getPG(p.total3PM, p.gamesPlayed),
                  getPG(p.total3PA, p.gamesPlayed),
                  p.total3PA
                    ? ((p.total3PM / p.total3PA) * 100).toFixed(1) + "%"
                    : "0.0%",
                  getPG(p.totalFTM, p.gamesPlayed),
                  getPG(p.totalFTA, p.gamesPlayed),
                  p.totalFTA
                    ? ((p.totalFTM / p.totalFTA) * 100).toFixed(1) + "%"
                    : "0.0%",
                  getPG(p.totalOffReb, p.gamesPlayed),
                  getPG(p.totalDefReb, p.gamesPlayed),
                  getPG(p.totalRebounds, p.gamesPlayed),
                  getPG(p.totalAssists, p.gamesPlayed),
                  getPG(p.totalSteals, p.gamesPlayed),
                  getPG(p.totalBlocks, p.gamesPlayed),
                  getPG(p.totalTurnovers, p.gamesPlayed),
                  getPG(p.totalFouls, p.gamesPlayed),
                  p.plusMinus
                    ? (p.plusMinus / p.gamesPlayed).toFixed(1)
                    : "0.0",
                ].map((val, i) => (
                  <View key={i} style={styles.cellContainer}>
                    <Text
                      style={[
                        styles.cell,
                        {
                          color: isDark ? "#ccc" : "#333",
                          fontFamily: "Oswald_400Regular",
                        },
                      ]}
                    >
                      {val}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {},
  cardContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
  },

  statCard: {
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    width: 260,
    flexDirection: "row",
  },
  cardLabel: {
    fontFamily: Fonts.OSSEMIBOLD,
    fontSize: 20,
    marginBottom: 4,
  },
  nameValue: {
    marginLeft: 12,
    flexDirection: "column",
    justifyContent: "center",
  },
  cardWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  cardName: {
    fontFamily: Fonts.OSSEMIBOLD,
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  cardValue: {
    fontSize: 24,
    fontFamily: Fonts.OSBOLD,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginVertical: 4,
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
    paddingVertical: 8,
    height: 40,
  },
  cellName: {
    width: NAME_COLUMN_WIDTH,
    fontFamily: Fonts.OSSEMIBOLD,
    fontSize: 13,
    paddingRight: 8,
    textAlign: "left",
  },
  cell: {
    width: COLUMN_WIDTH,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 6,
  },
  cellContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default RosterStats;
