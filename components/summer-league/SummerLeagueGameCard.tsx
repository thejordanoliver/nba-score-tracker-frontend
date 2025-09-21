import { Fonts } from "constants/fonts";
import { useSummerLeagueStandings } from "hooks/useSummerLeagueStandings";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { getStyles } from "../../styles/SLGameCard.styles";
import { teams } from "../../constants/teams";
import type { summerGame } from "../../types/types";

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

export default function SummerLeagueGameCard({
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
        {/* Away team */}
        <View style={styles.teamSection}>
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
            {awayTeam.name}
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

        {/* Center game info */}
        <View style={styles.info}>
          <View
            style={{
              alignItems: "center",
              marginBottom: 6,
              justifyContent: "center",
              paddingHorizontal: 4,
              width: "100%",
              position: "absolute",
              top: -20,
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
                const month = date.getMonth() + 1;
                const day = date.getDate();
                return `${month}/${day}`;
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

        {/* Home score or record */}
        {game.status.long === "Not Started" ? (
          <Text style={styles.teamRecord}>{homeRecord}</Text>
        ) : (
          <Text style={[styles.teamScore, winnerStyle(homeWins)]}>
            {homeScoreDisplay}
          </Text>
        )}

        {/* Home team */}
        <View style={styles.teamSection}>
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
            {homeTeam.name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
