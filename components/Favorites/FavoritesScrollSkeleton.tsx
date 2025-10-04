import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, useColorScheme } from "react-native";

export default function FavoritesScrollSkeleton() {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  // Separate shimmer animations for each element
  const shimmerCircle = useRef(new Animated.Value(-100)).current;
  const shimmerLabel = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    const animate = (animatedValue: Animated.Value) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 200,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: -100,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(shimmerCircle);
    animate(shimmerLabel);
  }, [shimmerCircle, shimmerLabel]);

  return (
    <View style={styles.wrapper}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={styles.skeletonItem}>
          {/* Circle with individual shimmer */}
          <View style={styles.circleWrapper}>
            <View style={styles.circle} />
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX: shimmerCircle }],
                },
              ]}
            />
          </View>

          {/* Label with individual shimmer */}
          <View style={styles.labelWrapper}>
            <View style={styles.label} />
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX: shimmerLabel }],
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    wrapper: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingTop: 24,
      marginBottom: 20,
    },
    skeletonItem: {
      marginRight: 16,
      alignItems: "center",
    },
    circleWrapper: {
      width: 80,
      height: 80,
      borderRadius: 40,
      overflow: "hidden",
      position: "relative",
      marginBottom: 6,
    },
    circle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? "#444" : "#ddd",
    },
    labelWrapper: {
      width: 50,
      height: 12,
      borderRadius: 4,
      overflow: "hidden",
      position: "relative",
    },
    label: {
      width: 50,
      height: 12,
      borderRadius: 4,
      backgroundColor: isDark ? "#444" : "#ddd",
    },
    shimmer: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: 60,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.15)"
        : "rgba(255,255,255,0.4)",
      opacity: 0.7,
      borderRadius: 10,
      transform: [{ rotate: "20deg" }],
    },
  });
