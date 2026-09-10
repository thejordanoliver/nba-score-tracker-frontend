import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import type { ImageSourcePropType, ListRenderItem } from "react-native";
import { FlatList, Image, Pressable, Text, View } from "react-native";

import SearchBar from "@/components/Explore/SearchBar";
import { BROWSEABLE_LEAGUES, LEAGUE_CONFIG } from "@/constants/leagues";
import { CustomHeader } from "../../components/CustomHeader";
import { Colors, globalStyles } from "../../constants/styles";
import { usePreferences } from "../../contexts/PreferencesContext";
import { LeagueScreenStyles } from "../../styles/LeagueStyles/LeagueStyles";
import { LeagueType } from "../../types/types";

export default function LeagueScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = LeagueScreenStyles(isDark);
  const global = globalStyles(isDark);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const leagueLogos = useMemo<Record<LeagueType, ImageSourcePropType>>(() => {
    return Object.fromEntries(
      Object.entries(LEAGUE_CONFIG).map(([league, config]) => [
        league,
        isDark ? config.logoLight : config.logo,
      ]),
    ) as Record<LeagueType, ImageSourcePropType>;
  }, [isDark]);

  const handleSearchToggle = useCallback(() => {
    setIsSearchVisible((current) => {
      const next = !current;

      if (!next) {
        setSearchQuery("");
      }

      return next;
    });
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader tabName="Leagues" onSearchToggle={handleSearchToggle} />
      ),
    });
  }, [handleSearchToggle, navigation]);

  const filteredLeagues = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    if (!normalizedSearch) {
      return BROWSEABLE_LEAGUES;
    }

    return BROWSEABLE_LEAGUES.filter((league) => {
      const config = LEAGUE_CONFIG[league];

      const searchableText = [
        league,
        config.label,
        config.label.replace(/[^a-zA-Z0-9 ]/g, ""),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [searchQuery]);

  const goToLeague = useCallback(
    (league: LeagueType) => {
      const config = LEAGUE_CONFIG[league];

      router.push({
        pathname: config.route,
        params: {
          league,
          leagueLabel: config.label,
        },
      });
    },
    [router],
  );

  const renderLeague: ListRenderItem<LeagueType> = useCallback(
    ({ item: league, index }) => {
      const { label } = LEAGUE_CONFIG[league];
      const logo = leagueLogos[league];
      const isLastRow = index === filteredLeagues.length - 1;

      return (
        <View
          style={[
            styles.buttonContainer,
            isLastRow && { borderBottomWidth: 0 },
          ]}
        >
          <Pressable
            onPress={() => goToLeague(league)}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <View style={styles.buttonWrapper}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />

              <Text style={styles.buttonText}>{label}</Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? Colors.white : Colors.black}
            />
          </Pressable>
        </View>
      );
    },
    [filteredLeagues.length, goToLeague, isDark, leagueLogos, styles],
  );
  const renderEmptyResults = useCallback(
    () => (
      <View style={global.emptyContainer}>
        <Text style={global.emptySubText}>No leagues found.</Text>
      </View>
    ),
    [global],
  );

  return (
    <View style={styles.container}>
      <View style={styles.searcBarContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          visible={isSearchVisible}
          onFocus={() => {}}
          onBlur={() => {}}
          placeholder="Search leagues..."
        />
      </View>

      <FlatList
        data={filteredLeagues}
        keyExtractor={(league) => league}
        renderItem={renderLeague}
        ListEmptyComponent={renderEmptyResults}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}
