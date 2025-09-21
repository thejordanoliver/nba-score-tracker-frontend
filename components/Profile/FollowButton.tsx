import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  GestureResponderEvent,
  Pressable,
  Text,
  useColorScheme,
} from "react-native";
import { Fonts } from "constants/fonts";
type FollowButtonProps = {
  isFollowing: boolean;
  loading: boolean;
  onToggle: () => void;
};



export default function FollowButton({
  isFollowing,
  loading,
  onToggle,
}: FollowButtonProps) {
  const isDark = useColorScheme() === "dark";

  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 0.3,
        duration: 150,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFollowing]);

  const handlePress = (e: GestureResponderEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loading) onToggle();
  };

  const backgroundColor = isFollowing
    ? isDark
      ? "#fff"
      : "#1d1d1d"
    : "transparent";

  const textColor = isFollowing
    ? isDark
      ? "#1d1d1d"
      : "#fff"
    : isDark
      ? "#fff"
      : "#1d1d1d";

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        width: 120,
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={handlePress}
        disabled={loading}
        style={{
          backgroundColor,
          borderColor: isDark ? "#fff" : "#1d1d1d",
          borderWidth: 1,
          borderRadius: 10,
          paddingVertical: 10,
          paddingHorizontal: 20,
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <Text
            style={{
              color: textColor,
              fontSize: 16,
              fontFamily: Fonts.OSMEDIUM,
            }}
          >
            {isFollowing ? "Following" : "Follow"}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
