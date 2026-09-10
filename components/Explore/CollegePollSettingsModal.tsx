import { snapPoints } from "@/utils/modalUtils";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { LEAGUE_CONFIG } from "constants/leagues";
import { Colors, Fonts, activeOpacity } from "constants/styles";
import { Image } from "expo-image";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  EXPLORE_COLLEGE_POLL_LEAGUES,
  type ExploreCollegePollLeague,
  type ExploreCollegePollType,
} from "types/widgets";
import {
  getCollegePollOptions,
  normalizeCollegePollType,
} from "utils/collegePollWidget";

type CollegePollSettingsModalProps = {
  visible: boolean;
  isDark: boolean;
  selectedLeague: ExploreCollegePollLeague;
  selectedPollType: ExploreCollegePollType;
  onClose: () => void;
  onSelect: (
    league: ExploreCollegePollLeague,
    pollType: ExploreCollegePollType,
  ) => void;
};

const collegePollSnapPoints = [snapPoints[0]];

export default function CollegePollSettingsModal({
  visible,
  isDark,
  selectedLeague,
  selectedPollType,
  onClose,
  onSelect,
}: CollegePollSettingsModalProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const hasPresentedRef = useRef(false);
  const { top, bottom } = useSafeAreaInsets();
  const styles = useMemo(() => collegePollSettingsStyles(isDark), [isDark]);
  const pollOptions = getCollegePollOptions(selectedLeague);

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

  const handleLeagueSelect = useCallback(
    (league: ExploreCollegePollLeague) => {
      onSelect(league, normalizeCollegePollType(league, selectedPollType));
    },
    [onSelect, selectedPollType],
  );

  const handlePollSelect = useCallback(
    (pollType: ExploreCollegePollType) => {
      onSelect(selectedLeague, pollType);
      sheetRef.current?.dismiss();
    },
    [onSelect, selectedLeague],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={collegePollSnapPoints}
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
            <Text style={styles.title}>College poll</Text>
            <Text style={styles.subtitle}>
              Choose the sport and rankings shown in this widget.
            </Text>
          </View>
        </View>

        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottom + 24 }}
        >
          <Text style={styles.sectionLabel}>Sport</Text>
          <View style={styles.sportRow}>
            {EXPLORE_COLLEGE_POLL_LEAGUES.map((league) => {
              const config = LEAGUE_CONFIG[league];
              const selected = league === selectedLeague;

              return (
                <Pressable
                  key={league}
                  onPress={() => handleLeagueSelect(league)}
                  style={({ pressed }) => [
                    styles.sportOption,
                    selected && styles.optionSelected,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${config.label} polls`}
                  accessibilityState={{ selected }}
                >
                  <Image
                    source={isDark ? config.logoLight : config.logo}
                    style={styles.logo}
                    contentFit="contain"
                  />
                  <Text style={styles.sportText}>{league.toUpperCase()}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Ranking</Text>
          {pollOptions.map((option) => {
            const selected = option.value === selectedPollType;

            return (
              <Pressable
                key={option.value}
                onPress={() => handlePollSelect(option.value)}
                style={({ pressed }) => [
                  styles.pollOption,
                  selected && styles.pollOptionSelected,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Show ${option.label}`}
                accessibilityState={{ selected }}
              >
                <Text style={styles.pollText}>{option.label}</Text>
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
          })}
        </BottomSheetScrollView>
      </View>
    </BottomSheetModal>
  );
}

const collegePollSettingsStyles = (isDark: boolean) =>
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
      textAlign: "center",
      fontFamily: Fonts.BOLD,
      fontSize: 20,
      color: isDark ? Colors.white : Colors.black,
    },
    subtitle: {
      textAlign: "center",
      marginTop: 2,
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },

    sectionLabel: {
      paddingTop: 8,
      paddingBottom: 8,
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 13,
      color: Colors.midTone,
      textTransform: "uppercase",
      letterSpacing: 0.7,
    },
    sportRow: {
      flexDirection: "row",
      gap: 10,
      paddingBottom: 12,
    },
    sportOption: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 54,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 17,
    },
    optionSelected: {
      borderWidth: 1,
      borderColor: isDark ? Colors.white : Colors.black,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },
    logo: {
      width: 28,
      height: 28,
    },
    sportText: {
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 15,
      color: isDark ? Colors.white : Colors.black,
    },
    pollOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 52,
      paddingHorizontal: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    pollOptionSelected: {
      borderBottomColor: isDark ? Colors.white : Colors.black,
    },
    pollText: {
      flex: 1,
      fontFamily: Fonts.MEDIUM,
      fontSize: 16,
      color: isDark ? Colors.white : Colors.black,
    },
    pressed: {
      opacity: activeOpacity,
    },
  });
