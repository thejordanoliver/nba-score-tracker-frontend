// components/NBA/DraftCard.tsx
import playerPlaceholder from "assets/Placeholders/playerPlaceholder.png";
import { Colors, Fonts } from "constants/styles";
import { getNBATeamLogo, getTeamByESPNId } from "constants/teams";
import { getNFLTeamByESPNId, getNFLTeamLogo } from "constants/teamsNFL";
import { getWNBATeamByESPNId, getWNBATeamLogo } from "constants/teamsWNBA";
import { usePreferences } from "contexts/PreferencesContext";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";

export type DraftPick = {
  pick: number;
  overall: number;
  round: number;
  traded?: boolean;
  tradeNote?: string;
  status?: "ON_THE_CLOCK" | "SELECTION_MADE" | "PICK_IS_IN";
  teamId: string;
  athlete: {
    id: string;
    alternativeId: string;
    name: string;
    height: string;
    weight: string;
    positionId: string;
    college: string;
    collegeId: string;
    headshot?: string;

    link?: string;
  } | null;
};

type Props = {
  player: DraftPick;
  index: number;
  league: string;
  isFirstOnTheClock?: boolean;
};

const POSITION_MAP: Record<string, string> = {
  "1": "PG",
  "2": "SG",
  "3": "G",
  "5": "SF",
  "6": "PF",
  "7": "F",
  "9": "C",
};

const NFL_POSITION_MAP: Record<string, string> = {
  "8": "QB",
  "9": "RB",
  "1": "WR",
  "7": "TE",
  "10": "FB",
  "46": "OT",
  "47": "OG",
  "91": "C",
  "32": "DT",
  "30": "LB",
  "264": "EDGE",
  "29": "CB",
  "36": "S",
  "96": "LS",
  "80": "PK",
  "94": "P",
};

export default function DraftCard({
  player,
  index,
  league,
  isFirstOnTheClock,
}: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = draftCardStyles(isDark);
  const isNFL = league === "nfl";
  const isWNBA = league === "wnba";
  const team = isNFL
    ? getNFLTeamByESPNId(player.teamId)
    : isWNBA
      ? getWNBATeamByESPNId(player.teamId)
      : getTeamByESPNId(player.teamId);

  const logo = isWNBA
    ? getWNBATeamLogo(team?.id, isDark)
    : isNFL
      ? getNFLTeamLogo(team?.id, isDark)
      : getNBATeamLogo(team?.id, isDark);

  const athlete = player.athlete;
  const pickIsIn = player.status === "PICK_IS_IN";
  const isOnTheClock = Boolean(isFirstOnTheClock) && !pickIsIn;
  const visualState = isOnTheClock
    ? "ON_THE_CLOCK"
    : pickIsIn
      ? "PICK_IS_IN"
      : player.status === "SELECTION_MADE" || athlete
        ? "PICKED"
        : "UPCOMING";
  const animationKey = [
    player.overall,
    player.pick,
    player.teamId,
    athlete?.id ?? "no-athlete",
    visualState,
  ].join(":");

  const cardSlideX = useRef(new Animated.Value(70)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(70)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 60;

    cardSlideX.setValue(70);
    cardFade.setValue(0);
    slideX.setValue(70);
    fade.setValue(0);

    const animation = Animated.parallel([
      Animated.timing(cardSlideX, {
        toValue: 0,
        duration: 650,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardFade, {
        toValue: 1,
        duration: 650,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideX, {
        toValue: 0,
        duration: 650,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 650,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [animationKey, cardFade, cardSlideX, fade, index, slideX]);

  const headshotSource = athlete?.headshot
    ? { uri: athlete.headshot }
    : playerPlaceholder;
  const positionAbbr =
    league === "nba"
      ? (POSITION_MAP[athlete?.positionId ?? ""] ?? athlete?.positionId)
      : (NFL_POSITION_MAP[athlete?.positionId ?? ""] ?? athlete?.positionId);

  const renderBackground = () => (
    <>
      {logo && (
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: fade, transform: [{ translateX: slideX }] },
          ]}
        >
          <Image source={logo} style={styles.backgroundLogo} />
        </Animated.View>
      )}

      <LinearGradient
        colors={
          isDark
            ? [
                "rgba(29,29,29,0.9)",
                "rgba(29,29,29,1)",
                "rgba(29,29,29,1)",
                "rgba(29,29,29,0.5)",
                "rgba(29,29,29,0.1)",
                "transparent",
              ]
            : [
                "rgba(255,255,255,0.9)",
                "rgba(255,255,255,1)",
                "rgba(255,255,255,1)",
                "rgba(255,255,255,0.5)",
                "rgba(255,255,255,0.1)",
                "transparent",
              ]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardGradient}
      />
    </>
  );

  const renderStatusCard = (label: "ON THE CLOCK" | "PICK IS IN") => (
    <View style={styles.cardContent}>
      <View style={styles.row}>
        <View
          style={[
            styles.playerHeader,
            { flex: 1, justifyContent: "space-between" },
          ]}
        >
          <Text style={styles.pickIsIn}>{label}</Text>
          <View style={styles.rankingBadge}>
            <BlurView intensity={100} style={StyleSheet.absoluteFill} />
            <Text style={styles.rankingText}>#{player.overall}</Text>
          </View>
        </View>
      </View>

      <View style={styles.playerBioRow} />
    </View>
  );

  const renderPickedCard = () => (
    <View style={styles.cardContent}>
      <View style={styles.row}>
        <View style={styles.playerHeader}>
          <Image source={headshotSource} style={styles.headshot} />

          <Text style={styles.name}>{athlete?.name ?? "N/A"}</Text>

          <View style={styles.divider} />

          <Text style={styles.positionText}>{positionAbbr ?? "N/A"}</Text>
        </View>

        <View style={styles.rankingBadge}>
          <BlurView intensity={100} style={StyleSheet.absoluteFill} />
          <Text style={styles.rankingText}>#{player.overall}</Text>
        </View>
      </View>

      <View style={styles.playerBioRow}>
        <Text style={styles.subText}>{athlete?.college || "N/A"}</Text>
        <View style={styles.divider} />
        <Text style={styles.subText}>{athlete?.height || "N/A"}</Text>
        <View style={styles.divider} />
        <Text style={styles.subText}>{athlete?.weight || "N/A"}</Text>
      </View>

      <View style={styles.playerBioRow}>
        <Text style={styles.subText}>RD: {player.round}</Text>
        <View style={styles.divider} />
        <Text style={styles.subText}>Pick: {player.pick}</Text>
      </View>

      {player.traded && (
        <View style={styles.playerBioRow}>
          <Text style={styles.tradeNoteText}>{player.tradeNote}</Text>
        </View>
      )}
    </View>
  );

  const statusLabel = isOnTheClock
    ? "ON THE CLOCK"
    : pickIsIn
      ? "PICK IS IN"
      : null;

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: cardFade,
          transform: [{ translateX: cardSlideX }],
        },
      ]}
    >
      {renderBackground()}
      {statusLabel ? renderStatusCard(statusLabel) : renderPickedCard()}
    </Animated.View>
  );
}

const draftCardStyles = (isDark: boolean) =>
  StyleSheet.create({
    cardWrapper: {
      position: "relative",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      overflow: "hidden",
    },

    logoContainer: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      alignItems: "flex-end",
      justifyContent: "center",
      width: "45%",
      overflow: "hidden",
    },

    backgroundLogo: {
      height: "160%",
      aspectRatio: 1,
      marginRight: -20,
      opacity: 1,
    },

    cardGradient: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      width: "175%",
    },

    cardContent: {
      gap: 4,
      padding: 12,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    playerHeader: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },

    headshot: {
      width: 50,
      height: 50,
      marginRight: 8,
      paddingTop: 4,
      borderWidth: 1,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 25,
    },

    name: {
      fontFamily: Fonts.BOLD,
      fontSize: 20,
      color: isDark ? Colors.dark.white : Colors.light.black,
    },

    rankingBadge: {
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      width: 44,
      height: 44,
      borderWidth: 1,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 999,
      borderCurve: "circular",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 4,
    },

    rankingText: {
      fontFamily: Fonts.BOLD,
      fontSize: 18,
      color: isDark ? Colors.white : Colors.black,
    },

    playerBioRow: {
      flexDirection: "row",
      alignItems: "center",
    },

    positionText: {
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      color: isDark ? Colors.dark.white : Colors.light.black,
    },

    divider: {
      width: 1,
      height: 18,
      marginHorizontal: 6,
      backgroundColor: isDark ? Colors.lightGray : Colors.darkGray,
    },

    subText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      color: isDark ? Colors.dark.white : Colors.light.black,
    },
    pickIsIn: {
      fontFamily: Fonts.BOLD,
      fontSize: 50,
      color: isDark ? Colors.dark.white : Colors.light.black,
    },
    tradeNoteText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      color: isDark ? Colors.dark.white : Colors.light.black,
    },
  });
