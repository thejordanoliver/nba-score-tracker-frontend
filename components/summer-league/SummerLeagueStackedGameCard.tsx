import { Fonts } from "constants/fonts";
import { useSummerLeagueStandings } from "hooks/useSummerLeagueStandings";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { teams } from "../../constants/teams";
import type { summerGame, Team } from "../../types/types";

function AnimatedLogo({
  lightSource,
  darkSource,
  isDark,
  style,
}: {
  lightSource: any;
  darkSource: any;
  isDark: boolean;
  style?: any;
}) {
  const fadeAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isDark ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
    }).start();
  }, [isDark]);

  return (
    <View style={[style, { position: "relative" }]}>
      <Animated.Image
        source={lightSource}
        style={[style, { position: "absolute", opacity: fadeAnim }]}
        resizeMode="contain"
      />
      <Animated.Image
        source={darkSource}
        style={[
          style,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const MemoizedAnimatedLogo = React.memo(AnimatedLogo);

export default function SummerLeagueStackedGameCard({
  game,
  isDark,
}: {
  game: summerGame;
  isDark?: boolean;
}) {
  const colorScheme = useColorScheme();
  const dark = isDark ?? colorScheme === "dark";
  const styles = getStyles(dark);
  const router = useRouter();
  const { standings } = useSummerLeagueStandings();

  const getRecordForTeam = (teamName: string) => {
    if (!standings || !teamName) return "";

    const lowerName = teamName.toLowerCase();

    for (const [key, record] of standings.entries()) {
      if (
        key === lowerName ||
        key.includes(lowerName) ||
        lowerName.includes(key) ||
        key.replace(/\s+/g, "") === lowerName.replace(/\s+/g, "")
      ) {
        return record;
      }
    }

    console.warn(`Record not found for: "${teamName}"`);
    return "";
  };

  const homeTeam = game.home ?? { name: "Unknown", logo: "" };
  const awayTeam = game.away ?? { name: "Unknown", logo: "" };

  const homeRecord = getRecordForTeam(homeTeam.name);
  const awayRecord = getRecordForTeam(awayTeam.name);

  const homeTeamData = useMemo(() => {
    return teams.find(
      (t) => t.name === homeTeam.name || t.code === homeTeam.name
    );
  }, [homeTeam.name]);

  const awayTeamData = useMemo(() => {
    return teams.find(
      (t) => t.name === awayTeam.name || t.code === awayTeam.name
    );
  }, [awayTeam.name]);

  const awayScoreDisplay = game.awayScore ?? "-";
  const homeScoreDisplay = game.homeScore ?? "-";

  // Determine if game is final
  const isFinal =
    game.status.short === "FT" ||
    game.status.long === "Game Finished" ||
    game.status.long === "Final";

  // Determine winners for styling
  const homeWins = isFinal && (game.homeScore ?? 0) > (game.awayScore ?? 0);
  const awayWins = isFinal && (game.awayScore ?? 0) > (game.homeScore ?? 0);

  // Format quarter/period display
  let quarterDisplay = "Live";

  if (
    typeof game.period === "number" &&
    !["Not Started", "Scheduled"].includes(game.status.long)
  ) {
    quarterDisplay = `Q${game.period}`;
  } else if (typeof game.period === "string") {
    quarterDisplay = game.period;
  }

  if (game.status.long === "Final" || game.status.long === "Game Finished") {
    quarterDisplay = "Final";
  }

  const timerDisplay = game.clock ?? "";

  // Winner style function
  const winnerStyle = (teamWins: boolean) =>
    teamWins
      ? {
          color: dark ? "#fff" : "#000",
        }
      : {};

  function getTeamRecord(
    team: Team,
    teamData?: Team,
    fallbackInfo?: Team | null
  ) {
    const record =
      team.record && team.record.trim() !== "" && team.record !== "0-0"
        ? team.record
        : teamData?.current_season_record ||
          fallbackInfo?.current_season_record;

    return record ?? "-";
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "../summer-league/game/[game]",
          params: { game: JSON.stringify(game) },
        })
      }
    >
      <View style={styles.card}>
        <View style={styles.cardWrapper}>
          {/* Away team */}
          <View style={styles.teamSection}>
            <View style={styles.teamWrapper}>
              <MemoizedAnimatedLogo
                lightSource={
                  awayTeamData?.logoLight ||
                  awayTeam?.logo ||
                  require("../../assets/Logos/NBA.png")
                }
                darkSource={
                  awayTeamData?.logo ||
                  awayTeam?.logo ||
                  require("../../assets/Logos/NBA.png")
                }
                isDark={dark}
                style={styles.logo}
              />

              <Text style={[styles.teamName, winnerStyle(awayWins)]}>
                {awayTeamData?.name}
              </Text>
            </View>
            {/* Away score or record */}
            {game.status.long === "Not Started" ? (
              <Text style={styles.teamRecord}>{awayRecord}</Text>
            ) : (
              <Text style={[styles.teamScore, winnerStyle(awayWins)]}>
                {awayScoreDisplay}
              </Text>
            )}
          </View>

          {/* Home team */}
          <View style={styles.teamSection}>
            <View style={styles.teamWrapper}>
              <MemoizedAnimatedLogo
                lightSource={
                  homeTeamData?.logoLight ||
                  homeTeam?.logo ||
                  require("../../assets/Logos/NBA.png")
                }
                darkSource={
                  homeTeamData?.logo ||
                  homeTeam?.logo ||
                  require("../../assets/Logos/NBA.png")
                }
                isDark={dark}
                style={styles.logo}
              />

              <Text style={[styles.teamName, winnerStyle(homeWins)]}>
                {homeTeamData?.name}
              </Text>
            </View>
            {/* Home score or record */}
            {game.status.long === "Not Started" ? (
              <Text style={styles.teamRecord}>{homeRecord}</Text>
            ) : (
              <Text style={[styles.teamScore, winnerStyle(homeWins)]}>
                {homeScoreDisplay}
              </Text>
            )}
          </View>
        </View>

        {/* Game info */}
        <View style={styles.info}>
          {/* Quarter or formatted time */}
          {game.status.long === "Not Started" ? (
            <>
              <Text style={styles.dateFinal}>{game.time}</Text>
              <Text style={styles.time}>
                {new Date(game.date).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
            </>
          ) : (
            <Text style={[styles.date, isFinal && styles.finalText]}>
              {quarterDisplay}
            </Text>
          )}

          {(game.status.long === "Final" ||
            game.status.long === "Game Finished") && (
            <Text style={styles.dateFinal}>
              {(() => {
                const date = new Date(game.date);
                return date.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                });
              })()}
            </Text>
          )}

          {!(
            game.status.long === "Not Started" ||
            game.status.long === "Scheduled" ||
            game.status.long === "Final" ||
            game.status.long === "Game Finished"
          ) && timerDisplay ? (
            <Text style={styles.clock}>{timerDisplay}</Text>
          ) : null}
        </View>
        <View
          style={{
            flex: 1,
            marginBottom: 6,

            paddingHorizontal: 4,
            width: "100%",
            position: "absolute",
            left: 8,
            bottom: 0,
          }}
        >
          <Text
            style={{
              fontFamily: Fonts.OSEXTRALIGHT,
              fontSize: 10,
              color: dark ? "#fff" : "#000",
              opacity: 0.8,
            }}
          >
            Summer League
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const getStyles = (dark: boolean) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      flex: 1,
      height: 100,
      backgroundColor: dark ? "#2e2e2e" : "#eee",
      justifyContent: "space-between",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 12,
    },
    cardWrapper: {
      flexDirection: "column",
      justifyContent: "center",
      borderRightColor: dark ? "#444" : "#888",
      borderRightWidth: 0.5,
      paddingRight: 12,
      gap: 4,
      flex: 1,
    },
    teamSection: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      gap: 4,
    },
    teamWrapper: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      gap: 8,
      width: 80,
      flex: 1,
    },

    logo: {
      width: 24,
      height: 24,
      resizeMode: "contain",
    },
    teamName: {
      fontSize: 18,
      fontFamily: Fonts.OSREGULAR,
      flexShrink: 1,
      color: dark ? "#fff" : "#1d1d1d",
      textAlign: "left",
    },
    teamScore: {
      fontSize: 18,
      fontFamily: Fonts.OSBOLD,
      textAlign: "right",
      color: dark ? "#aaa" : "#888",
      width: 40,
    },
    teamRecord: {
      width: 40,
      fontSize: 12,
      fontFamily: Fonts.OSREGULAR,
      textAlign: "center",
      marginVertical: 2,
      color: dark ? "#bbb" : "#888",
    },
    info: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 30,
      width: 100,
    },
    finalText: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 16,
      color: dark ? "#ff4444" : "#cc0000",
      fontWeight: "bold",
      textAlign: "center",
      width: 40,
    },
    date: {
      fontSize: 12,
      fontFamily: Fonts.OSEXTRALIGHT,
      textAlign: "center",
      color: dark ? "#fff" : "#000",
    },
    dateFinal: {
      fontFamily: Fonts.OSREGULAR,
      color: dark ? "rgba(255,255,255, .5)" : "rgba(0, 0, 0, .5)",
      fontSize: 14,
    },
    time: {
      fontSize: 12,
      fontFamily: Fonts.OSREGULAR,
      textAlign: "center",
      color: dark ? "#ff4444" : "#cc0000",
    },
    clock: {
      fontSize: 14,
      fontFamily: Fonts.OSBOLD,
      textAlign: "center",
      color: dark ? "#ff4444" : "#cc0000",
    },
    broadcast: {
      fontSize: 12,
      fontFamily: Fonts.OSREGULAR,
      textAlign: "center",
      marginTop: 4,
      color: dark ? "#fff" : "#1d1d1d",
    },
  });
