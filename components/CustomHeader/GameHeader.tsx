import { Colors } from "constants/styles";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { customHeaderStyles } from "../../styles/CustomHeaderStyles";
import type { HeaderImageSource, RacingLeague } from "./types";
import { resolveImage } from "./utils";

type GameHeaderProps = {
  tabName?: string;

  homeTeam?: unknown;
  awayTeam?: unknown;

  homeCode?: string;
  awayCode?: string;

  homeLogo?: HeaderImageSource;
  awayLogo?: HeaderImageSource;

  homeColor?: string | null;
  awayColor?: string | null;

  isEvent: boolean;
  isNeutralSite: boolean;

  racingLeague?: RacingLeague | null;
  eventTitle?: string;
  eventLogo?: HeaderImageSource;

  isDark: boolean;
};

export function GameHeader({
  tabName,
  homeTeam,
  awayTeam,
  homeCode,
  awayCode,
  homeLogo,
  awayLogo,
  homeColor,
  awayColor,
  isNeutralSite,
  isDark,
}: GameHeaderProps) {
  const { width } = useWindowDimensions();

  const styles = useMemo(
    () => customHeaderStyles(isDark, width),
    [isDark, width],
  );

  const dividerText = isNeutralSite ? "vs" : "@";

  const scaleHome = useRef(new Animated.Value(0.6)).current;
  const scaleAway = useRef(new Animated.Value(0.6)).current;

  const opacity = useRef(new Animated.Value(0)).current;

  const dividerScale = useRef(new Animated.Value(0.8)).current;

  const getTeamCodeLetters = useCallback(
    (value: unknown, fallback: string): string[] => {
      const team = value as
        | {
            code?: unknown;
            abbreviation?: unknown;
            shortDisplayName?: unknown;
            name?: unknown;
          }
        | null
        | undefined;

      const code =
        typeof value === "string"
          ? value
          : team?.code ||
            team?.abbreviation ||
            team?.shortDisplayName ||
            team?.name ||
            fallback;

      return String(code || fallback)
        .toUpperCase()
        .slice(0, 4)
        .split("");
    },
    [],
  );

  const isTeamGameHeader = Boolean(tabName === "Game" && homeTeam && awayTeam);

  const awayLetters = useMemo(
    () => getTeamCodeLetters(awayCode, "AWY"),
    [awayCode, getTeamCodeLetters],
  );

  const homeLetters = useMemo(
    () => getTeamCodeLetters(homeCode, "HOM"),
    [getTeamCodeLetters, homeCode],
  );

  const awayLetterAnims = useMemo(
    () => awayLetters.map(() => new Animated.Value(0)),
    [awayLetters],
  );

  const homeLetterAnims = useMemo(
    () => homeLetters.map(() => new Animated.Value(0)),
    [homeLetters],
  );

  useEffect(() => {
    opacity.setValue(0);
    dividerScale.setValue(0.8);
    scaleHome.setValue(0.6);
    scaleAway.setValue(0.6);

    awayLetterAnims.forEach((animation) => {
      animation.setValue(0);
    });

    homeLetterAnims.forEach((animation) => {
      animation.setValue(0);
    });

    if (!isTeamGameHeader) {
      return;
    }

    const gameAnimation = Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),

        Animated.timing(dividerScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.parallel([
          Animated.timing(scaleAway, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
          }),

          Animated.timing(scaleHome, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.stagger(
            100,
            awayLetterAnims.map((animation) =>
              Animated.timing(animation, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ),
          ),

          Animated.stagger(
            100,
            homeLetterAnims.map((animation) =>
              Animated.timing(animation, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ),
          ),
        ]),
      ]),
    ]);

    gameAnimation.start();

    return () => {
      gameAnimation.stop();
    };
  }, [
    awayLetterAnims,
    dividerScale,
    homeLetterAnims,
    isTeamGameHeader,
    opacity,
    scaleAway,
    scaleHome,
  ]);

  if (!isTeamGameHeader) {
    return null;
  }

  const resolvedAwayColor = awayColor || Colors.midTone;
  const resolvedHomeColor = homeColor || Colors.darkGray;

  const awayLogoSource = resolveImage(awayLogo);
  const homeLogoSource = resolveImage(homeLogo);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          flexDirection: "row",
          zIndex: -10,
          opacity,
        },
      ]}
    >
      {/* Team colors */}
      <LinearGradient
        colors={[
          resolvedAwayColor,
          resolvedAwayColor,
          resolvedHomeColor,
          resolvedHomeColor,
        ]}
        locations={[0, 0.5, 0.5, 1]}
        start={{
          x: 0,
          y: -2,
        }}
        end={{
          x: 1.08,
          y: 1.2,
        }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header readability overlay */}
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.48)",
          "rgba(0,0,0,0.28)",
          "rgba(0,0,0,0.08)",
          "transparent",
        ]}
        locations={[0, 0.35, 0.72, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Away team */}
      <View style={styles.teamHalfWrapper}>
        <Animated.View
          style={[
            styles.teamHalfContent,
            {
              transform: [{ scale: scaleAway }],
            },
          ]}
        >
          {awayLogoSource ? (
            <Image
              source={awayLogoSource}
              style={styles.bgLogo}
              resizeMode="contain"
            />
          ) : null}

          <View style={styles.teamCodeRow}>
            {awayLetters.map((character, index) => {
              const animation = awayLetterAnims[index];

              return (
                <Animated.Text
                  key={`away-${character}-${index}`}
                  style={[
                    styles.teamCode,
                    {
                      opacity: animation,

                      transform: [
                        {
                          scale: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.7, 1],
                          }),
                        },
                        {
                          translateY: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {character}
                </Animated.Text>
              );
            })}
          </View>
        </Animated.View>
      </View>

      {/* VS / @ */}
      <Animated.View
        style={[
          styles.dividerWrapper,
          {
            opacity,
            transform: [{ scale: dividerScale }],
          },
        ]}
      >
        <Text style={styles.dividerText}>{dividerText}</Text>
      </Animated.View>

      {/* Home team */}
      <View style={styles.teamHalfWrapper}>
        <Animated.View
          style={[
            styles.teamHalfContent,
            {
              transform: [{ scale: scaleHome }],
            },
          ]}
        >
          {homeLogoSource ? (
            <Image
              source={homeLogoSource}
              style={styles.bgLogo}
              resizeMode="contain"
            />
          ) : null}

          <View style={styles.teamCodeRow}>
            {homeLetters.map((character, index) => {
              const animation = homeLetterAnims[index];

              return (
                <Animated.Text
                  key={`home-${character}-${index}`}
                  style={[
                    styles.teamCode,
                    {
                      opacity: animation,

                      transform: [
                        {
                          scale: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.7, 1],
                          }),
                        },
                        {
                          translateY: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {character}
                </Animated.Text>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
