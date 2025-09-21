import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  useColorScheme,
  Dimensions,
  Animated,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function TeamLocationSkeleton() {
  const isDark = useColorScheme() === "dark";
  const shimmerTranslate = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerTranslate, {
          toValue: SCREEN_WIDTH,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerTranslate, {
          toValue: -SCREEN_WIDTH,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerTranslate]);

  const bgColor = isDark ? "#333" : "#ddd";

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Title skeleton */}
      <View style={[styles.skeleton, styles.title]} />
      {/* Image skeleton */}
      <View style={[styles.skeleton, styles.image]} />
      {/* Text skeleton */}
      <View style={[styles.skeleton, styles.text]} />

      {/* Shimmer Overlay */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerTranslate }],
            backgroundColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(255,255,255,0.3)",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 12,
    overflow: "hidden", // Ensures shimmer stays inside
    position: "relative",
  },
  skeleton: {
    borderRadius: 6,
    alignSelf: "flex-start",
    backgroundColor: "#888",
  },
  title: {
    width: 120,
    height: 28,
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  text: {
    width: "80%",
    height: 20,
    marginTop: 12,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 80,
    borderRadius: 10,
    transform: [{ rotate: "45deg" }],
    opacity: 0.6,
  },
});
