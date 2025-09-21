import { Fonts } from "constants/fonts";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  useColorScheme,
} from "react-native";

export interface FixedWidthTabBarProps<T extends string> {
  tabs: readonly T[]; // Must be exactly 2 elements
  selected: T;
  onTabPress: (tab: T) => void;
  renderLabel?: (tab: T, isSelected: boolean) => React.ReactNode;
  lighter?: boolean; // <-- new prop
}

export default function FixedWidthTabBar<T extends string>({
  tabs,
  selected,
  onTabPress,
  renderLabel,
  lighter = false, // default false
}: FixedWidthTabBarProps<T>) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const underlineX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  const tabWidth = containerWidth / 2;

  useEffect(() => {
    const index = tabs.indexOf(selected);
    Animated.timing(underlineX, {
      toValue: index * tabWidth,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [selected, tabWidth]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const defaultLabelStyle = (isSelected: boolean): TextStyle => ({
    fontSize: 16,
    color: lighter
      ? "#fff"
      : isSelected
        ? isDark
          ? "#fff"
          : "#1d1d1d"
        : isDark
          ? "#888"
          : "rgba(0, 0, 0, 0.5)",
    fontFamily: Fonts.OSMEDIUM,
  });

  return (
    <View onLayout={handleLayout} style={styles.tabContainer}>
      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const isSelected = selected === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => onTabPress(tab)}
              style={styles.tabPressable}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Switch to ${tab} tab`}
            >
              {renderLabel ? (
                renderLabel(tab, isSelected)
              ) : (
                <Text style={defaultLabelStyle(isSelected)}>
                  {tab.toUpperCase()}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.underline,
            {
              width: tabWidth,
              backgroundColor: lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d",
              transform: [{ translateX: underlineX }],
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    position: "relative",
    marginBottom: 10,
    width: "100%",
  },
  tabs: {
    flexDirection: "row",
  },
  tabPressable: {
    width: "50%",
    alignItems: "center",
    paddingBottom: 10,
  },
  underline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2,
    borderRadius: 50,
  },
});
