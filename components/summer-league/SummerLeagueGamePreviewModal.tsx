import { Fonts } from "constants/fonts";
import { teams } from "constants/teams";
import { useESPNBroadcasts } from "hooks/useESPNBroadcasts";
import { useGameStatistics } from "hooks/useGameStatistics";
import { useSummerLeagueStandings } from "hooks/useSummerLeagueStandings";
import { summerGame } from "types/types";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { getStyles } from "../../styles/SLGameCard.styles";
import LineScore from "./LineScore";
import TeamInfo from "./TeamInfo";

// === Animated logo ===
function AnimatedLogo({
  lightSource,
  darkSource,
  isDark,
  style,
}: {
  lightSource: ImageSourcePropType;
  darkSource: ImageSourcePropType;
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

// === Main modal ===
type Props = {
  visible: boolean;
  game: summerGame;
  onClose: () => void;
};

export default function SummerLeagueGamePreviewModal({
  visible,
  game,
  onClose,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getStyles(isDark); // <--- call here

  const sheetRef = useRef<BottomSheetModal>(null);

  const { standings } = useSummerLeagueStandings();
  const { broadcasts } = useESPNBroadcasts();
  const { data: gameStats, loading: statsLoading } = useGameStatistics(game.id);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

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

  const getTeamData = (name: string) =>
    teams.find(
      (t) =>
        t.name === name ||
        t.code === name ||
        t.fullName.includes(name) ||
        name.includes(t.name)
    );

  const homeTeam = game.home;
  const awayTeam = game.away;

  const homeTeamData = getTeamData(homeTeam.name);
  const awayTeamData = getTeamData(awayTeam.name);

  const homeRecord = getRecordForTeam(homeTeam.name);
  const awayRecord = getRecordForTeam(awayTeam.name);

  const statusLong = game.status?.long ?? "";
  const isNotStarted =
    statusLong === "Not Started" || statusLong === "Scheduled";
  const isFinal = statusLong === "Final" || statusLong === "Game Finished";
  const isLive = !isNotStarted && !isFinal;

  const homeWins = isFinal && (game.homeScore ?? 0) > (game.awayScore ?? 0);
  const awayWins = isFinal && (game.awayScore ?? 0) > (game.homeScore ?? 0);

  const winnerStyle = (won: boolean) =>
    won ? { color: isDark ? "#fff" : "#000" } : {};

  const snapPoints = useMemo(() => ["40%", "50%", "90%"], []);

  const formattedDate = new Date(game.date);
  const time = new Date(game.date).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const period = isFinal
    ? "Final"
    : typeof game.period === "number"
    ? `Q${game.period}`
    : game.period ?? "Live";

  const clock = game.clock ?? "";

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={1}
      snapPoints={snapPoints}
      onDismiss={onClose}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      )}
      enableHandlePanningGesture
      enableContentPanningGesture={false}
      backgroundStyle={{ backgroundColor: "transparent" }}
      handleStyle={{
        backgroundColor: "transparent",
        paddingTop: 12,
        paddingBottom: 4,
        alignItems: "center",
        position: "absolute",
        left: 8,
        right: 8,
      }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? "#888" : "#ccc",
        width: 36,
        height: 4,
        borderRadius: 2,
      }}
    >
      <View
        style={{
          flex: 1,
          overflow: "hidden",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <LinearGradient
          colors={[
            awayTeamData?.color ?? "#444",
            homeTeamData?.color ?? "#222",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[
            isDark ? "rgba(0,0,0,0)" : "rgba(255,255,255,0)",
            isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <BlurView
          intensity={100}
          tint={"systemUltraThinMaterial"}
          style={{
            flex: 1,
            padding: 20,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            {/* Away team */}
            <TeamInfo
              team={awayTeam}
              teamName={awayTeam.name}
              scoreOrRecord={
                isFinal || isLive ? game.awayScore ?? "-" : awayRecord
              }
              isWinner={
                isFinal && (game.awayScore ?? 0) > (game.homeScore ?? 0)
              } // highlight only if final
              isDark={isDark}
            />

            {/* Center info */}
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text
                style={{
                  fontFamily: Fonts.OSEXTRALIGHT,
                  fontSize: 14,
                  opacity: 0.8,
                  color: isDark ? "#ccc" : "#555",
                }}
              >
                Summer League
              </Text>
              {isNotStarted ? (
                <>
                  <Text style={styles.date}>{game.time}</Text>
                  <Text style={styles.time}>{time}</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.date, isFinal && styles.finalText]}>
                    {period}
                  </Text>
                  {isLive && clock ? (
                    <Text style={styles.clock}>{clock}</Text>
                  ) : (
                    <Text style={styles.dateFinal}>
                      {`${
                        formattedDate.getMonth() + 1
                      }/${formattedDate.getDate()}`}{" "}
                    </Text>
                  )}
                </>
              )}
            </View>

            {/* Home team */}
            <TeamInfo
              team={homeTeam}
              teamName={homeTeam.name}
              scoreOrRecord={
                isFinal || isLive ? game.homeScore ?? "-" : homeRecord
              }
              isWinner={
                isFinal && (game.homeScore ?? 0) > (game.awayScore ?? 0)
              } // highlight only if final
              isDark={isDark}
            />
          </View>

          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}
          >
            {game.scores?.home && game.scores?.away && (
              <LineScore
                homeScores={game.scores.home}
                awayScores={game.scores.away}
                isDark={isDark}
                homeCode={homeTeamData?.code ?? ""}
                awayCode={awayTeamData?.code ?? ""}
              />
            )}
          </BottomSheetScrollView>
        </BlurView>
      </View>
    </BottomSheetModal>
  );
}
