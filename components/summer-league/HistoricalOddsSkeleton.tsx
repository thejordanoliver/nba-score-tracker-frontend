import React from "react";
import { View, Text, StyleSheet, useColorScheme, Dimensions } from "react-native";
import ShimmerPlaceHolder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";

const SCREEN_WIDTH = Dimensions.get("window").width;

const HistoricalOddsCardSkeleton = () => {
  const isDark = useColorScheme() === "dark";
  const shimmerColor = isDark ? "#444" : "#e0e0e0";
  const backgroundColor = isDark ? "#1e1e1e" : "#fff";

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header Row Skeleton */}
      <View style={styles.headerRow}>
        <ShimmerPlaceHolder
          shimmerColors={[shimmerColor, "#999", shimmerColor]}
          LinearGradient={LinearGradient}
          style={[styles.headerCell, { flex: 1,  }]}
        />
     
      </View>
      <View style={styles.headerRow}>
        <ShimmerPlaceHolder
          shimmerColors={[shimmerColor, "#999", shimmerColor]}
          LinearGradient={LinearGradient}
          style={[styles.headerCell, { flex: 1, marginRight: 12 }]}
        />
        {[...Array(3)].map((_, i) => (
          <ShimmerPlaceHolder
            key={`header-${i}`}
            shimmerColors={[shimmerColor, "#999", shimmerColor]}
            LinearGradient={LinearGradient}
            style={[styles.headerCell, { flex: .2, marginLeft: i === 0 ? 12 : 8 }]}
          />
        ))}
      </View>

      {/* Away Team Row Skeleton */}
      <View style={styles.teamRow}>
        {/* Team Info: Logo and Name */}
        <View style={[styles.teamInfo, { flex: 2 }]}>
          <ShimmerPlaceHolder
            shimmerColors={[shimmerColor, "#999", shimmerColor]}
            LinearGradient={LinearGradient}
            style={styles.logoSkeleton}
          />
          <ShimmerPlaceHolder
            shimmerColors={[shimmerColor, "#999", shimmerColor]}
            LinearGradient={LinearGradient}
            style={styles.teamNameSkeleton}
          />
        </View>

        {/* Odds */}
        {[...Array(3)].map((_, i) => (
          <ShimmerPlaceHolder
            key={`away-odd-${i}`}
            shimmerColors={[shimmerColor, "#999", shimmerColor]}
            LinearGradient={LinearGradient}
            style={[styles.oddsCell, { flex: .5, marginLeft: i === 0 ? 12 : 8 }]}
          />
        ))}
      </View>

      {/* Divider */}
      <View
        style={{
          borderBottomColor: isDark ? "#444" : "#ccc",
          borderBottomWidth: 1,
          marginVertical: 8,
        }}
      />

      {/* Home Team Row Skeleton */}
      <View style={styles.teamRow}>
        {/* Team Info: Logo and Name */}
        <View style={[styles.teamInfo, { flex: 2 }]}>
          <ShimmerPlaceHolder
            shimmerColors={[shimmerColor, "#999", shimmerColor]}
            LinearGradient={LinearGradient}
            style={styles.logoSkeleton}
          />
          <ShimmerPlaceHolder
            shimmerColors={[shimmerColor, "#999", shimmerColor]}
            LinearGradient={LinearGradient}
            style={styles.teamNameSkeleton}
          />
        </View>

        {/* Odds */}
        {[...Array(3)].map((_, i) => (
          <ShimmerPlaceHolder
            key={`home-odd-${i}`}
            shimmerColors={[shimmerColor, "#999", shimmerColor]}
            LinearGradient={LinearGradient}
            style={[styles.oddsCell, { flex: .5, marginLeft: i === 0 ? 12 : 8 }]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  headerCell: {
    height: 16,
    borderRadius: 6,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoSkeleton: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  teamNameSkeleton: {
    width: 100,
    height: 16,
    borderRadius: 6,
    marginLeft: 8,
  },
  oddsCell: {
    height: 16,
    borderRadius: 6,
  },
});

export default HistoricalOddsCardSkeleton;
