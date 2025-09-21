import React, { useEffect, useRef } from "react";
import { View, StyleSheet, useColorScheme, Animated, Easing } from "react-native";

export default function NewsCardSkeleton() {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  const shimmerTranslate = useRef(new Animated.Value(-150)).current;
  const shimmerOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Ping-pong shimmer animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerTranslate, {
          toValue: 600,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerTranslate, {
          toValue: -150,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulsing opacity animation
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

  const shimmerStyle = {
    transform: [{ translateX: shimmerTranslate }],
    opacity: shimmerOpacity,
  };

  return (
    <View style={styles.card}>
      {/* Thumbnail shimmer */}
      <View style={styles.shimmerClipper}>
        <View style={styles.thumbnail} />
        <Animated.View style={[styles.shimmer, styles.thumbnailShimmer, shimmerStyle]} />
      </View>

      <View style={styles.details}>
       {/* Title shimmer */}
<View style={[styles.shimmerClipper, styles.title]}>
  <Animated.View style={[styles.shimmer, { width: '40%', height: '100%' }, shimmerStyle]} />
</View>
     {/* Source shimmer */}
<View style={[styles.shimmerClipper, styles.source]}>
  <Animated.View style={[styles.shimmer, { width: '40%', height: '100%' }, shimmerStyle]} />
</View>
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      flexDirection: "column",
      backgroundColor: isDark ? "#2e2e2e" : "#eee",
      paddingBottom: 12,
      marginVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? "#3a3a3a" : "#e6e6e6",
      overflow: "hidden",
    },
    shimmerClipper: {
      position: "relative",
      overflow: "hidden",
    },
    thumbnail: {
      width: "100%",
      height: 300,
      backgroundColor: isDark ? "#444" : "#ccc",
      borderRadius: 4,
    },
    details: {
      paddingHorizontal: 12,
      marginTop: 8,
      gap: 8,
    },
    title: {
      width: "85%",
      height: 20,
      borderRadius: 6,
      backgroundColor: isDark ? "#444" : "#ccc",
    },
    source: {
      width: "40%",
      height: 14,
      borderRadius: 6,
      backgroundColor: isDark ? "#444" : "#ccc",
    },
    shimmer: {
      position: "absolute",
      top: 0,
      left: 0,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.15)"
        : "rgba(255,255,255,0.4)",
    },
    thumbnailShimmer: {
      width: 120,
      height: 300,
      borderRadius: 4,
    },
    titleShimmer: {
      width: 60,
      height: 20,
      borderRadius: 6,
    },
    sourceShimmer: {
      width: 40,
      height: 14,
      borderRadius: 6,
    },
  });
