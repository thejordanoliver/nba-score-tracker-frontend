// components/NewsArticleSkeleton.tsx
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  useColorScheme,
  View,
  Dimensions,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function NewsArticleSkeleton() {
  const isDark = useColorScheme() === "dark";

  // Animated shimmer translation
  const shimmerTranslate = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerTranslate, {
          toValue: SCREEN_WIDTH,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerTranslate, {
          toValue: -SCREEN_WIDTH,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerTranslate]);

  const shimmerStyle = {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: isDark
      ? "rgba(255,255,255,0.15)"
      : "rgba(255,255,255,0.4)",
    opacity: 0.7,
    borderRadius: 8,
    transform: [{ rotate: "0deg" }],
  };

  const skeletonBlock = {
      backgroundColor: isDark ? "#2e2e2e" : "#eee",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden" as const,
  };

  const ShimmerBlock = ({ style }: { style: any }) => (
    <View style={[style, skeletonBlock]}>
      <Animated.View
        style={[
          shimmerStyle,
          {
            transform: [
              { translateX: shimmerTranslate },
              { rotate: "0deg" },
            ],
          },
        ]}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Title placeholder */}
      <ShimmerBlock style={styles.title} />
      {/* Image placeholder */}
      <ShimmerBlock style={styles.image} />
      {/* Content lines placeholders */}
      {[...Array(12)].map((_, i) => (
        <ShimmerBlock
          key={i}
          style={[
            styles.contentLine,
            { width: i === 11 ? "70%" : "100%" }, // last line shorter
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    height: 28,
    width: "60%",
    marginBottom: 20,
  },
  image: {
    height: 180,
    width: "100%",
    borderRadius: 12,
    marginBottom: 20,
  },
  contentLine: {
    height: 16,
    borderRadius: 6,
    marginBottom: 12,
  },
});
