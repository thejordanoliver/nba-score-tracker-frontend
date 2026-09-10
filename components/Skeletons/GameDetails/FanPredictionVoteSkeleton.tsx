import { Colors } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import HeaderSkeleton from "../HeaderSkeleton";

export default function FanPredictionSkeleton() {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = getStyles(isDark);

  // 🔥 Color pulse (same as header)
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );

    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const animatedColor = pulseAnim.interpolate({
    inputRange: [0.3, 1],
    outputRange: [
      isDark ? Colors.darkGray : Colors.lightGray,
      isDark ? Colors.lightGray : Colors.midTone,
    ],
  });

  // 🔥 Split animation (left ↔ right)
  const animSplit = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animSplit, {
          toValue: 0.65,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(animSplit, {
          toValue: 0.5,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(animSplit, {
          toValue: 0.35,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(animSplit, {
          toValue: 0.5,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [animSplit]);

  // 🔥 Mirror the split
  const homeFlex = animSplit.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const SkeletonBlock = ({ style }: { style?: any }) => (
    <Animated.View
      style={[
        style,
        {
          backgroundColor: animatedColor,
        },
      ]}
    />
  );

  return (
    <View style={styles.container}>
      {/* Title */}
      <HeaderSkeleton />

      {/* Bar */}
      <View style={styles.barContainer}>
        <View style={styles.barInner}>
          {/* Away */}
          <Animated.View
            style={[
              styles.halfBar,
              {
                flex: animSplit,
              },
            ]}
          >
            <SkeletonBlock style={styles.fillAway} />
            <View style={styles.centerContent}>
              <SkeletonBlock style={styles.logo} />
              <SkeletonBlock style={styles.teamName} />
            </View>
          </Animated.View>

          {/* Home */}
          <Animated.View
            style={[
              styles.halfBar,
              {
                flex: homeFlex,
              },
            ]}
          >
            <SkeletonBlock style={styles.fillHome} />
            <View style={styles.centerContent}>
              <SkeletonBlock style={styles.logo} />
              <SkeletonBlock style={styles.teamName} />
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Percent Row */}
      <View style={styles.percentRow}>
        <SkeletonBlock style={styles.percent} />
        <SkeletonBlock style={styles.percent} />
      </View>

      {/* Total Votes */}
      <SkeletonBlock style={styles.totalVotes} />
    </View>
  );
}

const getStyles = (isDark: boolean, LOGO_SIZE = 150) =>
  StyleSheet.create({
    container: {
      width: "100%",
    },

    barContainer: {
      width: "100%",
      height: 60,
      borderRadius: 8,
      overflow: "hidden",
    },

    barInner: {
      flexDirection: "row",
      height: "100%",
    },

    halfBar: {
      alignItems: "center",
      justifyContent: "center",
    },

    fillAway: {
      ...StyleSheet.absoluteFill,
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
    },

    fillHome: {
      ...StyleSheet.absoluteFill,
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8,
    },

    centerContent: {
      alignItems: "center",
      justifyContent: "center",
    },

    logo: {
      width: LOGO_SIZE,
      height: LOGO_SIZE,
      marginBottom: 4,
      borderRadius: 100,
    },

    teamName: {
      position: "absolute",
      width: 60,
      height: 20,
      borderRadius: 4,
    },

    percentRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
    },

    percent: {
      width: 40,
      height: 14,
      borderRadius: 4,
    },

    totalVotes: {
      width: 120,
      height: 12,
      marginTop: 8,
      borderRadius: 4,
    },
  });
