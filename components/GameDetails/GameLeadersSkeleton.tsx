import React from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import ShimmerPlaceHolder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import { Dimensions } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

const SkeletonCard = () => {
  const isDark = useColorScheme() === "dark";
  const shimmerColor = isDark ? "#444" : "#e0e0e0";

  return (
    <View style={[styles.card]}>
      <ShimmerPlaceHolder
        shimmerColors={[shimmerColor, "#999", shimmerColor]}
        LinearGradient={LinearGradient}
        style={styles.avatar}
      />
      <View style={styles.infoSection}>
        <View style={styles.nameRow}>
          <ShimmerPlaceHolder
            shimmerColors={[shimmerColor, "#999", shimmerColor]}
            LinearGradient={LinearGradient}
            style={[styles.line, { width: 100, height: 14 }]}
          />
          <ShimmerPlaceHolder
            shimmerColors={[shimmerColor, "#999", shimmerColor]}
            LinearGradient={LinearGradient}
            style={[styles.line, { width: 30, height: 12, marginLeft: 6 }]}
          />
        </View>
        <View style={styles.statRow}>
          {[...Array(3)].map((_, idx) => (
            <View key={idx} style={styles.statBlock}>
              <ShimmerPlaceHolder
                shimmerColors={[shimmerColor, "#999", shimmerColor]}
                LinearGradient={LinearGradient}
                style={[styles.line, { width: 24, height: 10 }]}
              />
              <ShimmerPlaceHolder
                shimmerColors={[shimmerColor, "#999", shimmerColor]}
                LinearGradient={LinearGradient}
                style={[styles.line, { width: 28, height: 14, marginTop: 4 }]}
              />
            </View>
          ))}
        </View>
      </View>
      <ShimmerPlaceHolder
        shimmerColors={[shimmerColor, "#999", shimmerColor]}
        LinearGradient={LinearGradient}
        style={styles.teamLogo}
      />
    </View>
  );
};

export default function GameLeadersSkeleton() {
  const isDark = useColorScheme() === "dark";
  const shimmerColor = isDark ? "#444" : "#e0e0e0";

  return (
    <View style={{ marginTop: 12 }}>
      {/* TabBar Placeholder */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-evenly",
          paddingHorizontal: 12,
          marginBottom: 16,
        }}
      >
        {[...Array(3)].map((_, idx) => (
          <ShimmerPlaceHolder
            key={idx}
            shimmerColors={[shimmerColor, "#999", shimmerColor]}
            LinearGradient={LinearGradient}
            style={{
              width: 100,
              height: 26,
              borderRadius: 8,
            }}
          />
        ))}
      </View>

      {/* Player Skeleton Cards */}
      {[...Array(2)].map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    borderRadius: 8,
  },
  avatar: {
   width: 50,
    height: 50,
    borderRadius: 25,
  },
  infoSection: {
    flex: 1,
    marginLeft: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  statRow: {
    flexDirection: "row",
    marginTop: 6,
    justifyContent: "space-between",
    paddingRight: 12,
  },
  statBlock: {
    alignItems: "flex-start",
    flex: 1,
  },
  line: {
    borderRadius: 4,
  },
  teamLogo: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 4,
  },
});
