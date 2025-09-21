import React from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import ShimmerPlaceHolder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import { Dimensions } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

const SkeletonCard = ({ shimmerColors }: { shimmerColors: string[] }) => {
  return (
    <View style={[styles.card]}>
      <ShimmerPlaceHolder
        shimmerColors={shimmerColors}
        LinearGradient={LinearGradient}
        style={styles.avatar}
      />
      <View style={styles.infoSection}>
        <View style={styles.nameRow}>
          <ShimmerPlaceHolder
            shimmerColors={shimmerColors}
            LinearGradient={LinearGradient}
            style={[styles.line, { width: 100, height: 14 }]}
          />
          <ShimmerPlaceHolder
            shimmerColors={shimmerColors}
            LinearGradient={LinearGradient}
            style={[styles.line, { width: 30, height: 12, marginLeft: 6 }]}
          />
        </View>
        <View style={styles.statRow}>
          {[...Array(3)].map((_, idx) => (
            <View key={idx} style={styles.statBlock}>
              <ShimmerPlaceHolder
                shimmerColors={shimmerColors}
                LinearGradient={LinearGradient}
                style={[styles.line, { width: 24, height: 10 }]}
              />
              <ShimmerPlaceHolder
                shimmerColors={shimmerColors}
                LinearGradient={LinearGradient}
                style={[styles.line, { width: 28, height: 14, marginTop: 4 }]}
              />
            </View>
          ))}
        </View>
      </View>
      <ShimmerPlaceHolder
        shimmerColors={shimmerColors}
        LinearGradient={LinearGradient}
        style={styles.teamLogo}
      />
    </View>
  );
};

export default function GameDetailsSkeleton() {
  const isDark = useColorScheme() === "dark";
  const shimmerColor = isDark ? "#444" : "#e0e0e0";

  const shimmerColors = [shimmerColor, "#999", shimmerColor];

  return (
    <View style={{ gap: 20, marginTop: 20 }}>
      {/* Linescore placeholder */}
      <ShimmerPlaceHolder
        shimmerColors={shimmerColors}
        LinearGradient={LinearGradient}
        style={{ width: "100%", height: 60, borderRadius: 6 }}
      />

      {/* Odds placeholder */}
      <ShimmerPlaceHolder
        shimmerColors={shimmerColors}
        LinearGradient={LinearGradient}
        style={{ width: "100%", height: 80, borderRadius: 6 }}
      />

      {/* Prediction bar placeholder */}
      <ShimmerPlaceHolder
        shimmerColors={shimmerColors}
        LinearGradient={LinearGradient}
        style={{ width: "100%", height: 40, borderRadius: 6 }}
      />

      {/* Game Leaders placeholder */}
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
              shimmerColors={shimmerColors}
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
          <SkeletonCard key={idx} shimmerColors={shimmerColors} />
        ))}
      </View>

      {/* Box score placeholder */}
      <ShimmerPlaceHolder
        shimmerColors={shimmerColors}
        LinearGradient={LinearGradient}
        style={{ width: "100%", height: 120, borderRadius: 6 }}
      />

      {/* Officials / Injuries placeholder */}
      <ShimmerPlaceHolder
        shimmerColors={shimmerColors}
        LinearGradient={LinearGradient}
        style={{ width: "100%", height: 60, borderRadius: 6 }}
      />
      <ShimmerPlaceHolder
        shimmerColors={shimmerColors}
        LinearGradient={LinearGradient}
        style={{ width: "100%", height: 60, borderRadius: 6 }}
      />

      {/* Last 5 games placeholder */}
      <ShimmerPlaceHolder
        shimmerColors={shimmerColors}
        LinearGradient={LinearGradient}
        style={{ width: "100%", height: 80, borderRadius: 6 }}
      />

      {/* Uniforms placeholder */}
      <ShimmerPlaceHolder
        shimmerColors={shimmerColors}
        LinearGradient={LinearGradient}
        style={{ width: "100%", height: 60, borderRadius: 6 }}
      />

      {/* Arena / Weather placeholder */}
      <ShimmerPlaceHolder
        shimmerColors={shimmerColors}
        LinearGradient={LinearGradient}
        style={{ width: "100%", height: 120, borderRadius: 6 }}
      />
      <ShimmerPlaceHolder
        shimmerColors={shimmerColors}
        LinearGradient={LinearGradient}
        style={{ width: "100%", height: 60, borderRadius: 6 }}
      />
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
