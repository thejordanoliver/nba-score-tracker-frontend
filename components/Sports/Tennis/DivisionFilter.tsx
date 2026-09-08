import DivisionFilterSkeleton from "@/components/Skeletons/DivisionFilterSkeleton";
import { activeOpacity, Colors, Fonts } from "@/constants/styles";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { TennisDivision } from "types/tennis/tennis";

const ITEM_WIDTH = 100;
const ITEM_SPACING = 8;
const ITEM_HEIGHT = 32;
const ITEM_STEP = ITEM_WIDTH + ITEM_SPACING;

type Props = {
  divisions: TennisDivision[];
  selected: string;
  onSelect: (division: string) => void;
  isDark: boolean;
  loading: boolean;
};

function DivisionFilter({
  divisions,
  selected,
  onSelect,
  isDark,
  loading,
}: Props) {
  const indicatorX = useRef(new Animated.Value(0)).current;
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const selectedIndex = useMemo(() => {
    if (!divisions.length) {
      return 0;
    }

    const index = divisions.findIndex((division) => division.slug === selected);

    return index >= 0 ? index : 0;
  }, [divisions, selected]);

  const handleSelectDivision = useCallback((slug: string) => {
    onSelectRef.current(slug);
  }, []);

  useEffect(() => {
    if (!divisions.length) {
      return;
    }

    const animation = Animated.spring(indicatorX, {
      toValue: selectedIndex * ITEM_STEP,
      useNativeDriver: true,
      tension: 90,
      friction: 12,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [divisions.length, indicatorX, selectedIndex]);

  const styles = useMemo(() => DivisionFilterStyles(isDark), [isDark]);

  if (loading && !divisions.length) {
    return <DivisionFilterSkeleton />;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.slidingSelectedContainer,
            {
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />

        {divisions.map((division, index) => {
          const isSelected = index === selectedIndex;

          return (
            <TouchableOpacity
              key={String(division.id)}
              activeOpacity={activeOpacity}
              onPress={() => handleSelectDivision(division.slug)}
              style={styles.label}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={
                  isSelected ? styles.divisionTextSelected : styles.divisionText
                }
              >
                {division.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function arePropsEqual(prev: Props, next: Props) {
  if (prev.selected !== next.selected) {
    return false;
  }

  if (prev.isDark !== next.isDark) {
    return false;
  }

  if (prev.divisions.length !== next.divisions.length) {
    return false;
  }

  for (let index = 0; index < prev.divisions.length; index++) {
    const prevDivision = prev.divisions[index];
    const nextDivision = next.divisions[index];

    if (
      prevDivision.id !== nextDivision.id ||
      prevDivision.slug !== nextDivision.slug ||
      prevDivision.name !== nextDivision.name
    ) {
      return false;
    }
  }

  return true;
}

export default memo(DivisionFilter, arePropsEqual);

const DivisionFilterStyles = (isDark: boolean) =>
  StyleSheet.create({
    wrapper: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 8,
    },

    container: {
      position: "relative",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      gap: ITEM_SPACING,
    },

    slidingSelectedContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      width: ITEM_WIDTH,
      height: ITEM_HEIGHT,
      borderWidth: 1,
      borderColor: isDark ? Colors.white : Colors.black,
      borderRadius: 12,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },

    label: {
      zIndex: 2,
      width: ITEM_WIDTH,
      height: ITEM_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
      borderRadius: 8,
    },

    divisionText: {
      width: "100%",
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textAlign: "center",
    },

    divisionTextSelected: {
      width: "100%",
      fontFamily: Fonts.MEDIUM,
      fontSize: 16,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
  });
