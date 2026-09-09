import { snapPoints } from "@/utils/modalUtils";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { LEAGUE_CONFIG } from "constants/leagues";
import { Colors, Fonts, activeOpacity } from "constants/styles";
import { Image } from "expo-image";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  EXPLORE_STANDINGS_LEAGUES,
  type ExploreStandingsLeague,
} from "types/widgets";

type StandingsLeagueModalProps = {
  visible: boolean;
  isDark: boolean;
  selectedLeague: ExploreStandingsLeague;
  onClose: () => void;
  onSelect: (league: ExploreStandingsLeague) => void;
};



export default function StandingsLeagueModal({
  visible,
  isDark,
  selectedLeague,
  onClose,
  onSelect,
}: StandingsLeagueModalProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const hasPresentedRef = useRef(false);
  const { top, bottom } = useSafeAreaInsets();
  const styles = useMemo(() => standingsLeagueModalStyles(isDark), [isDark]);

  useEffect(() => {
    if (!visible) {
      if (hasPresentedRef.current) sheetRef.current?.dismiss();
      return;
    }

    if (hasPresentedRef.current) return;

    const frame = requestAnimationFrame(() => {
      hasPresentedRef.current = true;
      sheetRef.current?.present();
    });

    return () => cancelAnimationFrame(frame);
  }, [visible]);

  const handleDismiss = useCallback(() => {
    hasPresentedRef.current = false;
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={isDark ? 0.58 : 0.34}
        pressBehavior="close"
      />
    ),
    [isDark],
  );

  const handleSelect = useCallback(
    (league: ExploreStandingsLeague) => {
      onSelect(league);
      sheetRef.current?.dismiss();
    },
    [onSelect],
  );

  const renderLeague = useCallback(
    ({ item: league }: { item: ExploreStandingsLeague }) => {
      const config = LEAGUE_CONFIG[league];
      const selected = league === selectedLeague;

      return (
        <Pressable
          onPress={() => handleSelect(league)}
          style={({ pressed }) => [
            styles.option,
            selected && styles.optionSelected,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Show ${config.label} standings`}
          accessibilityState={{ selected }}
        >
          <Image
            source={isDark ? config.logoLight : config.logo}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.optionText}>{config.label}</Text>
          <Ionicons
            name={selected ? "checkmark-circle" : "chevron-forward"}
            size={selected ? 22 : 18}
            color={
              selected
                ? isDark
                  ? Colors.white
                  : Colors.black
                : Colors.midTone
            }
          />
        </Pressable>
      );
    },
    [handleSelect, isDark, selectedLeague, styles],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={[snapPoints[0]]}
      stackBehavior="push"
      topInset={top}
      enableDynamicSizing={false}
      enablePanDownToClose
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      handleStyle={styles.handle}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Standings league</Text>
            <Text style={styles.subtitle}>
              Choose which league this widget should follow.
            </Text>
          </View>
          <Pressable
            onPress={() => sheetRef.current?.dismiss()}
            hitSlop={8}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Close standings league picker"
          >
            <Ionicons
              name="close"
              size={22}
              color={isDark ? Colors.white : Colors.black}
            />
          </Pressable>
        </View>

        <BottomSheetFlatList<ExploreStandingsLeague>
          data={EXPLORE_STANDINGS_LEAGUES}
          keyExtractor={(league) => league}
          renderItem={renderLeague}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottom + 24 }}
        />
      </View>
    </BottomSheetModal>
  );
}

const standingsLeagueModalStyles = (isDark: boolean) =>
  StyleSheet.create({
    background: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },
    handle: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },
    handleIndicator: {
      width: 38,
      backgroundColor: Colors.midTone,
    },
    container: {
      flex: 1,
      paddingHorizontal: 16,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingTop: 4,
      paddingBottom: 14,
    },
    headerCopy: {
      flex: 1,
    },
    title: {
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 22,
      color: isDark ? Colors.white : Colors.black,
    },
    subtitle: {
      paddingTop: 2,
      fontFamily: Fonts.REGULAR,
      fontSize: 13,
      lineHeight: 18,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
    closeButton: {
      alignItems: "center",
      justifyContent: "center",
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 58,
      paddingHorizontal: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    optionSelected: {
      borderBottomColor: isDark ? Colors.white : Colors.black,
    },
    optionText: {
      flex: 1,
      fontFamily: Fonts.MEDIUM,
      fontSize: 16,
      color: isDark ? Colors.white : Colors.black,
    },
    logo: {
      width: 34,
      height: 34,
    },
    pressed: {
      opacity: activeOpacity,
    },
  });
