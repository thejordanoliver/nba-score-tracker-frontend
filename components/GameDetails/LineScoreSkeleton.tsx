import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Animated,
  useColorScheme,
  Dimensions,
} from "react-native";


const { width } = Dimensions.get("window");

export default function LineScoreSkeleton() {
  const isDark = useColorScheme() === "dark";
  const baseColor = isDark ? "#333" : "#e0e0e0";
  const highlightColor = isDark ? "#555" : "#f5f5f5";

  // Shimmer animation
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const QuarterPlaceholder = () => (
    <View style={styles.quarter}>
      <View style={[styles.bar, { backgroundColor: baseColor }]}>
        <Animated.View
          style={[
            styles.highlight,
            { backgroundColor: highlightColor, transform: [{ translateX }] },
          ]}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Heading placeholder */}
      <View style={styles.headingBar}>
        <Animated.View
          style={[
            styles.highlight,
            { backgroundColor: highlightColor, transform: [{ translateX }] },
          ]}
        />
      </View>

      {/* Away row */}
      <View style={styles.row}>
        <View style={[styles.teamCode, { backgroundColor: baseColor }]}>
          <Animated.View
            style={[
              styles.highlight,
              { backgroundColor: highlightColor, transform: [{ translateX }] },
            ]}
          />
        </View>
        <View style={styles.scoresWrapper}>
          {Array.from({ length: 5 }).map((_, i) => (
            <QuarterPlaceholder key={`away-q-${i}`} />
          ))}
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: baseColor }]} />

      {/* Home row */}
      <View style={styles.row}>
        <View style={[styles.teamCode, { backgroundColor: baseColor }]}>
          <Animated.View
            style={[
              styles.highlight,
              { backgroundColor: highlightColor, transform: [{ translateX }] },
            ]}
          />
        </View>
        <View style={styles.scoresWrapper}>
          {Array.from({ length: 5 }).map((_, i) => (
            <QuarterPlaceholder key={`home-q-${i}`} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 10,
  },
  headingBar: {
    height: 14,
    borderRadius: 4,
    marginBottom: 12,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  teamCode: {
    width: 40,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
    overflow: "hidden",
  },
  scoresWrapper: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  quarter: {
    flex: 1,
    alignItems: "center",
  },
  bar: {
    width: 24,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: 6,
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
  },
});
