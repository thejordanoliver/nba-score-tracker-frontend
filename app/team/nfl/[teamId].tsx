import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import NFLGamesList from "components/NFL/Games/NFLGamesList";
import NFLRoster from "components/NFL/Team/Roster";
import { teams } from "constants/teamsNFL";
import { useLocalSearchParams } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useNFLTeamGames } from "hooks/NFLHooks/useNFLTeamGames";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Text, View, useColorScheme } from "react-native";
import PagerView from "react-native-pager-view";
import { Game } from "types/nfl";
import { User } from "types/types";
import { CustomHeaderTitle } from "../../../components/CustomHeaderTitle";
import TabBar from "../../../components/TabBar";
import { style } from "../../../styles/TeamDetails.styles";
export default function TeamDetailScreen() {
  const navigation = useNavigation();
  const { teamId } = useLocalSearchParams();
  const teamIdNum = teamId ? parseInt(teamId as string, 10) : null;

  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = style(isDark);

  const tabs = ["schedule", "news", "roster", "forum", "stats"] as const;
  const [selectedTab, setSelectedTab] =
    useState<(typeof tabs)[number]>("schedule");
  const rosterRef = useRef<{ refresh: () => void }>(null);

  const pagerRef = useRef<PagerView>(null);

  const tabToIndex = (tab: (typeof tabs)[number]) => tabs.indexOf(tab);
  const indexToTab = (index: number) => tabs[index];

  const team = useMemo(
    () => (teamIdNum ? teams.find((t) => Number(t.id) === teamIdNum) : null),
    [teamIdNum]
  );

  // ✅ call hook directly
  const {
    games: rawTeamGames = [],
    loading: gamesLoading,
    error: gamesError,
    refreshGames: refreshTeamGames,
  } = useNFLTeamGames(teamIdNum ? teamIdNum.toString() : "");

  // --- Memoize valid games ---
  const teamGames = useMemo(
    () => rawTeamGames.filter((g: Game) => g?.game?.date?.date),
    [rawTeamGames]
  );

  // --- Memoize flattened grouping ---
  const flattenedGames = useMemo(() => {
    const grouped: { [stage: string]: Game[] } = {};
    teamGames.forEach((g) => {
      const stage = g.game.stage || "Unknown";
      if (!grouped[stage]) grouped[stage] = [];
      grouped[stage].push(g);
    });

    const flat: any[] = [];
    Object.keys(grouped).forEach((stage) => {
      flat.push({ type: "header", title: stage });
      grouped[stage].forEach((game) => flat.push({ type: "game", game }));
    });

    return flat;
  }, [teamGames]);

  // inside TeamDetailScreen

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (selectedTab === "schedule") {
        await refreshTeamGames?.();
      } else if (selectedTab === "roster") {
        // ✅ trigger roster refresh
        rosterRef.current?.refresh();
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const jsonUser = await AsyncStorage.getItem("loggedInUser");
        if (jsonUser) setLoggedInUser(JSON.parse(jsonUser));
      } catch (e) {
        console.error("Failed to load user:", e);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const checkFavorites = async () => {
      if (!teamIdNum) return;
      const stored = await AsyncStorage.getItem("favorites");
      if (stored) {
        const favorites = JSON.parse(stored);
        setIsFavorite(favorites.includes(teamIdNum.toString()));
      }
    };
    checkFavorites();
  }, [teamIdNum]);

  const toggleFavorite = async () => {
    if (!teamIdNum) return;
    try {
      const stored = await AsyncStorage.getItem("favorites");
      const favorites: string[] = stored ? JSON.parse(stored) : [];
      const updatedFavorites = favorites.includes(teamIdNum.toString())
        ? favorites.filter((id) => id !== teamIdNum.toString())
        : [...favorites, teamIdNum.toString()];
      await AsyncStorage.setItem("favorites", JSON.stringify(updatedFavorites));
      setIsFavorite(updatedFavorites.includes(teamIdNum.toString()));
    } catch (err) {
      console.error("Failed to update favorites:", err);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () =>
        team && (
          <CustomHeaderTitle
            logo={team.logo}
            logoLight={team.logoLight}
            teamColor={team.color}
            onBack={goBack}
            isTeamScreen
            teamCode={team.code}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            league="NFL"
          />
        ),
    });
  }, [navigation, isDark, team, isFavorite]);

  if (!teamIdNum || !team) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TabBar
        tabs={tabs}
        selected={selectedTab}
        onTabPress={(tab) => {
          setSelectedTab(tab);
          pagerRef.current?.setPage(tabToIndex(tab));
        }}
      />

      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={tabToIndex(selectedTab)}
        onPageSelected={(e) => {
          const index = e.nativeEvent.position;
          setSelectedTab(indexToTab(index));
        }}
      >
        {/* Schedule Page */}
        <View key="schedule" style={{ flex: 1 }}>
          <NFLGamesList
            games={rawTeamGames}
            loading={gamesLoading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            showHeaders={true}
          />
        </View>

        {/* News Page */}
        <View
          key="news"
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: isDark ? "#fff" : "#000" }}>
            Team News (TODO)
          </Text>
        </View>

        {/* Roster Page */}
        <View key="roster" style={{ flex: 1 }}>
          <NFLRoster
            ref={rosterRef}
            teamId={String(team.id)}
            teamName={team.name}
            refreshing={refreshing}
          />
        </View>

        {/* Forum Page */}
        <View
          key="forum"
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: isDark ? "#fff" : "#000" }}>Forum (TODO)</Text>
        </View>

        {/* Stats Page */}
        <View
          key="stats"
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: isDark ? "#fff" : "#000" }}>Stats (TODO)</Text>
        </View>
      </PagerView>
    </View>
  );
}
