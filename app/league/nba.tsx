import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import CalendarModal from "components/CalendarModal";
import DateNavigator from "components/DateNavigator";
import LeagueForum from "components/Forum/LeagueForum";
import NewsHighlightsList from "components/News/NewsHighlightsList";
import SeasonLeadersList from "components/League/SeasonLeadersList";
import SportsListModal, {
  SportsListModalRef,
} from "components/League/SportsListModal";
import { StandingsList } from "components/Standings/StandingsList";
import SummerGamesList from "components/summer-league/SummerGamesList";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useRouter } from "expo-router";
import { useSeasonGames as useDBGames } from "hooks/useDBGames";
import { useSeasonGames as useLiveSeasonGames } from "hooks/useSeasonGames";
import { useSeasonLeaders } from "hooks/useSeasonLeaders";
import { useSummerLeagueGames } from "hooks/useSummerLeagueGames";
import * as React from "react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  View,
  useColorScheme,
} from "react-native";
import { getScoresStyles } from "styles/leagueStyles";
import { CustomHeaderTitle } from "../../components/CustomHeaderTitle";
import TabBar from "../../components/TabBar";
import { useHighlights } from "../../hooks/useHighlights";
import { useNews } from "../../hooks/useNews";

import GamesList from "components/Games/GamesList";
import { goBack } from "expo-router/build/global-state/routing";
dayjs.extend(utc);
dayjs.extend(timezone);

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

export default function NBALeagueScreen() {
  const currentYear = "2025";

  // --- Fetch games ---
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
  const sportsModalRef = useRef<SportsListModalRef>(null);
  const [leagueModalVisible, setLeagueModalVisible] = useState(false);

  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getScoresStyles(isDark);

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedLeague, setSelectedLeague] = useState<"NBA" | "NFL">("NBA");

  const tabs = ["scores", "news", "standings", "stats", "forum",] as const;
  type TabType = (typeof tabs)[number];
  const [selectedTab, setSelectedTab] = useState<TabType>("scores");

  const underlineX = useRef(new Animated.Value(0)).current;
  const underlineWidth = useRef(new Animated.Value(0)).current;
  const tabMeasurements = useRef<{ x: number; width: number }[]>([]);
  const router = useRouter();

  const [favorites, setFavorites] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // --- Load favorites ---
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
        tabName="League"
        league="NBA"
        modalVisible={leagueModalVisible} // now updates
        setModalVisible={setLeagueModalVisible}
        onOpenLeagueModal={() => sportsModalRef.current?.present()}
        onBack={goBack}
      />
    ),
  });
}, [navigation, leagueModalVisible]);

  // --- Tab handling ---
  const handleTabPress = (tab: TabType) => {
    setSelectedTab(tab);
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

  // --- Helpers ---
  const localDateOnly = (date: string | Date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const filterByDate = (games: any[], date: Date) =>
    games.filter((game) =>
      dayjs(game.date).isSame(dayjs(date).startOf("day"), "day")
    );

  const hasIdAndName = (team: any): team is TeamLike =>
    team && typeof team.id === "string" && typeof team.name === "string";

  const normalizeTeam = (team: any): TeamLike => {
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
    return { id: fallbackName, name: fallbackName, fullName: fallbackName };
  };

  // --- Combine NBA games ---
  const inProgressGames = liveGames.filter((g) => g.status === "In Progress");
  const dbOnlyGames = dbGames.filter(
    (g) => g.status === "Scheduled" || g.status === "Final"
  );
  const combinedSeasonGames = [...inProgressGames, ...dbOnlyGames];

  const filteredSeasonGames = filterByDate(combinedSeasonGames, selectedDate);
  const filteredSummerGames = filterByDate(summerGames, selectedDate);

  // --- Normalize NBA / Summer ---
  const normalizedSeasonGames = filteredSeasonGames.map((game) => ({
    ...game,
    period: game.period === undefined ? undefined : String(game.period),
    home: normalizeTeam(game.home),
    away: normalizeTeam(game.away),
  }));

  const normalizedSummerGames = filteredSummerGames.map((game) => ({
    ...game,
    period: game.period === undefined ? undefined : String(game.period),
    home: normalizeTeam(game.home),
    away: normalizeTeam(game.away),
  }));

  // --- Refresh handler ---
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

  // --- Combine news + highlights ---
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
    combined.sort(
      (a, b) =>
        new Date(b.publishedAt ?? 0).getTime() -
        new Date(a.publishedAt ?? 0).getTime()
    );
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

        <View style={styles.contentArea}>
          {selectedTab === "scores" && (
            <>
              <DateNavigator
                selectedDate={selectedDate}
                onChangeDate={changeDateByDays}
                onOpenCalendar={() => setShowCalendarModal(true)}
                isDark={isDark}
              />

              <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                  />
                }
              >
                {normalizedSeasonGames.length > 0 ? (
                  <GamesList
                    games={normalizedSeasonGames}
                    loading={liveLoading || dbLoading}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    scrollEnabled={false}
                  />
                ) : (
                  <SummerGamesList
                    games={normalizedSummerGames}
                    loading={summerLoading}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    scrollEnabled={false}
                  />
                )}
              </ScrollView>
            </>
          )}

          {selectedTab === "news" && (
            <ScrollView
              contentContainerStyle={{ paddingBottom: 100 }} // optional bottom padding
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              }
            >
              <NewsHighlightsList
                items={combinedNewsAndHighlights}
                loading={newsLoading}
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            </ScrollView>
          )}
          {selectedTab === "standings" && <StandingsList />}
          {selectedTab === "stats" && <StatsTabContent />}
          {selectedTab === "forum" && <LeagueForum league="NBA" />}
        </View>
      </View>

      <CalendarModal
        visible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onSelectDate={(dateString) => {
          const [year, month, day] = dateString.split("-").map(Number);
          setSelectedDate(new Date(year, month - 1, day));
          setShowCalendarModal(false);
        }}
        markedDates={{
          ...[...combinedSeasonGames, ...summerGames].reduce((acc, game) => {
            const localDate = localDateOnly(game.date);
            const iso = `${localDate.getFullYear()}-${String(
              localDate.getMonth() + 1
            ).padStart(2, "0")}-${String(localDate.getDate()).padStart(
              2,
              "0"
            )}`;
            acc[iso] = { marked: true, dotColor: isDark ? "#fff" : "#1d1d1d" };
            return acc;
          }, {} as Record<string, { marked: boolean; dotColor: string }>),
        }}
      />

    <SportsListModal
  ref={sportsModalRef}
  onSelect={() => {}}
  onClose={() => setLeagueModalVisible(false)}
/>
    </>
  );
}
