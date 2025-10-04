// components/WeekSelector.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type NFLWeek = {
  label: string; // e.g., "Pre1", "W1", "P1", "SB"
  stage: string; // e.g., "Pre Season", "Regular Season", "Playoffs", "Super Bowl"
  weekNumber: number; // numeric week for filtering
};

type Props = {
  weeks: NFLWeek[];
  selectedWeekIndex?: number; // make optional
  onSelectWeek: (index: number) => void;
  monthTextStyle: any;
  monthTextSelectedStyle: any;
};

export default function WeekSelector({
  weeks,
  selectedWeekIndex = 0,
  onSelectWeek,
  monthTextStyle,
  monthTextSelectedStyle,
}: Props) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const itemWidth = 60; // width of each week button
  const spacing = 8; // space between buttons

  const indexToOffset = (
    index: number,
    itemWidth: number,
    spacing: number,
    containerWidth: number
  ) => {
    const centerOffset =
      index * (itemWidth + spacing) + itemWidth / 2 - containerWidth / 2;
    const maxOffset = weeks.length * (itemWidth + spacing) - containerWidth;
    return Math.max(0, Math.min(centerOffset, maxOffset));
  };

  const onLayoutContainer = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  // 🔥 Auto-scroll to closest week on mount
  useEffect(() => {
    if (scrollViewRef.current && containerWidth > 0 && weeks.length > 0) {
      // 👉 Find closest week index (example: pick today's week)
      // For now, just use the given `selectedWeekIndex`
      const closestIndex = Math.min(
        Math.max(selectedWeekIndex, 0),
        weeks.length - 1
      );

      const targetX = indexToOffset(
        closestIndex,
        itemWidth,
        spacing,
        containerWidth
      );

      scrollViewRef.current.scrollTo({ x: targetX, animated: false });
    }
  }, [containerWidth, weeks]);

  return (
    <View
      style={{ flexDirection: "row", marginVertical: 8 }}
      onLayout={onLayoutContainer}
    >
      <ScrollView
        horizontal
        ref={scrollViewRef}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        {weeks.map((week, index) => {
          const isSelected = index === selectedWeekIndex;
          return (
            <TouchableOpacity
              key={week.label}
              onPress={() => onSelectWeek(index)}
              style={{
                marginRight: spacing,
                paddingVertical: 6,
                paddingHorizontal: 8,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={isSelected ? monthTextSelectedStyle : monthTextStyle}
              >
                {week.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
