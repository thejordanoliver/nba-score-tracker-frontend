import { Colors, Fonts, activeOpacity } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ScheduleMonthKey,
  ScheduleMonthOption,
} from "types/schedule";
import {
  Animated,
  Dimensions,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MonthSelectorSkeleton from "../Skeletons/MonthSelectorSkeleton";

type Props = {
  months: ScheduleMonthOption[];
  selected: ScheduleMonthKey | null;
  onSelect: (key: ScheduleMonthKey) => void;
  loading?: boolean;
};

const ITEM_WIDTH = 70;
const ITEM_HEIGHT = 44;
const SIDE_PADDING = 12;
const ITEM_SPACING = 0;

export default function MonthSelector({
  months,
  selected,
  onSelect,
  loading = false,
}: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";

  const scrollRef = useRef<ScrollView>(null);
  const indicatorX = useRef(new Animated.Value(0)).current;

  const [containerWidth, setContainerWidth] = useState(
    Dimensions.get("window").width,
  );

  const itemStep = ITEM_WIDTH + ITEM_SPACING;

  const rawItemsWidth = useMemo(() => {
    return (
      months.length * ITEM_WIDTH + ITEM_SPACING * Math.max(0, months.length - 1)
    );
  }, [months.length]);

  const needsScroll = rawItemsWidth + SIDE_PADDING * 2 > containerWidth;

  const horizontalPadding = needsScroll
    ? SIDE_PADDING
    : Math.max((containerWidth - rawItemsWidth) / 2, SIDE_PADDING);

  const contentWidth = horizontalPadding * 2 + rawItemsWidth;

  const styles = monthSelectorStyles(isDark, horizontalPadding);

  const selectedIndex = useMemo(() => {
    if (!selected || !months.length) return 0;

    const index = months.findIndex((item) => item.key === selected);

    return index === -1 ? 0 : index;
  }, [months, selected]);

  const safeSelectedIndex = useMemo(() => {
    if (!months.length) return 0;
    return Math.min(Math.max(selectedIndex, 0), months.length - 1);
  }, [months.length, selectedIndex]);

  const onLayoutContainer = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const computeScrollOffset = useCallback(
    (index: number) => {
      if (!containerWidth || !months.length || !needsScroll) return 0;

      const targetOffset =
        horizontalPadding +
        index * itemStep -
        containerWidth / 2 +
        ITEM_WIDTH / 2;

      const maxOffset = Math.max(0, contentWidth - containerWidth);

      return Math.max(0, Math.min(targetOffset, maxOffset));
    },
    [
      containerWidth,
      months.length,
      needsScroll,
      horizontalPadding,
      itemStep,
      contentWidth,
    ],
  );

  const handleSelectMonth = useCallback(
    (key: ScheduleMonthKey, index: number) => {
      onSelect(key);

      scrollRef.current?.scrollTo({
        x: computeScrollOffset(index),
        animated: true,
      });
    },
    [computeScrollOffset, onSelect],
  );

  useEffect(() => {
    if (!months.length) return;

    Animated.spring(indicatorX, {
      toValue: safeSelectedIndex * itemStep,
      useNativeDriver: true,
      tension: 90,
      friction: 12,
    }).start();
  }, [indicatorX, itemStep, months.length, safeSelectedIndex]);

  useEffect(() => {
    if (!scrollRef.current || !months.length || !needsScroll) return;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        x: computeScrollOffset(safeSelectedIndex),
        animated: true,
      });
    });
  }, [
    months.length,
    needsScroll,
    safeSelectedIndex,
    containerWidth,
    horizontalPadding,
    computeScrollOffset,
  ]);

  if (loading && !months.length) {
    return <MonthSelectorSkeleton />;
  }

  if (!months.length) {
    return null;
  }

  return (
    <View style={styles.monthSelector} onLayout={onLayoutContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemStep}
        decelerationRate="fast"
        contentContainerStyle={styles.contentContainerStyle}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.slidingSelectedContainer,
            {
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />

        {months.map(
          ({ key, label, count }, index) => {
            const isSelected = index === safeSelectedIndex;

            return (
              <TouchableOpacity
                key={key}
                activeOpacity={activeOpacity}
                onPress={() => handleSelectMonth(key, index)}
                style={styles.monthButton}
              >
                <Text
                  numberOfLines={1}
                  style={
                    isSelected ? styles.monthTextSelected : styles.monthText
                  }
                >
                  {label}
                </Text>

                <Text
                  numberOfLines={1}
                  style={
                    isSelected
                      ? styles.gameCountTextSelected
                      : styles.gameCountText
                  }
                >
                  {count} Games
                </Text>
              </TouchableOpacity>
            );
          },
        )}
      </ScrollView>
    </View>
  );
}

export const monthSelectorStyles = (
  isDark: boolean,
  horizontalPadding: number,
) =>
  StyleSheet.create({
    monthSelector: {
      flexDirection: "row",
      marginVertical: 8,
    },
    contentContainerStyle: {
      position: "relative",
      alignItems: "center",
      paddingHorizontal: horizontalPadding,
    },
    slidingSelectedContainer: {
      position: "absolute",
      top: 0,
      left: horizontalPadding,
      width: ITEM_WIDTH,
      height: ITEM_HEIGHT,
      borderWidth: 1,
      borderColor: isDark ? Colors.white : Colors.black,
      borderRadius: 12,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
      overflow: "hidden",
    },
    monthButton: {
      zIndex: 2,
      alignItems: "center",
      justifyContent: "center",
      width: ITEM_WIDTH,
      height: ITEM_HEIGHT,
      padding: 4,
      borderRadius: 12,
    },
    monthText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 18,
      color: Colors.midTone,
      textAlign: "center",
    },
    monthTextSelected: {
      fontFamily: Fonts.BOLD,
      fontSize: 18,
      color: isDark ? Colors.dark.text : Colors.light.text,
      textAlign: "center",
    },
    gameCountText: {
      marginTop: 1,
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      color: Colors.midTone,
      textAlign: "center",
    },
    gameCountTextSelected: {
      marginTop: 1,
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      color: isDark ? Colors.dark.text : Colors.light.text,
      textAlign: "center",
    },
  });
