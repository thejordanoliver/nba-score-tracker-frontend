import { getStyles } from "styles/ProfileScreen.styles";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  View,
  ViewProps,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const SkeletonProfileScreen = ({ isDark }: { isDark: boolean }) => {
  const styles = getStyles(isDark);

  // Animated value for shimmer translation
  const shimmerTranslate = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  useEffect(() => {
    // Loop shimmer animation left to right
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

  // Basic shimmer overlay style, a translucent white block with rotation
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
    transform: [{ rotate: "45deg" }],
  };

  // Wrapper style for each skeleton block
  const skeletonBlock = {
    backgroundColor: isDark ? "#333" : "#e0e0e0",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden" as const,
  };

  // Helper component to wrap shimmer inside a block
  const ShimmerBlock = (props: ViewProps & { style: any }) => {
    return (
      <View {...props} style={[props.style, skeletonBlock]}>
        <Animated.View
          style={[
            shimmerStyle,
            {
              transform: [{ translateX: shimmerTranslate }, { rotate: "0deg" }],
            },
          ]}
        />
      </View>
    );
  };

  // Mimicking grid layout from FavoriteTeamsList
  const isGridView = true;
  const numColumns = 3;
  const horizontalPadding = 40; // match your ProfileScreen padding
  const columnGap = 6;
  const rowGap = 8;
  const totalGap = columnGap * (numColumns - 1);
  const availableWidth = SCREEN_WIDTH - horizontalPadding - totalGap;
  const itemWidth = "30%";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
      testID="skeleton-profile-screen"
    >
      <View style={styles.bannerContainer}>
        <ShimmerBlock style={styles.banner} testID="skeleton-banner" />
        <View style={styles.profilePicWrapper}>
          <ShimmerBlock
            style={styles.profilePic}
            testID="skeleton-profile-pic"
          />
        </View>
      </View>

      <View style={styles.followContainer}>
        {[0, 1].map((key) => (
          <View key={key} style={styles.followItem}>
            <ShimmerBlock
              style={{ height: 20, width: 60, marginBottom: 4 }}
              testID={`skeleton-follow-title-${key}`}
            />
            <ShimmerBlock
              style={{ height: 12, width: 40 }}
              testID={`skeleton-follow-subtitle-${key}`}
            />
          </View>
        ))}
      </View>

      <View style={styles.bioContainer}>
        <View style={styles.wrapper}>
          <View style={styles.nameContainer}>
            <ShimmerBlock
              style={{ height: 20, width: 120 }}
              testID="skeleton-name-line1"
            />
            <ShimmerBlock
              style={{ height: 16, width: 100 }}
              testID="skeleton-name-line2"
            />
          </View>
          <ShimmerBlock
            style={styles.editProfileBtn}
            testID="skeleton-edit-profile-btn"
          />
        </View>
        <ShimmerBlock
          style={{ height: 40, width: "100%" }}
          testID="skeleton-bio"
        />
      </View>

      <View style={[styles.favoritesContainer, { marginTop: 80 }]}>
        <View style={styles.favoritesHeader}>
          <ShimmerBlock
            style={{ height: 20, width: 150 }}
            testID="skeleton-favorites-header"
          />
          <ShimmerBlock
            style={{ height: 20, width: 20 }}
            testID="skeleton-favorites-icon"
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            columnGap,
            rowGap,
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          {[...Array(6)].map((_, i) => (
            <ShimmerBlock
              key={i}
              style={{
                width: itemWidth,
                height: 130,
                borderRadius: 8,
                marginBottom: 4,
                paddingHorizontal: 2,
                paddingVertical: 20,
              }}
              testID={`skeleton-favorite-item-${i}`}
            />
          ))}
        </View>

        {/* Skeleton Edit Teams button */}
        <View style={{ width: "100%", marginTop: 10 }}>
          <ShimmerBlock
            style={{
              height: 60,
              width: "100%",
              alignSelf: "center",
              borderRadius: 20,
              // Center content style mimicking button
            }}
            testID="skeleton-edit-teams-button"
          />
        </View>
      </View>
    </ScrollView>
  );
};
