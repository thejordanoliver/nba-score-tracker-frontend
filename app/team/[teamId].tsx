import AsyncStorage from "@react-native-async-storage/async-storage";
import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import TeamForum from "components/Forum/TeamForum";
import GamesList from "components/Games/GamesList";
import NewsHighlightsList from "components/News/NewsHighlightsList";
import TabBar from "components/TabBar";
import RosterStats from "components/Team/RosterStats";
import TeamInfoBottomSheet from "components/Team/TeamInfoModal";
import TeamPlayerList from "components/Team/TeamRoster";
import { Fonts } from "constants/fonts";
import { teams } from "constants/teams";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useNewsStore } from "hooks/newsStore";
import useDbPlayersByTeam from "hooks/useDbPlayersByTeam";
import { useTeamGames } from "hooks/useTeamGames";
import { useTeamHighlights } from "hooks/useTeamHighlights";
import { useTeamNews } from "hooks/useTeamNews";
import { useTeamRosterStats } from "hooks/useTeamRosterStats";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import PagerView from "react-native-pager-view";
import { style } from "styles/TeamDetails.styles";
import { User } from "types/types";

export default function TeamDetailScreen() {
  const navigation = useNavigation();
  const { teamId } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const teamIdNum = parseInt(teamId as string, 10);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false); // ✅ bottom sheet state
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = style(isDark);
  const tabs = ["schedule", "news", "roster", "stats", "forum"] as const;
  const [selectedTab, setSelectedTab] =
    useState<(typeof tabs)[number]>("schedule");
  const underlineX = useRef(new Animated.Value(0)).current;
  const underlineWidth = useRef(new Animated.Value(0)).current;
  const tabMeasurements = useRef<{ x: number; width: number }[]>([]);
  const pagerRef = useRef<PagerView>(null);

  // map tabs to page index
  const tabToIndex = (tab: (typeof tabs)[number]) => tabs.indexOf(tab);
  const indexToTab = (index: number) => tabs[index];

  const team = useMemo(
    () => teams.find((t) => t.id === teamIdNum.toString()),
    [teamIdNum]
  );

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      if (selectedTab === "schedule") {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      if (selectedTab === "news") {
        await refreshNews();
      }
      if (selectedTab === "roster") {
        await refreshPlayers();
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const {
    games: teamGames,
    loading: gamesLoading,
    error: gamesError,
  } = useTeamGames(teamIdNum.toString());

  const {
    highlights: teamHighlights,
    loading: highlightsLoading,
    error: highlightsError,
  } = useTeamHighlights(team?.fullName ?? "", 30);
  const {
    articles: newsArticles,
    loading: newsLoading,
    error: newsError,
    refreshNews,
  } = useTeamNews(team?.fullName ?? "");

  const combinedNewsItems = useMemo(() => {
    return newsArticles.map((article) => ({
      ...article,
      itemType: "news" as const,
    }));
  }, [newsArticles]);

  const combinedNewsAndHighlights = useMemo(() => {
    const taggedNews = newsArticles.map((item) => ({
      ...item,
      itemType: "news" as const,
      publishedAt: item.publishedAt ?? new Date().toISOString(),
    }));

    const taggedHighlights = teamHighlights.map((item) => ({
      ...item,
      itemType: "highlight" as const,
      publishedAt: item.publishedAt ?? new Date().toISOString(),
      duration: String(item.duration), // ✅ fix type mismatch
    }));

    const combined = [...taggedNews, ...taggedHighlights];

    combined.sort((a, b) => {
      const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bDate - aDate;
    });

    return combined;
  }, [newsArticles, teamHighlights]);

  const setArticles = useNewsStore((state) => state.setArticles);

  useEffect(() => {
    if (!newsLoading && newsArticles.length > 0) {
      setArticles(newsArticles);
    }
  }, [newsLoading, newsArticles, setArticles]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const jsonUser = await AsyncStorage.getItem("loggedInUser");
        if (jsonUser) {
          const userData = JSON.parse(jsonUser);
          setLoggedInUser(userData);
        }
      } catch (e) {
        console.error("Failed to load user:", e);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const checkFavorites = async () => {
      const stored = await AsyncStorage.getItem("favorites");
      if (stored) {
        const favorites = JSON.parse(stored);
        setIsFavorite(favorites.includes(teamIdNum.toString()));
      }
    };
    checkFavorites();
  }, [teamIdNum]);

  const {
    rosterStats,
    loading: rosterStatsLoading,
    error: rosterStatsError,
  } = useTeamRosterStats(teamIdNum);

  const toggleFavorite = async () => {
    try {
      const stored = await AsyncStorage.getItem("favorites");
      const favorites: string[] = stored ? JSON.parse(stored) : [];

      let updatedFavorites: string[];
      if (favorites.includes(teamIdNum.toString())) {
        updatedFavorites = favorites.filter(
          (id) => id !== teamIdNum.toString()
        );
      } else {
        updatedFavorites = [...favorites, teamIdNum.toString()];
      }

      await AsyncStorage.setItem("favorites", JSON.stringify(updatedFavorites));
      setIsFavorite(updatedFavorites.includes(teamIdNum.toString()));
    } catch (err) {
      console.error("Failed to update favorites:", err);
    }
  };

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const rawMonths = [
    { label: "Oct", month: 9, year: 2025 },
    { label: "Nov", month: 10, year: 2025 },
    { label: "Dec", month: 11, year: 2025 },
    { label: "Jan", month: 0, year: 2026 },
    { label: "Feb", month: 1, year: 2026 },
    { label: "Mar", month: 2, year: 2026 },
    { label: "Apr", month: 3, year: 2026 },
    { label: "May", month: 4, year: 2026 },
    { label: "Jun", month: 5, year: 2026 },
  ];

  const monthsToShow = rawMonths.filter(({ month, year }) => {
    return teamGames.some((game: any) => {
      const gameDate = new Date(game.date);
      return gameDate.getFullYear() === year && gameDate.getMonth() === month;
    });
  });

  useEffect(() => {
    if (!gamesLoading && teamGames.length > 0 && !selectedDate) {
      const today = new Date();

      // Find the closest month from monthsToShow
      const closestMonth = monthsToShow.reduce((closest, m) => {
        const monthDate = new Date(m.year, m.month, 1);
        const diff = Math.abs(monthDate.getTime() - today.getTime());
        const closestDiff = Math.abs(
          new Date(closest.year, closest.month, 1).getTime() - today.getTime()
        );
        return diff < closestDiff ? m : closest;
      }, monthsToShow[0]);

      setSelectedDate(new Date(closestMonth.year, closestMonth.month, 1));

      // Scroll to that month’s tab
      setTimeout(() => {
        const index = monthsToShow.findIndex(
          (m) => m.month === closestMonth.month && m.year === closestMonth.year
        );
        if (index >= 0 && scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            x: index * 70,
            animated: true,
          });
        }
      }, 150);
    }
  }, [gamesLoading, teamGames, selectedDate, monthsToShow]);

  const handleSelectMonth = (month: number, year: number, index: number) => {
    setSelectedDate(new Date(year, month, 1));

    if (scrollViewRef.current) {
      const screenWidth = Dimensions.get("window").width;
      const itemWidth = 70; // your month button width
      const spacing = 12; // your padding/margin
      const scrollToX =
        index * itemWidth + index * spacing - screenWidth / 2 + itemWidth / 2;

      scrollViewRef.current.scrollTo({
        x: Math.max(0, scrollToX),
        animated: true,
      });
    }
  };

  const {
    players,
    loading: playersLoading,
    error: playersError,
    refreshPlayers,
  } = useDbPlayersByTeam(teamIdNum.toString());

  const handleConfirmDate = (date: Date) => {
    setShowDatePicker(false);
    setSelectedDate(date);
  };

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  const filteredGames = useMemo(() => {
    if (!selectedDate) return [];
    return teamGames.filter((game: any) => {
      const gameDate = new Date(game.date);
      return (
        gameDate.getFullYear() === selectedDate.getFullYear() &&
        gameDate.getMonth() === selectedDate.getMonth()
      );
    });
  }, [selectedDate, teamGames]);

  const playersForRosterStats = players.map((p) => {
    const [first_name, ...rest] = p.name.split(" ");
    const last_name = rest.join(" ");
    return {
      player_id: p.id,
      first_name,
      last_name,
      jersey_number: p.jersey_number,
      headshot_url: p.avatarUrl ?? undefined,
    };
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle
          logo={team?.logo}
          logoLight={team?.logoLight}
          teamColor={team?.color}
          onBack={goBack}
          isTeamScreen={true}
          teamCode={team?.code}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          onOpenInfo={() => setModalVisible(true)}
        />
      ),
    });
  }, [navigation, isDark, team, isFavorite]);

  const handleTabPress = (tab: (typeof tabs)[number]) => {
    setSelectedTab(tab);
    pagerRef.current?.setPage(tabToIndex(tab));

    const index = tabs.indexOf(tab);
    if (tabMeasurements.current[index]) {
      Animated.parallel([
        Animated.timing(underlineX, {
          toValue: tabMeasurements.current[index].x,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(underlineWidth, {
          toValue: tabMeasurements.current[index].width,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  if (!team || selectedDate === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TabBar tabs={tabs} selected={selectedTab} onTabPress={handleTabPress} />
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
          <View style={styles.monthSelector}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={70}
              decelerationRate="fast"
              scrollEventThrottle={16}
              contentContainerStyle={{ paddingHorizontal: 12 }}
            >
              {monthsToShow.map(({ label, month, year }, index) => {
                const isSelected =
                  selectedDate.getMonth() === month &&
                  selectedDate.getFullYear() === year;

                return (
                  <TouchableOpacity
                    key={`${label}-${year}`}
                    onPress={() => handleSelectMonth(month, year, index)}
                    style={[
                      styles.monthButton,
                      { width: 70 },
                      isSelected && styles.monthButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.monthText,
                        isSelected && styles.monthTextSelected,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            date={selectedDate}
            onConfirm={handleConfirmDate}
            onCancel={handleCancelDate}
            maximumDate={new Date(2100, 11, 31)}
            minimumDate={new Date(2000, 0, 1)}
          />

          <GamesList
            games={filteredGames}
            loading={gamesLoading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            expectedCount={filteredGames.length}
          />
        </View>

        {/* News Page */}
        <View key="news" style={{ flex: 1 }}>
          <NewsHighlightsList
            items={combinedNewsAndHighlights}
            loading={newsLoading || highlightsLoading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        </View>

        {/* Roster Page */}
        <View key="roster" style={{ flex: 1 }}>
          {playersError ? (
            <Text
              style={{
                fontFamily: Fonts.OSLIGHT,
                fontSize: 16,
                textAlign: "center",
                marginTop: 20,
                color: isDark ? "#aaa" : "#888",
              }}
            >
              {playersError}
            </Text>
          ) : (
            <TeamPlayerList
              players={players}
              loading={playersLoading}
              error={playersError}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              teamFullName={team.fullName}
              teamColor={team.color}
              isDark={isDark}
            />
          )}
        </View>

        {/* Stats Page */}
        <View key="stats" style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={team.color}
              />
            }
          >
            <View>
              {rosterStatsLoading ? (
                <ActivityIndicator size="large" style={{ marginTop: 20 }} />
              ) : rosterStatsError ? (
                <Text
                  style={{
                    fontFamily: Fonts.OSLIGHT,
                    fontSize: 16,
                    textAlign: "center",
                    marginTop: 20,
                    color: isDark ? "#aaa" : "#888",
                  }}
                >
                  {rosterStatsError.message}
                </Text>
              ) : rosterStats.length === 0 ? (
                <Text
                  style={{
                    fontFamily: Fonts.OSLIGHT,
                    fontSize: 16,
                    textAlign: "center",
                    marginTop: 20,
                    color: isDark ? "#aaa" : "#888",
                  }}
                >
                  No player stats available.
                </Text>
              ) : (
                <RosterStats
                  rosterStats={rosterStats}
                  playersDb={playersForRosterStats}
                  teamId={teamId as string}
                />
              )}
            </View>
          </ScrollView>
        </View>

        {/* Forum Page */}
        <View key="forum" style={{ flex: 1 }}>
          <TeamForum teamId={teamId as string} />
        </View>
      </PagerView>
      {/* --- Bottom Sheet --- */}
      {team && (
        <TeamInfoBottomSheet
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          teamId={team.id}
          coachName={team.coach ?? "N/A"}
        />
      )}
    </View>
  );
}
