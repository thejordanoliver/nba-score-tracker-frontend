import { Fonts } from "constants/fonts";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
export interface FixedWidthTabBarProps<T extends string> {
  tabs: readonly T[];
  selected: T;
  onTabPress: (tab: T) => void;
  renderLabel?: (tab: T, isSelected: boolean) => React.ReactNode;
  containerStyle?: object;
  tabWidth?: number;
  lighter?: boolean;
}

export default function FixedWidthTabBar<T extends string>({
  tabs,
  selected,
  onTabPress,
  renderLabel,
  tabWidth: fixedTabWidth,
  containerStyle,
  lighter = false,
}: FixedWidthTabBarProps<T>) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const underlineX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  const defaultLabelStyle = (isSelected: boolean, isDark: boolean) => ({
    fontSize: 14,
    fontFamily: isSelected ? Fonts.OSBOLD : Fonts.OSREGULAR,
    color: lighter
      ? "#fff"
      : isSelected
        ? isDark
          ? "#fff"
          : "#1d1d1d"
        : isDark
          ? "#888"
          : "rgba(0,0,0,0.5)",
  });

  const onLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setContainerWidth(width);
  };

  const tabWidth = fixedTabWidth ?? containerWidth / tabs.length;
  const totalWidth = tabWidth * tabs.length;

  useEffect(() => {
    const index = tabs.indexOf(selected);
    Animated.timing(underlineX, {
      toValue: index * tabWidth,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [selected, tabWidth, tabs]);

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.tabs,
        { width: fixedTabWidth ? totalWidth : "100%" },
        containerStyle,
      ]}
    >
      {tabs.map((tab) => {
        const isSelected = selected === tab;
        return (
          <Pressable
            key={tab}
            onPress={() => onTabPress(tab)}
            style={[styles.tabPressable, { width: tabWidth }]}
          >
            {renderLabel ? (
              renderLabel(tab, isSelected)
            ) : (
              <Text style={defaultLabelStyle(isSelected, isDark)}>
                {tab.toUpperCase()}
              </Text>
            )}
          </Pressable>
        );
      })}
      <Animated.View
        style={{
          width: tabWidth,
          transform: [{ translateX: underlineX }],
          height: 2,
          backgroundColor: lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d",
          position: "absolute",
          bottom: 0,
          left: 0,
          borderRadius: 50,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    position: "relative",
    marginBottom: 10,
    alignSelf: "center", // ✅ center the entire bar
  },
  tabPressable: {
    alignItems: "center",
    paddingVertical: 10,
  },
});
