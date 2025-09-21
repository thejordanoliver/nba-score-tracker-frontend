import { useEffect, useRef } from "react";
import { Animated, StyleSheet, useColorScheme, View } from "react-native";

export default function StackedGameCardSkeleton() {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  const shimmerTranslate = useRef(new Animated.Value(-100)).current;
  const shimmerOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerTranslate, {
          toValue: 140,
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

  function Skeleton({
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
      {/* Away Team */}
      <View style={styles.cardWrapper}>
        <View style={styles.teamSection}>
          <View style={styles.teamWrapper}>
            <Skeleton style={styles.logoSkeleton} shimmerWidth={40} />
            <Skeleton style={styles.nameSkeleton} shimmerWidth={80} />
          </View>
          <Skeleton style={styles.scoreSkeleton} shimmerWidth={40} />
        </View>

        {/* Spacer */}
        <View style={{ height: 8 }} />

        {/* Home Team */}
        <View style={styles.teamSection}>
          <View style={styles.teamWrapper}>
            <Skeleton style={styles.logoSkeleton} shimmerWidth={40} />
            <Skeleton style={styles.nameSkeleton} shimmerWidth={80} />
          </View>
          <Skeleton style={styles.scoreSkeleton} shimmerWidth={40} />
        </View>
      </View>
      {/* Game Info */}
      <View style={styles.info}>
        <Skeleton style={styles.dateSkeleton} shimmerWidth={60} />
        <Skeleton style={styles.timeSkeleton} shimmerWidth={60} />
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      backgroundColor: isDark ? "#2e2e2e" : "#eee",
      borderRadius: 12,
      padding: 12,
      marginVertical: 8,
      justifyContent: "space-between",
      minHeight: 100,
    },
    cardWrapper: {
      flexDirection: "column",
      borderRightColor: isDark ? "#444" : "#888",
      justifyContent: "center",
      borderRightWidth: 0.5,
      paddingRight: 12,
      marginRight: 12,
      gap: 4,
      flex: 1,
    },
    teamSection: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },

    teamWrapper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    logoSkeleton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDark ? "#666" : "#bbb",
    },
    nameSkeleton: {
      width: 120,
      height: 18,
      borderRadius: 4,
      backgroundColor: isDark ? "#666" : "#bbb",
      marginHorizontal: 8,
    },
    scoreSkeleton: {
      width: 40,
      height: 18,
      borderRadius: 6,
      backgroundColor: isDark ? "#666" : "#bbb",
    },
    info: {
      flexDirection: "column",
      justifyContent: "center",
      marginTop: 6,
      gap: 6,
    },
    dateSkeleton: {
      width: 40,
      height: 12,
      borderRadius: 4,
      backgroundColor: isDark ? "#666" : "#bbb",
    },
    timeSkeleton: {
      width: 40,
      height: 12,
      borderRadius: 4,
      backgroundColor: isDark ? "#666" : "#bbb",
    },
    shimmerClipper: {
      position: "relative",
      overflow: "hidden",
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
