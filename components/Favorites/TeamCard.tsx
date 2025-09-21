import type { Team } from "types/types";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { Fonts } from "constants/fonts";
type Props = {
  item: Team;
  isSelected: boolean;
  isGridView: boolean;
  onPress: () => void;
  itemWidth: number;
  onImageLoad?: () => void; // new prop
};

export default function TeamCard({
  item,
  isSelected,
  isGridView,
  onPress,
  itemWidth,
  onImageLoad,
}: Props) {
  const isDark = useColorScheme() === "dark";

  const [city, nickname] = (() => {
    const parts = item.fullName?.split(" ");
    return [parts?.slice(0, -1).join(" "), parts?.slice(-1).join(" ")];
  })();

  const shouldShowLight =
    isDark && ["14", "27", "38", "40"].includes(item.id)
      ? true
      : !isDark && isSelected && item.logoLight;

  const lightLogoOpacity = useRef(
    new Animated.Value(shouldShowLight ? 1 : 0)
  ).current;
  const previousShouldShowLight = useRef(shouldShowLight);

  const selectionAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const previousSelected = useRef(isSelected);

  useEffect(() => {
    if (previousSelected.current !== isSelected) {
      Animated.timing(selectionAnim, {
        toValue: isSelected ? 1 : 0,
        duration: 300,
        easing: Easing.linear,
        useNativeDriver: false, // needed for color interpolation
      }).start();
      previousSelected.current = isSelected;
    }
  }, [isSelected]);

  const selectedColor =
    isDark && item.id === "28"
      ? (item.secondary_color ?? "#E56020")
      : (item.color ?? "#000");

  const backgroundColor = selectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? "#222" : "#eee", selectedColor],
  });

  const textColor = selectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? "#fff" : "#000", "#fff"],
  });

  useEffect(() => {
    if (previousShouldShowLight.current !== shouldShowLight) {
      Animated.timing(lightLogoOpacity, {
        toValue: shouldShowLight ? 1 : 0,
        duration: 300,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
      previousShouldShowLight.current = shouldShowLight;
    }
  }, [shouldShowLight]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.6 : 1,
          width: isGridView ? itemWidth : "100%",
          marginBottom: 10,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.teamCard,
          {
            backgroundColor,
            flexDirection: isGridView ? "column" : "row",
            justifyContent: isGridView ? "center" : "flex-start",
            alignItems: "center",
            paddingHorizontal: isGridView ? 20 : 12,
            paddingVertical: 12,
            height: isGridView ? 130 : "auto",
          },
        ]}
      >
        <View style={styles.logoWrapper}>
          <Animated.Image
            source={item.logo}
            style={[
              styles.logo,
              isGridView ? { marginBottom: 8 } : { marginRight: 12 },
            ]}
            onLoad={onImageLoad} // invoke callback on load
          />
          {item.logoLight && (
            <Animated.Image
              source={item.logoLight}
              style={[
                styles.logo,
                StyleSheet.absoluteFillObject,
                isGridView ? { marginBottom: 8 } : { marginRight: 12 },
                { opacity: lightLogoOpacity },
              ]}
            />
          )}
        </View>

        {isGridView ? (
          <View style={{ alignItems: "center" }}>
            <Animated.Text style={[styles.teamName, { color: textColor }]}>
              {city}
            </Animated.Text>

            <Animated.Text style={[styles.teamName, { color: textColor }]}>
              {nickname}
            </Animated.Text>
          </View>
        ) : (
          <Animated.Text
            style={[styles.teamName, { color: textColor, marginLeft: 8 }]}
          >
            {item.fullName}
          </Animated.Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  teamCard: {
    borderRadius: 8,
  },
  teamName: {
    fontFamily: Fonts.OSREGULAR,
    fontSize: 12,
    textAlign: "center",
  },
  logoWrapper: {
    position: "relative",
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
});
