import { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";

const STAT_COLUMNS = 22;
const CELL_WIDTH = 60;
const TOTAL_WIDTH = STAT_COLUMNS * CELL_WIDTH;

export default function PlayerStatTableSkeleton() {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  const shimmerTranslate = useRef(new Animated.Value(-TOTAL_WIDTH)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerTranslate, {
          toValue: TOTAL_WIDTH,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerTranslate, {
          toValue: -TOTAL_WIDTH,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  function SkeletonRow() {
    return (
      <View style={styles.row}>
        <View style={styles.baseRow} />
        <Animated.View
          style={[
            styles.shimmerOverlay,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        />
      </View>
    );
  }

  return (
    <ScrollView horizontal>
      <View style={styles.container}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </View>
    </ScrollView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      borderRadius: 4,
      overflow: "hidden",
    },
    row: {
      height: 24,
      width: STAT_COLUMNS * CELL_WIDTH,
      marginBottom: 10,
      borderRadius: 6,
      overflow: "hidden",
    },
    baseRow: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? "#444" : "#ddd",
    },
    shimmerOverlay: {
      ...StyleSheet.absoluteFillObject,
      width: "40%",
      backgroundColor: isDark
        ? "rgba(255,255,255,0.15)"
        : "rgba(255,255,255,0.3)",
    },
  });
