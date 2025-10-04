// components/NFL/ScrollableTabBar.tsx
import { Fonts } from "constants/fonts";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  useColorScheme,
} from "react-native";

export interface FixedWidthTabBarProps {
  tabs: readonly string[];
  selected: string;
  onTabPress: (tab: string) => void;
  renderLabel?: (tab: string, isSelected: boolean) => React.ReactNode;
  lighter?: boolean;
}

// 🔑 exported helper so you can reuse it elsewhere
export const getLabelStyle = (
  isDark: boolean,
  isSelected: boolean,
  lighter?: boolean,
  extra?: TextStyle
): TextStyle => ({
  fontSize: 16,
  color: isSelected
    ? lighter
      ? "#fff"
      : isDark
      ? "#fff"
      : "#1d1d1d"
    : lighter
    ? "#ccc"
    : isDark
    ? "#888"
    : "rgba(0,0,0,0.5)",
  fontFamily: Fonts.OSMEDIUM,
  ...extra,
});

export default function ScrollableTabBar({
  tabs,
  selected,
  onTabPress,
  renderLabel,
  lighter = false,
}: FixedWidthTabBarProps) {
  const isDark = useColorScheme() === "dark";
  const underlineX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const [tabWidths, setTabWidths] = useState<number[]>([]);
  const [scrollWidth, setScrollWidth] = useState(0);

  const safeTabs = (tabs ?? []).filter(
    (t): t is string => typeof t === "string" && t.trim().length > 0
  );

  // measure tab widths individually
  const handleTabLayout = (index: number, e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    setTabWidths((prev) => {
      const updated = [...prev];
      updated[index] = width;
      return updated;
    });
  };

  // move underline + scroll to selected tab
  useEffect(() => {
    const index = safeTabs.indexOf(selected);
    if (index >= 0 && tabWidths.length === safeTabs.length) {
      const xOffset = tabWidths.slice(0, index).reduce((a, b) => a + b, 0);

      // underline animation
      Animated.timing(underlineX, {
        toValue: xOffset,
        duration: 200,
        useNativeDriver: false,
      }).start();

      // scroll to keep selected tab in view (center-ish)
      const selectedWidth = tabWidths[index];
      const scrollToX = Math.max(xOffset + selectedWidth / 2 - scrollWidth / 2, 0);
      scrollRef.current?.scrollTo({ x: scrollToX, animated: true });
    }
  }, [selected, tabWidths, safeTabs, scrollWidth]);

  const underlineWidth =
    tabWidths[safeTabs.indexOf(selected)] ?? scrollWidth / safeTabs.length;

  return (
    <View style={styles.tabContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onLayout={(e) => setScrollWidth(e.nativeEvent.layout.width)}
      >
        {safeTabs.map((tab, index) => {
          const isSelected = selected === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => onTabPress(tab)}
              onLayout={(e) => handleTabLayout(index, e)}
              style={styles.tabPressable}
            >
              {renderLabel ? (
                renderLabel(tab, isSelected)
              ) : (
                <Text
                  style={{
                    ...getLabelStyle(isDark, isSelected, lighter),
                    opacity: isSelected ? 1 : 0.6,
                  }}
                >
                  {tab.toUpperCase()}
                </Text>
              )}
            </Pressable>
          );
        })}

        {tabWidths.length > 0 && (
          <Animated.View
            style={[
              styles.underline,
              {
                width: underlineWidth,
                backgroundColor: lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d",
                transform: [{ translateX: underlineX }],
              },
            ]}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    position: "relative",
    width: "100%",
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabPressable: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  underline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2,
    borderRadius: 50,
  },
});
