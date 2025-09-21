import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  GestureResponderEvent,
  Pressable,
  Text,
  useColorScheme,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Fonts } from "constants/fonts";

type Props = {
  isFollowing: boolean;
  onToggle: () => void;
  loading?: boolean;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
};

export default function FollowingButton({
  isFollowing,
  onToggle,
  loading = false,
  containerStyle,
  textStyle,
}: Props) {
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

  const borderColor = isDark ? "#fff" : "#1d1d1d";

  return (
    <Animated.View
      style={[
        {
          opacity: opacityAnim,
          width: 80,
          overflow: "hidden",
          marginVertical: 4,
        },
        containerStyle,
      ]}
    >
      <Pressable
        onPress={handlePress}
        disabled={loading}
        style={{
          backgroundColor,
          borderColor,
          borderRadius: 8,
          borderWidth: 1,
          paddingVertical: 8,
          paddingHorizontal: 16,
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <Text
            style={[
              {
                color: textColor,
                fontSize: 12,
                fontFamily: Fonts.OSMEDIUM,
              },
              textStyle,
            ]}
          >
            {isFollowing ? "Following" : "Follow"}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
