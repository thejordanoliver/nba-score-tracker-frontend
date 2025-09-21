import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

type Props = {
  isGridView: boolean;
  itemWidth: number;
  count?: number;
};


export default function FavoriteTeamsSelectorSkeleton({
  isGridView,
  itemWidth,
  count = 30,
}: Props) {
  const skeletons = Array.from({ length: count });
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);
  const textWidth1 = isGridView ? itemWidth * 0.6 : itemWidth * 0.4;
  const textWidth2 = isGridView ? itemWidth * 0.4 : 0;

  const shimmerLogo = useRef(new Animated.Value(-80)).current;
  const shimmerText1 = useRef(new Animated.Value(-80)).current;
  const shimmerText2 = useRef(new Animated.Value(-80)).current;
  const shimmerOpacity = useRef(new Animated.Value(0.5)).current;

  const animateBackAndForth = (val: Animated.Value, width: number) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(val, {
          toValue: width + 80,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(val, {
          toValue: -80,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    animateBackAndForth(shimmerLogo, 50);
    animateBackAndForth(shimmerText1, textWidth1);
    if (isGridView) animateBackAndForth(shimmerText2, textWidth2);

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerOpacity, {
          toValue: 0.5,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [
    shimmerLogo,
    shimmerText1,
    shimmerText2,
    shimmerOpacity,
    textWidth1,
    textWidth2,
    isGridView,
  ]);

  return (
    <View
      style={[
        styles.container,
        isGridView ? styles.gridContainer : styles.listContainer,
      ]}
    >
      {skeletons.map((_, index) => (
        <View
          key={index}
          style={[
            styles.skeletonCard,
            {
              width: isGridView ? itemWidth : "100%",
              height: isGridView ? 130 : 60,
              marginBottom: 12,
            },
          ]}
        >
          {/* Logo shimmer */}
          <View
            style={[
              styles.shimmerClipper,
              { width: 50, height: 50, borderRadius: 25 },
            ]}
          >
            <View style={styles.skeletonLogo} />
            <Animated.View
              style={[
                styles.shimmer,
                {
                  width: 30,
                  height: 50,
                  transform: [{ translateX: shimmerLogo }],
                  opacity: shimmerOpacity,
                },
              ]}
            />
          </View>

          {/* Text line 1 shimmer */}
          <View
            style={[
              styles.shimmerClipper,
              {
                width: textWidth1,
                height: 12,
                marginTop: 8,
                borderRadius: 6,
              },
            ]}
          >
            <View style={styles.skeletonText} />
            <Animated.View
              style={[
                styles.shimmer,
                {
                  width: 60,
                  height: 12,
                  borderRadius: 6,
                  transform: [{ translateX: shimmerText1 }],
                  opacity: shimmerOpacity,
                },
              ]}
            />
          </View>

          {/* Text line 2 shimmer */}
          {isGridView && (
            <View
              style={[
                styles.shimmerClipper,
                {
                  width: textWidth2,
                  height: 12,
                  marginTop: 4,
                  borderRadius: 6,
                },
              ]}
            >
              <View style={styles.skeletonText} />
              <Animated.View
                style={[
                  styles.shimmer,
                  {
                    width: 60,
                    height: 12,
                    borderRadius: 6,
                    transform: [{ translateX: shimmerText2 }],
                    opacity: shimmerOpacity,
                  },
                ]}
              />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexWrap: "wrap",
    },
    gridContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    listContainer: {
      flexDirection: "column",
    },
    skeletonCard: {
      backgroundColor: isDark ? "#444" : "#ddd",
      borderRadius: 8,
      padding: 12,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    shimmerClipper: {
      position: "relative",
      overflow: "hidden",
    },
    skeletonLogo: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: isDark ? "#666" : "#bbb",
    },
    skeletonText: {
      flex: 1,
      height: 12,
      borderRadius: 6,
      backgroundColor: isDark ? "#666" : "#bbb",
    },
    shimmer: {
      position: "absolute",
      top: 0,
      left: 0,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.15)"
        : "rgba(255,255,255,0.4)",
    },
  });
