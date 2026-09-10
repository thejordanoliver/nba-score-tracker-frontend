import { Colors, Fonts } from "@/constants/styles";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import {
  ImageSourcePropType,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type SeasonBeginsAnimationProps = {
  teamLogo: ImageSourcePropType;
  teamName?: string;
  teamColor?: string;
  teamSecondaryColor?: string;
  isDark: boolean;
  visible: boolean;
  onComplete?: () => void;
};

const CONTAINER_HEIGHT = 150;
const SHUTTER_HEIGHT = CONTAINER_HEIGHT / 2;
const CLOSE_DELAY_MS = 2850;
const CLOSE_DURATION_MS = 700;

function normalizeColor(color: string | undefined, fallback: string) {
  const selectedColor = color || fallback;

  return selectedColor.startsWith("#") ? selectedColor : `#${selectedColor}`;
}

export default function SeasonBeginsAnimation({
  teamLogo,
  teamName,
  teamColor,
  teamSecondaryColor,
  isDark,
  visible,
  onComplete,
}: SeasonBeginsAnimationProps) {
  const { width } = useWindowDimensions();
  const slideDistance = Math.max(width, 400);
  const [isRendered, setIsRendered] = useState(visible);

  const handleAnimationComplete = useCallback(() => {
    setIsRendered(false);
    onComplete?.();
  }, [onComplete]);

  const teamNameTranslateX = useSharedValue(slideDistance);
  const titleTranslateX = useSharedValue(slideDistance);
  const textOpacity = useSharedValue(1);
  const panelOpacity = useSharedValue(1);

  const logoScale = useSharedValue(0.05);
  const logoOpacity = useSharedValue(0);
  const logoRotation = useSharedValue(-12);

  const ringProgress = useSharedValue(0);
  const glowScale = useSharedValue(0.75);
  const glowOpacity = useSharedValue(0);

  const topShutterTranslateY = useSharedValue(-SHUTTER_HEIGHT);
  const bottomShutterTranslateY = useSharedValue(SHUTTER_HEIGHT);

  const accentColor = normalizeColor(teamColor, Colors.midTone);

  const secondaryColor = normalizeColor(teamSecondaryColor, accentColor);

  const styles = animationStyles(accentColor, secondaryColor, isDark);

  useEffect(() => {
    if (!visible) {
      setIsRendered(false);
      return;
    }

    setIsRendered(true);

    // Reset text.
    teamNameTranslateX.value = slideDistance;
    titleTranslateX.value = slideDistance;
    textOpacity.value = 1;
    panelOpacity.value = 1;

    // Reset logo.
    logoScale.value = 0.05;
    logoOpacity.value = 0;
    logoRotation.value = -12;

    // Reset effects.
    ringProgress.value = 0;
    glowScale.value = 0.75;
    glowOpacity.value = 0;

    // Keep both shutters outside the card until the closing sequence.
    topShutterTranslateY.value = -SHUTTER_HEIGHT;
    bottomShutterTranslateY.value = SHUTTER_HEIGHT;

    /*
     * 1. Team name slides in from the right,
     *    pauses, and slides out to the left.
     */
    teamNameTranslateX.value = withSequence(
      withTiming(0, {
        duration: 450,
        easing: Easing.out(Easing.cubic),
      }),
      withDelay(
        900,
        withTiming(-slideDistance, {
          duration: 420,
          easing: Easing.in(Easing.cubic),
        }),
      ),
    );

    /*
     * 2. "Season Begins Now" follows the team name.
     */
    titleTranslateX.value = withDelay(
      120,
      withSequence(
        withTiming(0, {
          duration: 500,
          easing: Easing.out(Easing.cubic),
        }),
        withDelay(
          780,
          withTiming(-slideDistance, {
            duration: 450,
            easing: Easing.in(Easing.cubic),
          }),
        ),
      ),
    );

    /*
     * 3. Remove the announcement text and its white panel.
     */
    textOpacity.value = withDelay(
      1450,
      withTiming(0, {
        duration: 250,
      }),
    );

    panelOpacity.value = withDelay(
      1450,
      withTiming(0, {
        duration: 350,
        easing: Easing.out(Easing.ease),
      }),
    );

    /*
     * 4. Zoom and rotate the team logo into view.
     */
    logoOpacity.value = withDelay(
      1320,
      withTiming(1, {
        duration: 220,
      }),
    );

    logoScale.value = withDelay(
      1320,
      withSequence(
        withTiming(1.35, {
          duration: 650,
          easing: Easing.out(Easing.cubic),
        }),
        withSpring(1, {
          damping: 9,
          stiffness: 160,
          mass: 0.8,
        }),
      ),
    );

    logoRotation.value = withDelay(
      1320,
      withSpring(0, {
        damping: 9,
        stiffness: 120,
      }),
    );

    /*
     * 5. Reveal the team-color glow.
     */
    glowOpacity.value = withDelay(
      1350,
      withTiming(1, {
        duration: 350,
      }),
    );

    glowScale.value = withDelay(
      1320,
      withSpring(1, {
        damping: 9,
        stiffness: 100,
      }),
    );

    /*
     * 6. Expand the ring around the logo.
     */
    ringProgress.value = withDelay(
      1500,
      withTiming(1, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      }),
    );

    /*
     * 7. Cover the entire card with two full-width shutters.
     *    The content itself never scales, so the logo keeps its proportions.
     */
    topShutterTranslateY.value = withDelay(
      CLOSE_DELAY_MS,
      withTiming(0, {
        duration: CLOSE_DURATION_MS,
        easing: Easing.bezier(0.65, 0, 0.35, 1),
      }),
    );

    bottomShutterTranslateY.value = withDelay(
      CLOSE_DELAY_MS,
      withTiming(
        0,
        {
          duration: CLOSE_DURATION_MS,
          easing: Easing.bezier(0.65, 0, 0.35, 1),
        },
        (finished) => {
          if (finished) {
            runOnJS(handleAnimationComplete)();
          }
        },
      ),
    );

    if (process.env.EXPO_OS === "ios") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    return () => {
      cancelAnimation(teamNameTranslateX);
      cancelAnimation(titleTranslateX);
      cancelAnimation(textOpacity);
      cancelAnimation(panelOpacity);

      cancelAnimation(logoScale);
      cancelAnimation(logoOpacity);
      cancelAnimation(logoRotation);

      cancelAnimation(ringProgress);
      cancelAnimation(glowScale);
      cancelAnimation(glowOpacity);

      cancelAnimation(topShutterTranslateY);
      cancelAnimation(bottomShutterTranslateY);
    };
  }, [
    bottomShutterTranslateY,
    glowOpacity,
    glowScale,
    logoOpacity,
    logoRotation,
    logoScale,
    panelOpacity,
    ringProgress,
    slideDistance,
    teamNameTranslateX,
    textOpacity,
    titleTranslateX,
    topShutterTranslateY,
    handleAnimationComplete,
    visible,
  ]);

  const teamNameStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [
      {
        translateX: teamNameTranslateX.value,
      },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [
      {
        translateX: titleTranslateX.value,
      },
    ],
  }));

  const panelStyle = useAnimatedStyle(() => ({
    opacity: panelOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      {
        scale: logoScale.value,
      },
      {
        rotate: `${logoRotation.value}deg`,
      },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [
      {
        scale: glowScale.value,
      },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ringProgress.value, [0, 0.2, 1], [0, 0.9, 0]),
    transform: [
      {
        scale: interpolate(ringProgress.value, [0, 1], [0.6, 1.8]),
      },
    ],
  }));

  const topShutterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: topShutterTranslateY.value }],
  }));

  const bottomShutterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomShutterTranslateY.value }],
  }));

  if (!visible || !isRendered) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(180)}
      style={styles.container}
      accessibilityRole="summary"
      accessibilityLabel={`${teamName ?? "Team"} season begins now`}
    >
      {/* Team logo and color effects */}
      <View pointerEvents="none" style={styles.logoStage}>
        <Animated.View style={[styles.glow, glowStyle]} />

        <Animated.View style={[styles.ring, ringStyle]} />

        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <Image
            source={teamLogo}
            style={styles.logo}
            contentFit="contain"
            transition={100}
          />
        </Animated.View>
      </View>

      {/* Opening announcement */}
      <Animated.View
        pointerEvents="none"
        style={[styles.announcementPanel, panelStyle]}
      >
        <Animated.Text
          selectable
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.teamName, teamNameStyle]}
        >
          {teamName?.toUpperCase() ?? "IT’S TIME"}
        </Animated.Text>

        <Animated.Text
          selectable
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.title, titleStyle]}
        >
          SEASON BEGINS NOW
        </Animated.Text>
      </Animated.View>

      {/* Full-width shutters cover the card without scaling its content. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.shutter, styles.topShutter, topShutterStyle]}
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.shutter, styles.bottomShutter, bottomShutterStyle]}
      />
    </Animated.View>
  );
}

const animationStyles = (
  accentColor: string,
  secondaryColor: string,
  isDark: boolean,
) =>
  StyleSheet.create({
    container: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: CONTAINER_HEIGHT,
      borderCurve: "continuous",
      borderRadius: 14,
      backgroundColor: isDark ? Colors.black : Colors.white,
      overflow: "hidden",
    },

    logoStage: {
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      justifyContent: "center",
    },

    glow: {
      position: "absolute",
      width: 190,
      height: 190,
      borderRadius: 999,
      backgroundColor: `${accentColor}33`,
    },

    ring: {
      position: "absolute",
      width: 105,
      height: 105,
      borderWidth: 3,
      borderColor: accentColor,
      borderRadius: 999,
    },

    logoWrap: {
      width: 130,
      height: 130,
    },

    logo: {
      width: "100%",
      height: "100%",
    },

    announcementPanel: {
      ...StyleSheet.absoluteFill,
      zIndex: 2,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      paddingHorizontal: 18,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },

    teamName: {
      width: "100%",
      fontFamily: Fonts.BOLD,
      fontSize: 40,
      letterSpacing: 2,
      color: secondaryColor,
      textAlign: "center",
    },

    title: {
      width: "100%",
      fontFamily: Fonts.BOLD,
      fontSize: 30,
      letterSpacing: 0.5,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },

    shutter: {
      position: "absolute",
      left: 0,
      zIndex: 20,
      width: "100%",
      height: SHUTTER_HEIGHT,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },

    topShutter: {
      top: 0,
    },

    bottomShutter: {
      bottom: 0,
    },
  });
