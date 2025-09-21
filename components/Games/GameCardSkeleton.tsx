import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function GameCardSkeleton() {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  // Shared animation values for shimmer movement and opacity
  const shimmerTranslate = useRef(new Animated.Value(-100)).current;
  const shimmerOpacity = useRef(new Animated.Value(0.5)).current;

  // Animate shimmer back and forth and opacity pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerTranslate, {
          toValue: 100,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerTranslate, {
          toValue: -100,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerOpacity, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Helper to render skeleton + clipped shimmer
  function SkeletonWithShimmer({
    style,
    shimmerWidth,
  }: {
    style: any;
    shimmerWidth: number;
  }) {
    return (
      <View style={[style, styles.shimmerClipper]}>
        <View style={style} />
        <Animated.View
          style={[
            styles.shimmer,
            {
              width: shimmerWidth,
              opacity: shimmerOpacity,
              transform: [{ translateX: shimmerTranslate }],
              
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Top Team */}
      <View style={styles.teamSection}>
        <SkeletonWithShimmer style={styles.logoSkeleton} shimmerWidth={40} />
        <SkeletonWithShimmer style={styles.nameSkeleton} shimmerWidth={40} />
      </View>

      {/* Top Score */}
      <SkeletonWithShimmer style={styles.scoreSkeleton} shimmerWidth={40} />

      {/* Game Info */}
      <View style={styles.info}>
        <SkeletonWithShimmer style={styles.dateSkeleton} shimmerWidth={50} />
        <SkeletonWithShimmer style={styles.timeSkeleton} shimmerWidth={80} />
      </View>

      {/* Bottom Score */}
      <SkeletonWithShimmer style={styles.scoreSkeleton} shimmerWidth={40} />

      {/* Bottom Team */}
      <View style={styles.teamSection}>
        <SkeletonWithShimmer style={styles.logoSkeleton} shimmerWidth={40} />
        <SkeletonWithShimmer style={styles.nameSkeleton} shimmerWidth={40} />
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      backgroundColor: isDark ? "#2e2e2e" : "#eee",
      borderRadius: 10,
      paddingVertical: 14,
      paddingHorizontal: 20,
      marginVertical: 8,
      alignItems: "center",
      justifyContent: "space-between",
    },
    teamSection: {
      alignItems: "center",
      width: 60,
    },
    logoSkeleton: {
      width: 40,
      height: 40,
      borderRadius: 100,
      backgroundColor: isDark ? "#666" : "#bbb",
      marginBottom: 6,
    },
    nameSkeleton: {
      width: 40,
      height: 12,
      borderRadius: 4,
      backgroundColor: isDark ? "#666" : "#bbb",
    },
    scoreSkeleton: {
      width: 50,
      height: 20,
      borderRadius: 6,
      backgroundColor: isDark ? "#666" : "#bbb",
    },
    info: {
      alignItems: "center",
      justifyContent: "center",
      width: 70,
    },
    dateSkeleton: {
      width: 50,
      height: 14,
      borderRadius: 6,
      backgroundColor: isDark ? "#666" : "#bbb",
      marginBottom: 6,
    },
    timeSkeleton: {
      width: 80,
      height: 12,
      borderRadius: 6,
      backgroundColor: isDark ? "#666" : "#bbb",
    },
    shimmerClipper: {
      position: "relative",
      overflow: "hidden",
      // Ensure height & width are inherited from the skeleton style
      // So shimmer is clipped properly.
      // We rely on the style prop's width/height.
    },
    shimmer: {
      position: "absolute",
      top: 0,
      bottom: 0,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.15)"
        : "rgba(255,255,255,0.4)",
    },
  });
