import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { BROWSEABLE_LEAGUES, LEAGUE_CONFIG } from "constants/leagues";
import { Colors, Fonts } from "constants/styles";
import { useFavoriteTeamsContext } from "contexts/FavoriteTeamsContext";
import { Image } from "expo-image";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FAVORITE_LEAGUES } from "types/favorites";
import type { ForumPostDestination } from "types/forum";
import { normalizeForumPostLeague } from "utils/forumPostDestination";
import SearchBar from "../SearchBars/SearchBar";
import PillTabs from "../TabBars/PillTabs";
import { snapPoints } from "@/utils/modalUtils";

type DestinationMode = ForumPostDestination["kind"];

type DestinationOption = {
  key: string;
  destination: ForumPostDestination;
  label: string;
  meta: string;
  logo: ComponentProps<typeof Image>["source"];
  isFavorite: boolean;
};

type PostDestinationModalProps = {
  visible: boolean;
  isDark: boolean;
  currentDestination: ForumPostDestination | null;
  onClose: () => void;
  onSelect: (destination: ForumPostDestination) => void;
};

const teamDestinationLeagueSet = new Set<string>(FAVORITE_LEAGUES);

const isSelectedDestination = (
  current: ForumPostDestination | null,
  option: ForumPostDestination,
) => {
  if (!current || current.kind !== option.kind) return false;
  if (current.league !== option.league) return false;

  return (
    current.kind === "league" ||
    (option.kind === "team" && current.teamId === option.teamId)
  );
};

const DESTINATION_TABS: {
  label: string;
  value: DestinationMode;
}[] = [
  {
    label: "Leagues",
    value: "league",
  },
  {
    label: "Teams",
    value: "team",
  },
];

export default function PostDestinationModal({
  visible,
  isDark,
  currentDestination,
  onClose,
  onSelect,
}: PostDestinationModalProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const hasPresentedRef = useRef(false);
  const { top, bottom } = useSafeAreaInsets();
  const { favorites, allTeams } = useFavoriteTeamsContext();
  const [mode, setMode] = useState<DestinationMode>("league");
  const [query, setQuery] = useState("");
  const styles = useMemo(() => postDestinationStyles(isDark), [isDark]);

  const leagueOptions = useMemo<DestinationOption[]>(
    () =>
      BROWSEABLE_LEAGUES.map((league) => {
        const config = LEAGUE_CONFIG[league];

        return {
          key: `league:${league}`,
          destination: { kind: "league", league },
          label: config.label,
          meta: "League forum",
          logo: isDark ? config.logoLight : config.logo,
          isFavorite: false,
        };
      }),
    [isDark],
  );

  const teamOptions = useMemo<DestinationOption[]>(() => {
    const favoriteSet = new Set<string>(favorites);
    const seenKeys = new Set<string>();

    return allTeams
      .flatMap((team) => {
        const league = normalizeForumPostLeague(team.league);
        const teamId = team.id == null ? "" : String(team.id);

        if (
          !league ||
          !teamDestinationLeagueSet.has(league) ||
          !/^[1-9]\d*$/.test(teamId) ||
          team.isAllStar === true ||
          team.isNational === true ||
          team.isActive === false
        ) {
          return [];
        }

        const key = `team:${league}:${teamId}`;
        if (seenKeys.has(key)) return [];
        seenKeys.add(key);

        const isFavorite = favoriteSet.has(`${league}:${teamId}`);

        return [
          {
            key,
            destination: { kind: "team", league, teamId },
            label: team.fullName ?? team.name,
            meta: `${LEAGUE_CONFIG[league].label}${isFavorite ? " · Favorite" : ""}`,
            logo: isDark ? (team.logoLight ?? team.logo) : team.logo,
            isFavorite,
          } satisfies DestinationOption,
        ];
      })
      .sort(
        (first, second) =>
          Number(second.isFavorite) - Number(first.isFavorite) ||
          first.label.localeCompare(second.label),
      );
  }, [allTeams, favorites, isDark]);

  const options = useMemo(() => {
    const source = mode === "league" ? leagueOptions : teamOptions;
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return source;

    return source.filter((option) =>
      `${option.label} ${option.meta}`.toLowerCase().includes(normalizedQuery),
    );
  }, [leagueOptions, mode, query, teamOptions]);

  useEffect(() => {
    if (!visible) {
      if (hasPresentedRef.current) {
        sheetRef.current?.dismiss();
      }
      return;
    }

    if (hasPresentedRef.current) return;

    setMode(currentDestination?.kind ?? "league");
    setQuery("");

    const frame = requestAnimationFrame(() => {
      hasPresentedRef.current = true;
      sheetRef.current?.present();
    });

    return () => cancelAnimationFrame(frame);
  }, [currentDestination?.kind, visible]);

  const handleDismiss = useCallback(() => {
    hasPresentedRef.current = false;
    setQuery("");
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
    (destination: ForumPostDestination) => {
      Keyboard.dismiss();
      onSelect(destination);
      sheetRef.current?.dismiss();
    },
    [onSelect],
  );

  const renderOption = useCallback(
    ({ item }: { item: DestinationOption }) => {
      const selected = isSelectedDestination(
        currentDestination,
        item.destination,
      );

      return (
        <Pressable
          onPress={() => handleSelect(item.destination)}
          style={({ pressed }) => [
            styles.option,
            selected && styles.optionSelected,
            pressed && styles.optionPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Post to ${item.label}`}
          accessibilityState={{ selected }}
        >
          <Image source={item.logo} style={styles.logo} contentFit="contain" />

          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.optionMeta} numberOfLines={1}>
              {item.meta}
            </Text>
          </View>

          {selected ? (
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={isDark ? Colors.white : Colors.black}
            />
          ) : (
            <Ionicons name="chevron-forward" size={18} color={Colors.midTone} />
          )}
        </Pressable>
      );
    },
    [currentDestination, handleSelect, isDark, styles],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={1}
      snapPoints={snapPoints}
      stackBehavior="push"
      topInset={top}
      enableDynamicSizing={false}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      handleStyle={styles.handle}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Choose destination</Text>
            <Text style={styles.subtitle}>
              Select the team or league forum where this post should appear.
            </Text>
          </View>

          <Pressable
            onPress={() => sheetRef.current?.dismiss()}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.optionPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Close destination picker"
          >
            <Ionicons
              name="close"
              size={22}
              color={isDark ? Colors.white : Colors.black}
            />
          </Pressable>
        </View>
        <PillTabs
          tabs={DESTINATION_TABS}
          selectedValue={mode}
          onChange={(nextMode) => {
            setMode(nextMode);
            setQuery("");
          }}
        />

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={mode === "league" ? "Search leagues" : "Search teams"}
        />

        <BottomSheetFlatList<DestinationOption>
          data={options}
          keyExtractor={(item) => item.key}
          renderItem={renderOption}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottom + 24 },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No {mode === "league" ? "leagues" : "teams"} found.
              </Text>
            </View>
          }
        />
      </View>
    </BottomSheetModal>
  );
}

const postDestinationStyles = (isDark: boolean) =>
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
      gap: 12,
      paddingHorizontal: 16,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingTop: 4,
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
    modeSelector: {
      flexDirection: "row",
      gap: 4,
      padding: 4,
      borderRadius: 10,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },
    modeButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 36,
      borderRadius: 8,
    },
    modeButtonSelected: {
      backgroundColor: isDark ? Colors.white : Colors.black,
    },
    modeButtonText: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
    modeButtonTextSelected: {
      color: isDark ? Colors.black : Colors.white,
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 44,
      paddingHorizontal: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 10,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },
    searchInput: {
      flex: 1,
      minHeight: 42,
      paddingVertical: 0,
      fontFamily: Fonts.REGULAR,
      fontSize: 15,
      color: isDark ? Colors.white : Colors.black,
    },
    listContent: {
      gap: 8,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 62,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    optionSelected: {
      borderColor: isDark ? Colors.white : Colors.black,
    },
    optionPressed: {
      opacity: 0.72,
    },

    logo: {
      width: 42,
      height: 42,
    },
    optionCopy: {
      flex: 1,
      gap: 2,
    },
    optionTitle: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 15,
      color: isDark ? Colors.white : Colors.black,
    },
    optionMeta: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 32,
    },
    emptyText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
  });
