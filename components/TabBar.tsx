// TabBar.tsx
import React, { useRef, useEffect } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  TextStyle,
  ViewStyle,
  StyleProp,
} from "react-native";

export interface TabBarProps<T extends string> {
  tabs: readonly T[];
  selected: T;
  onTabPress: (tab: T) => void;
  renderLabel?: (tab: T, isSelected: boolean) => React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function TabBar<T extends string>({
  tabs,
  selected,
  onTabPress,
  renderLabel,
  style,
}: TabBarProps<T>) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const underlineX = useRef(new Animated.Value(0)).current;
  const underlineWidth = useRef(new Animated.Value(0)).current;

  const textMeasurements = useRef<{ width: number }[]>([]);
  const pressableMeasurements = useRef<{ x: number; width: number }[]>([]);
  const isInitialized = useRef(false);

  const onTextLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    textMeasurements.current[index] = { width };
    maybeInitializeUnderline();
  };

  const onPressableLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    pressableMeasurements.current[index] = { x, width };
    maybeInitializeUnderline();
  };

  const maybeInitializeUnderline = () => {
    if (
      textMeasurements.current.length === tabs.length &&
      pressableMeasurements.current.length === tabs.length &&
      textMeasurements.current.every((m) => m !== undefined) &&
      pressableMeasurements.current.every((m) => m !== undefined) &&
      !isInitialized.current
    ) {
      const index = tabs.indexOf(selected);
      const initialX = calculateUnderlineX(index);
      underlineX.setValue(initialX);
      underlineWidth.setValue(textMeasurements.current[index].width);
      isInitialized.current = true;
    }
  };

  const calculateUnderlineX = (index: number) => {
    const textWidth = textMeasurements.current[index].width;
    const pressable = pressableMeasurements.current[index];
    return pressable.x + (pressable.width - textWidth) / 2;
  };

  useEffect(() => {
    const index = tabs.indexOf(selected);
    const textMeasurement = textMeasurements.current[index];
    const pressableMeasurement = pressableMeasurements.current[index];

    if (textMeasurement && pressableMeasurement) {
      const x = calculateUnderlineX(index);
      Animated.parallel([
        Animated.timing(underlineX, {
          toValue: x,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(underlineWidth, {
          toValue: textMeasurement.width,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [selected, tabs]);

  const defaultLabelStyle = (tab: T, isSelected: boolean): TextStyle => ({
    fontSize: tab.toLowerCase() === "home" ? 20 : 18,
    color: isSelected
      ? isDark
        ? "#fff"
        : "#1d1d1d"
      : isDark
        ? "#888"
        : "rgba(0, 0, 0, 0.5)",
    fontFamily: "Oswald_400Regular",
  });

  const underlineStyle: ViewStyle = {
    width: underlineWidth,
    transform: [{ translateX: underlineX }],
    height: 2,
    borderRadius: 100,
    backgroundColor: isDark ? "#fff" : "#1d1d1d",
    position: "absolute",
    bottom: 0,
    left: 0,
  };

  return (
    <View style={[styles.tabs, style]}>
      {tabs.map((tab, i) => {
        const isSelected = selected === tab;
        return (
          <Pressable
            key={tab}
            onPress={() => onTabPress(tab)}
            onLayout={onPressableLayout(i)}
            style={styles.tabPressable}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Switch to ${tab} tab`}
          >
            <View onLayout={onTextLayout(i)}>
              {renderLabel ? (
                renderLabel(tab, isSelected)
              ) : (
                <Text style={defaultLabelStyle(tab, isSelected)}>
                  {tab.toUpperCase()}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
      <Animated.View style={underlineStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    position: "relative",
  },
  tabPressable: {
    paddingTop: 10,
    paddingBottom: 4,
    paddingHorizontal: 16,
    alignItems: "center",
  },
});
