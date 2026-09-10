import { Colors } from "constants/styles";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  View,
  ViewProps,
} from "react-native";
import { profileStyles } from "styles/ProfileStyles/ProfileScreenStyles";

export const SkeletonProfileScreen = ({ isDark }: { isDark: boolean }) => {
  const styles = profileStyles(isDark);

  // Smooth breathing pulse animation
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      { resetBeforeIteration: false },
    );

    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Base + overlay colors
  const baseColor = isDark
    ? Colors.dark.itemBackground
    : Colors.light.itemBackground;
  const overlayColor = isDark
    ? "rgba(136,136,136,0.5)"
    : "rgba(136,136,136,0.25)";

  // Each block background + overlay pulse
  const skeletonBlock = {
    backgroundColor: baseColor,
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden" as const,
  };

  // Reusable skeleton wrapper
  const ShimmerBlock = (props: ViewProps & { style?: any }) => (
    <View {...props} style={[props.style, skeletonBlock]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: overlayColor,
            opacity: pulseAnim,
          },
        ]}
      />
    </View>
  );

  const itemWidth = "32%";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
      testID="skeleton-profile-screen"
    >
      {/* Banner + profile pic */}
      <View style={styles.bannerContainer}>
        <ShimmerBlock style={styles.banner} testID="skeleton-banner" />
        <View style={styles.profilePicWrapper}>
          <ShimmerBlock
            style={styles.profilePic}
            testID="skeleton-profile-pic"
          />
        </View>
      </View>

      {/* Followers */}
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

      {/* Name + edit button */}
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
          style={[styles.editProfileBtn, { height: 40, width: 110 }]}
          testID="skeleton-edit-profile-btn"
        />
      </View>

      {/* Bio */}
      <View style={styles.bioContainer}>
        <ShimmerBlock
          style={{ height: 10, width: "100%" }}
          testID="skeleton-bio"
        />
        <ShimmerBlock
          style={{ height: 10, width: "90%" }}
          testID="skeleton-bio"
        />
        <ShimmerBlock
          style={{ height: 10, width: "80%" }}
          testID="skeleton-bio"
        />
      </View>

      {/* Favorites */}
      <View style={[styles.contentContainer, { marginTop: 60 }]}>
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
            justifyContent: "space-between",
          }}
        >
          {[...Array(6)].map((_, i) => (
            <ShimmerBlock
              key={i}
              style={{
                width: itemWidth,
                height: 130,
                borderRadius: 8,
                paddingHorizontal: 2,
                paddingVertical: 20,
              }}
              testID={`skeleton-favorite-item-${i}`}
            />
          ))}
        </View>

        {/* Edit Teams button */}
        <View style={{ width: "100%", marginTop: 10 }}>
          <ShimmerBlock
            style={{
              height: 60,
              width: "100%",
              alignSelf: "center",
              borderRadius: 20,
            }}
            testID="skeleton-edit-teams-button"
          />
        </View>
      </View>
    </ScrollView>
  );
};
