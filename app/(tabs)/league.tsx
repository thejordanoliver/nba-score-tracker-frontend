import CalendarModal from "components/CalendarModal";
import DateNavigator from "components/DateNavigator";
import LeagueForum from "components/Forum/LeagueForum";
import GamesList from "components/Games/GamesList";
import NewsHighlightsList from "components/News/NewsHighlightsList";
import SeasonLeadersList from "components/SeasonLeadersList";
import { StandingsList } from "components/Standings/StandingsList";
import SummerGamesList from "components/summer-league/SummerGamesList";
import { useSeasonGames as useDBGames } from "hooks/useDBGames";
import { useSeasonGames as useLiveSeasonGames } from "hooks/useSeasonGames";
import { useSeasonLeaders } from "hooks/useSeasonLeaders";
import { useSummerLeagueGames } from "hooks/useSummerLeagueGames";
import { getScoresStyles } from "styles/leagueStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import PagerView from "react-native-pager-view";
import * as React from "react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { View, useColorScheme } from "react-native";
import { CustomHeaderTitle } from "../../components/CustomHeaderTitle";
import TabBar from "../../components/TabBar";
import { useHighlights } from "../../hooks/useHighlights";
import { useNews } from "../../hooks/useNews";

function StatsTabContent() {
  const { leaders, loading, error } = useSeasonLeaders({
    season: 2024,
    limit: 5,
    minGames: 10,
  });

  return (
    <SeasonLeadersList
      leadersByStat={leaders}
      loading={loading}
      error={error}
    />
  );
}

type TeamLike = {
  id: string;
  name: string;
  record?: string;
  logo?: any;
  fullName: string;
};

type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  thumbnail?: string;
  publishedAt?: string;
};

type HighlightItem = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
};

type CombinedItem =
  | (NewsItem & { itemType: "news" })
  | (HighlightItem & { itemType: "highlight" });

export default function ScoresScreen() {
  const currentYear = "2025";
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getScoresStyles(isDark);

  const tabs = ["scores", "news", "standings", "stats", "forum"] as const;
  type TabType = (typeof tabs)[number];

  const pagerRef = useRef<PagerView>(null);
  const [selectedTab, setSelectedTab] = useState<TabType>("scores");
  const [pageIndex, setPageIndex] = useState(0);

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [favorites, setFavorites] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const {
    games: liveGames,
    loading: liveLoading,
    refreshGames: refreshLiveGames,
  } = useLiveSeasonGames(currentYear);

  const {
    games: dbGames,
    loading: dbLoading,
    refreshGames: refreshDBGames,
  } = useDBGames(currentYear);

  const {
    games: summerGames,
    loading: summerLoading,
    refreshGames: refreshSummerGames,
  } = useSummerLeagueGames();

  const { news, loading: newsLoading, refreshNews } = useNews();
  const { highlights, loading: highlightsLoading } = useHighlights(
    "NBA highlights",
    50
  );

  // --- Load favorites from AsyncStorage ---
  useFocusEffect(
    useCallback(() => {
      const loadFavorites = async () => {
        try {
          const stored = await AsyncStorage.getItem("favorites");
          if (stored) setFavorites(JSON.parse(stored));
        } catch (error) {
          console.warn("Failed to load favorites:", error);
        }
      };
      loadFavorites();
    }, [])
  );

  // --- Header ---
  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle
          title="League"
          tabName="League"
          onCalendarPress={
            selectedTab === "scores"
              ? () => setShowCalendarModal(true)
              : undefined
          }
        />
      ),
    });
  }, [navigation, selectedTab]);

  const handleTabPress = (tab: TabType) => {
    const index = tabs.indexOf(tab);
    setSelectedTab(tab);
    setPageIndex(index);
    pagerRef.current?.setPage(index);
  };

  const handlePageSelected = (e: any) => {
    const index = e.nativeEvent.position;
    setPageIndex(index);
    setSelectedTab(tabs[index]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshLiveGames(),
        refreshDBGames(),
        refreshSummerGames(),
        refreshNews(),
      ]);
    } catch (error) {
      console.warn("Failed to refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const changeDateByDays = (days: number) => {
    setSelectedDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  const summerStart = new Date("2025-07-05");
  const summerEnd = new Date("2025-07-23");
  const isSummerLeague =
    selectedDate >= summerStart && selectedDate <= summerEnd;

  function hasIdAndName(team: any): team is TeamLike {
    return (
      team &&
      typeof team === "object" &&
      typeof team.id === "string" &&
      typeof team.name === "string"
    );
  }

  function normalizeTeam(team: any): TeamLike {
    if (hasIdAndName(team)) {
      return {
        id: team.id,
        name: team.name,
        record: team.record,
        logo: team.logo,
        fullName: team.fullName ?? team.name ?? "Unknown Team",
      };
    }
    const fallbackName = team?.name ?? "Unknown Team";
    return {
      id: fallbackName,
      name: fallbackName,
      record: undefined,
      logo: undefined,
      fullName: fallbackName,
    };
  }

  // --- Filter and normalize games ---
  const inProgressGames = liveGames.filter((g) => g.status === "In Progress");
  const dbOnlyGames = dbGames.filter(
    (g) => g.status === "Scheduled" || g.status === "Final"
  );
  const combinedSeasonGames = [...inProgressGames, ...dbOnlyGames];

  const filteredSeasonGames = combinedSeasonGames.filter((game) => {
    const gameDate = new Date(game.date);
    return (
      gameDate.getFullYear() === selectedDate.getFullYear() &&
      gameDate.getMonth() === selectedDate.getMonth() &&
      gameDate.getDate() === selectedDate.getDate()
    );
  });

  const filteredSummerGames = summerGames.filter((game) => {
    const gameDate = new Date(game.date);
    return (
      gameDate.getFullYear() === selectedDate.getFullYear() &&
      gameDate.getMonth() === selectedDate.getMonth() &&
      gameDate.getDate() === selectedDate.getDate()
    );
  });

  const normalizedSeasonGames = filteredSeasonGames.map((game) => ({
    ...game,
    period: game.period === undefined ? undefined : String(game.period),
    home: normalizeTeam(game.home),
    away: normalizeTeam(game.away),
  }));

  const normalizedSummerGames = filteredSummerGames.map((game) => ({
    ...game,
    period: game.period === undefined ? undefined : Number(game.period),
    home: normalizeTeam(game.home),
    away: normalizeTeam(game.away),
  }));

  // --- Combine news & highlights ---
  const combinedNewsAndHighlights: CombinedItem[] = React.useMemo(() => {
    const taggedNews: CombinedItem[] = news.map((item) => ({
      ...item,
      itemType: "news",
      publishedAt: item.publishedAt ?? item.date ?? new Date().toISOString(),
    }));
    const taggedHighlights: CombinedItem[] = highlights.map((item) => ({
      ...item,
      itemType: "highlight",
      publishedAt: item.publishedAt ?? new Date().toISOString(),
    }));
    const combined = [...taggedNews, ...taggedHighlights];
    combined.sort((a, b) => {
      const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bDate - aDate;
    });
    return combined;
  }, [news, highlights]);

  return (
    <>
      <View style={styles.container}>
        <TabBar
          tabs={tabs}
          selected={selectedTab}
          onTabPress={handleTabPress}
        />

        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={handlePageSelected}
        >
          {/* SCORES PAGE */}
          <View key="scores" style={styles.contentArea}>
            <DateNavigator
              selectedDate={selectedDate}
              onChangeDate={changeDateByDays}
              onOpenCalendar={() => setShowCalendarModal(true)}
              isDark={isDark}
            />
            {isSummerLeague ? (
              <SummerGamesList
                games={normalizedSummerGames}
                loading={summerLoading}
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            ) : (
              <GamesList
                games={normalizedSeasonGames}
                loading={liveLoading || dbLoading}
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            )}
          </View>

          {/* NEWS PAGE */}
          <View key="news" style={styles.contentArea}>
            <NewsHighlightsList
              items={combinedNewsAndHighlights}
              loading={newsLoading}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          </View>

          {/* STANDINGS PAGE */}
          <View key="standings" style={styles.contentArea}>
            <StandingsList />
          </View>

          {/* STATS PAGE */}
          <View key="stats" style={styles.contentArea}>
            <StatsTabContent />
          </View>

          {/* FORUM PAGE */}
          <View key="forum" style={styles.contentArea}>
            <LeagueForum />
          </View>
        </PagerView>
      </View>

      {/* CALENDAR MODAL */}
      <CalendarModal
        visible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onSelectDate={(dateString) => {
          const [year, month, day] = dateString.split("-").map(Number);
          setSelectedDate(new Date(year, month - 1, day));
          setShowCalendarModal(false);
        }}
        markedDates={{
          ...[...combinedSeasonGames, ...summerGames].reduce(
            (acc, game) => {
              const localDate = new Date(game.date);
              const localISODate = `${localDate.getFullYear()}-${String(
                localDate.getMonth() + 1
              ).padStart(2, "0")}-${String(localDate.getDate()).padStart(
                2,
                "0"
              )}`;
              acc[localISODate] = {
                marked: true,
                dotColor: isDark ? "#fff" : "#1d1d1d",
              };
              return acc;
            },
            {} as Record<string, { marked: boolean; dotColor: string }>
          ),
        }}
      />
    </>
  );
}
