// components/Games/Headings/HeaderSkeleton.tsx
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, useColorScheme, View } from "react-native";

export default function HeaderSkeleton() {
  const isDark = useColorScheme() === "dark";
  const shimmerTranslate = useRef(new Animated.Value(0)).current;

  const skeletonWidth = 160; // width of skeletonBase
  const shimmerWidth = 40;   // narrow shimmer

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerTranslate, {
          toValue: skeletonWidth * 1.2, // go slightly past right edge
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerTranslate, {
          toValue: -shimmerWidth * 1.5, // start slightly past left edge
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.skeletonBase,
          { backgroundColor: isDark ? "#444" : "#ccc", width: skeletonWidth },
        ]}
      >
        <Animated.View
          style={[
            styles.shimmer,
            {
              width: shimmerWidth,
              transform: [{ translateX: shimmerTranslate }],
              backgroundColor: isDark
                ? "rgba(255,255,255,0.15)"
                : "rgba(255,255,255,0.4)",
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 12,
  },
  skeletonBase: {
    height: 28,
    borderRadius: 4,
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
});
