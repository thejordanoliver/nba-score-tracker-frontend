// components/Skeletons/DivisionFilterSkeletontsx.tsx

import { usePreferences } from "@/contexts/PreferencesContext";
import { Colors } from "constants/styles";

import { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";

const ITEM_HEIGHT = 32;
const SIDE_PADDING = 12;
const ITEM_SPACING = 0;

type Props = {
  itemCount?: number;
  itemWidth?: number;
};

export default function DivisionFilterSkeleton({
  itemCount = 3,
  itemWidth = 100,
}: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Mirror the real component: selected index is the 3rd item (index 2),
  // a reasonable mid-list default so the skeleton looks "in progress"
  const selectedSkeletonIndex = Math.min(0, itemCount - 1);

  const itemStep = itemWidth + ITEM_SPACING;

  const styles = getStyles({ isDark, itemWidth });

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemStep}
        decelerationRate="fast"
        contentContainerStyle={styles.contentContainerStyle}
      >
        {/*
         * Mirrors WeekSelector's sliding indicator: an absolute-positioned
         * rect that sits behind the labels at the selected item's offset.
         */}
        <View
          pointerEvents="none"
          style={[
            styles.slidingSelectedContainer,
            { left: SIDE_PADDING + selectedSkeletonIndex * itemStep },
          ]}
        />

        {Array.from({ length: itemCount }).map((_, index) => {
          const isSelected = index === selectedSkeletonIndex;
          return (
            <View key={index} style={styles.label}>
              <Animated.View
                style={[
                  styles.innerBar,
                  {
                    opacity: pulseAnim,
                    // Selected pill uses a slightly wider bar to mimic
                    // the bolder/heavier text of the real selected label
                    width: isSelected ? "72%" : "60%",
                  },
                ]}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

type StyleParams = {
  isDark: boolean;
  itemWidth: number;
};

const getStyles = ({ isDark, itemWidth }: StyleParams) =>
  StyleSheet.create({
    wrapper: {
      // Matches WeekSelector's wrapper exactly
      marginVertical: 8,
    },
    contentContainerStyle: {
      // Matches WeekSelector's contentContainerStyle exactly
      position: "relative",
      paddingHorizontal: SIDE_PADDING,
      alignItems: "center",
    },
    slidingSelectedContainer: {
      // Mirrors WeekSelector's slidingSelectedContainer 1-to-1
      position: "absolute",
      top: 0,
      width: itemWidth,
      height: ITEM_HEIGHT,
      borderRadius: 12,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.white : Colors.black,
    },
    label: {
      // Mirrors WeekSelector's label style exactly
      width: itemWidth,
      height: ITEM_HEIGHT,
      justifyContent: "center",
      alignItems: "center",
      padding: 4,
      borderRadius: 12,
      zIndex: 2,
    },
    innerBar: {
      // Placeholder for the text — matches the visual weight of the real labels
      height: 13,
      borderRadius: 7,
      backgroundColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
  });
