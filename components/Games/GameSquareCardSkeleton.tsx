import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleProp,
  StyleSheet,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
type GameSquareCardSkeletonProps = {
  style?: StyleProp<ViewStyle>;
};
export default function GameSquareCardSkeleton({
  style,
}: GameSquareCardSkeletonProps) {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  const shimmerTranslate = useRef(new Animated.Value(-100)).current;
  const shimmerOpacity = useRef(new Animated.Value(0.5)).current;

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
    <View style={[styles.card, style]}>
      <View style={styles.cardWrapper}>
        {/* Away team section */}
        <View style={styles.teamSection}>
          <View style={styles.teamWrapper}>
            <SkeletonWithShimmer
              style={styles.logoSkeleton}
              shimmerWidth={28}
            />
            <SkeletonWithShimmer
              style={styles.nameSkeleton}
              shimmerWidth={60}
            />
          </View>
          <SkeletonWithShimmer style={styles.scoreSkeleton} shimmerWidth={40} />
        </View>

        {/* Home team section */}
        <View style={styles.teamSection}>
          <View style={styles.teamWrapper}>
            <SkeletonWithShimmer
              style={styles.logoSkeleton}
              shimmerWidth={28}
            />
            <SkeletonWithShimmer
              style={styles.nameSkeleton}
              shimmerWidth={60}
            />
          </View>
          <SkeletonWithShimmer style={styles.scoreSkeleton} shimmerWidth={40} />
        </View>
      </View>

      {/* Game info section */}
      <View style={styles.info}>
        <SkeletonWithShimmer style={styles.dateSkeleton} shimmerWidth={60} />
        <SkeletonWithShimmer style={styles.timeSkeleton} shimmerWidth={40} />
      </View>
    </View>
  );
}

const getStyles = (dark: boolean) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      width: "100%",
      height: 120,
      backgroundColor: dark ? "#2e2e2e" : "#eee",
      justifyContent: "space-between",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 16,
    },
    cardWrapper: {
      flexDirection: "column",
      justifyContent: "center",
      borderRightColor: dark ? "#444" : "#888",
      borderRightWidth: 0.5,
      paddingRight: 12,
      gap: 8,
    },
    teamSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 4,
    },

    teamWrapper: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      gap: 8,
      width: 88,
    },
    logoSkeleton: {
      width: 28,
      height: 28,
      borderRadius: 100,
      backgroundColor: dark ? "#666" : "#bbb",
    },
    nameSkeleton: {
      width: 28,
      height: 24,
      borderRadius: 6,
      backgroundColor: dark ? "#666" : "#bbb",
    },
    scoreSkeleton: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: dark ? "#666" : "#bbb",
    },
    info: {
      justifyContent: "center",
      minHeight: 40,
      alignItems: "center",
    },
    dateSkeleton: {
      width: 36,
      height: 16,
      borderRadius: 6,
      backgroundColor: dark ? "#666" : "#bbb",
      marginBottom: 6,
    },
    timeSkeleton: {
      width: 20,
      height: 14,
      borderRadius: 6,
      backgroundColor: dark ? "#666" : "#bbb",
    },
    shimmerClipper: {
      position: "relative",
      overflow: "hidden",
    },
    shimmer: {
      position: "absolute",
      top: 0,
      bottom: 0,
      backgroundColor: dark
        ? "rgba(255,255,255,0.15)"
        : "rgba(255,255,255,0.4)",
    },
  });
