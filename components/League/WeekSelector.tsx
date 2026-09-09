import { Colors, Fonts, activeOpacity } from "@/constants/styles";
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import WeekSelectorSkeleton from "../Skeletons/WeekSelectorSkeleton";

export type FootballWeekGroup = {
  key: string;
  label: string;
  season: {
    year: number | null;
    type: number | null;
    slug: string | null;
  };
  week: {
    number: number | null;
  };
  count: number;
  games?: unknown[];
};

type Props = {
  groups: FootballWeekGroup[];
  loading: boolean;
  selectedWeekIndex: number | null;
  onSelectWeek: (index: number) => void;
  isDark: boolean;
  containerStyle?: ViewStyle;
  itemWidth?: number;
};

const DEFAULT_ITEM_WIDTH = 100;
const SIDE_PADDING = 12;
const ITEM_SPACING = 0;
const ITEM_HEIGHT = 32;

function getWeekLabel(group: FootballWeekGroup): string {
  const label = group.label || "";
  const weekNumber = group.week?.number;

  if (label.includes("Preseason Week")) {
    return `Pre Week ${weekNumber}`;
  }

  if (label.includes("Hall of Fame")) {
    return "HOF Week";
  }

  if (label.includes("Conference")) {
    return "Conf Round";
  }

  if (label.includes("Divisional")) {
    return "Div Round";
  }

  if (label.includes("Wild Card")) {
    return "Wild Card";
  }

  if (label.includes("Super Bowl")) {
    return "Super Bowl";
  }

  if (weekNumber !== null && weekNumber !== undefined) {
    return label || `Week ${weekNumber}`;
  }

  return label || "Week";
}

export default function WeekSelector({
  groups,
  loading,
  selectedWeekIndex,
  onSelectWeek,
  isDark,
  containerStyle,
  itemWidth = DEFAULT_ITEM_WIDTH,
}: Props) {
  const styles = WeekSelectorStyles(isDark, itemWidth);

  const scrollViewRef = useRef<ScrollView>(null);

  const indicatorX = useRef(new Animated.Value(0)).current;
  const hasPositionedIndicatorRef = useRef(false);
  const hasAlignedScrollRef = useRef(false);

  const [containerWidth, setContainerWidth] = useState(0);

  const itemStep = itemWidth + ITEM_SPACING;

  /**
   * null means the parent has not resolved the active week yet.
   *
   * Do not convert null to 0 here because index 0 may be HOF Week.
   */
  const safeSelectedIndex = useMemo<number | null>(() => {
    if (selectedWeekIndex == null || !groups.length) {
      return null;
    }

    return Math.min(Math.max(selectedWeekIndex, 0), groups.length - 1);
  }, [groups.length, selectedWeekIndex]);

  const onLayoutContainer = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  const computeScrollOffset = useCallback(
    (index: number): number => {
      if (!containerWidth || !groups.length) {
        return 0;
      }

      const targetOffset =
        SIDE_PADDING + index * itemStep - containerWidth / 2 + itemWidth / 2;

      const totalWidth =
        SIDE_PADDING * 2 +
        groups.length * itemWidth +
        ITEM_SPACING * Math.max(groups.length - 1, 0);

      const maxOffset = Math.max(0, totalWidth - containerWidth);

      return Math.max(0, Math.min(targetOffset, maxOffset));
    },
    [containerWidth, groups.length, itemStep, itemWidth],
  );

  const handleSelectWeek = useCallback(
    (index: number) => {
      onSelectWeek(index);

      scrollViewRef.current?.scrollTo({
        x: computeScrollOffset(index),
        animated: true,
      });
    },
    [computeScrollOffset, onSelectWeek],
  );

  /**
   * Move the selected pill only after a real selected week exists.
   */
  useLayoutEffect(() => {
    if (safeSelectedIndex == null || !groups.length) {
      return;
    }

    const targetValue = safeSelectedIndex * itemStep;

    if (!hasPositionedIndicatorRef.current) {
      indicatorX.setValue(targetValue);
      hasPositionedIndicatorRef.current = true;
      return;
    }

    const animation = Animated.spring(indicatorX, {
      toValue: targetValue,
      useNativeDriver: true,
      tension: 90,
      friction: 12,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [safeSelectedIndex, itemStep, groups.length, indicatorX]);

  /**
   * Keep the selected week centered.
   *
   * This intentionally does nothing while selectedWeekIndex is null.
   */
  useLayoutEffect(() => {
    if (
      safeSelectedIndex == null ||
      !scrollViewRef.current ||
      !containerWidth ||
      !groups.length
    ) {
      return;
    }

    scrollViewRef.current.scrollTo({
      x: computeScrollOffset(safeSelectedIndex),
      animated: hasAlignedScrollRef.current,
    });

    hasAlignedScrollRef.current = true;
  }, [safeSelectedIndex, containerWidth, groups.length, computeScrollOffset]);

  if (loading && !groups.length) {
    return <WeekSelectorSkeleton />;
  }

  if (!groups.length) {
    return null;
  }

  return (
    <View style={[styles.wrapper, containerStyle]} onLayout={onLayoutContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemStep}
        decelerationRate="fast"
        contentContainerStyle={styles.contentContainerStyle}
      >
        {safeSelectedIndex != null ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.slidingSelectedContainer,
              {
                transform: [
                  {
                    translateX: indicatorX,
                  },
                ],
              },
            ]}
          />
        ) : null}

        {groups.map((group, index) => {
          const isSelected =
            safeSelectedIndex != null && index === safeSelectedIndex;

          return (
            <TouchableOpacity
              key={group.key || `${group.season?.slug}-${group.week?.number}`}
              activeOpacity={activeOpacity}
              onPress={() => handleSelectWeek(index)}
              style={styles.label}
            >
              <Text
                numberOfLines={1}
                style={isSelected ? styles.monthTextSelected : styles.monthText}
              >
                {getWeekLabel(group)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const WeekSelectorStyles = (isDark: boolean, itemWidth: number) =>
  StyleSheet.create({
    wrapper: {
      marginVertical: 8,
    },

    contentContainerStyle: {
      position: "relative",
      alignItems: "center",
      paddingHorizontal: SIDE_PADDING,
    },

    slidingSelectedContainer: {
      position: "absolute",
      top: 0,
      left: SIDE_PADDING,
      width: itemWidth,
      height: ITEM_HEIGHT,
      borderWidth: 1,
      borderColor: isDark ? Colors.white : Colors.black,
      borderRadius: 12,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
      overflow: "hidden",
    },

    label: {
      zIndex: 2,
      alignItems: "center",
      justifyContent: "center",
      width: itemWidth,
      height: ITEM_HEIGHT,
      padding: 4,
      borderRadius: 8,
    },

    monthText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textAlign: "center",
    },

    monthTextSelected: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 16,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
  });
