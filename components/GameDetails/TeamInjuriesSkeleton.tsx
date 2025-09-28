import React from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import ShimmerPlaceHolder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";

export const TeamInjuriesSkeleton = () => {
  const isDark = useColorScheme() === "dark";
  const shimmerColor = isDark ? "#444" : "#e0e0e0";
  const backgroundColor = isDark ? "#1e1e1e" : "#fff";

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Heading */}
      <ShimmerPlaceHolder
        shimmerColors={[shimmerColor, "#999", shimmerColor]}
        LinearGradient={LinearGradient}
        style={styles.heading}
      />

      {/* Tab Bar Skeleton */}
      <View style={styles.tabRow}>
        {[...Array(2)].map((_, i) => (
          <View key={`tab-${i}`} style={styles.tabItem}>
            <ShimmerPlaceHolder
              shimmerColors={[shimmerColor, "#999", shimmerColor]}
              LinearGradient={LinearGradient}
              style={styles.tabLogo}
            />
            <ShimmerPlaceHolder
              shimmerColors={[shimmerColor, "#999", shimmerColor]}
              LinearGradient={LinearGradient}
              style={styles.tabCode}
            />
          </View>
        ))}
      </View>

      {/* Injury List Skeleton */}
      <View style={styles.injuryList}>
        {[...Array(3)].map((_, i) => (
          <View key={`injury-${i}`} style={styles.injuryRow}>
            {/* Player avatar circle */}
            <ShimmerPlaceHolder
              shimmerColors={[shimmerColor, "#999", shimmerColor]}
              LinearGradient={LinearGradient}
              style={styles.avatar}
            />
            <View style={{ flex: 1 }}>
              {/* Player name */}
              <ShimmerPlaceHolder
                shimmerColors={[shimmerColor, "#999", shimmerColor]}
                LinearGradient={LinearGradient}
                style={styles.playerName}
              />
              {/* Status / Note */}
              <ShimmerPlaceHolder
                shimmerColors={[shimmerColor, "#999", shimmerColor]}
                LinearGradient={LinearGradient}
                style={styles.playerNote}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  heading: {
    width: 120,
    height: 18,
    borderRadius: 6,
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  tabLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  tabCode: {
    width: 28,
    height: 14,
    borderRadius: 4,
    marginLeft: 6,
  },
  injuryList: {
    marginTop: 8,
  },
  injuryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  playerName: {
    width: "60%",
    height: 14,
    borderRadius: 4,
    marginBottom: 6,
  },
  playerNote: {
    width: "40%",
    height: 12,
    borderRadius: 4,
  },
});

export default TeamInjuriesSkeleton;
