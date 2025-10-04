import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import LeagueForum from "components/Forum/LeagueForum";
import NewsHighlightsList from "components/News/NewsHighlightsList";
import NFLGamesList from "components/NFL/Games/NFLGamesList";
import { NFLStandingsList } from "components/NFL/Standings/NFLStandingsList";
import WeekSelector from "components/NFL/WeekSelector";
import SeasonLeadersList from "components/League/SeasonLeadersList";
import SportsListModal, {
  SportsListModalRef,
} from "components/League/SportsListModal";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useRouter } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useNFLGamesByWeek } from "hooks/NFLHooks/useNFLGamesByWeek";
import { useSeasonLeaders } from "hooks/useSeasonLeaders";
import * as React from "react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, useColorScheme, View } from "react-native";
import { getScoresStyles } from "styles/leagueStyles";
import { generateNFLWeeks, getCurrentWeekIndex, NFLWeek } from "utils/nflWeeks";
import { CustomHeaderTitle } from "../../components/CustomHeaderTitle";
import TabBar from "../../components/TabBar";
import { useHighlights } from "../../hooks/useHighlights";
import { useNews } from "../../hooks/useNews";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

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

export default function NFLLeagueScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getScoresStyles(isDark);

  const sportsModalRef = useRef<SportsListModalRef>(null);
  const [leagueModalVisible, setLeagueModalVisible] = useState(false);

  const [selectedTab, setSelectedTab] = useState<
    "scores" | "news" | "standings" | "stats" | "forum"
  >("scores");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = ["scores", "news", "standings", "stats", "forum"] as const;

  // --- Fetch News & Highlights ---
  const { news, loading: newsLoading, refreshNews } = useNews();
  const { highlights } = useHighlights("NFL Highlights", 50);

  // --- Week handling ---
  const weeks: NFLWeek[] = React.useMemo(() => generateNFLWeeks(), []);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(
    getCurrentWeekIndex(weeks)
  );

  const selectedWeek = weeks[selectedWeekIndex];
  // --- Fetch games using the updated hook ---
  const {
    games: nflGames,
    loading: nflLoading,
    refresh: refreshNFLGames,
  } = useNFLGamesByWeek({
    week: selectedWeek,
  });

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
          league="NFL"
          modalVisible={leagueModalVisible} // now updates
          setModalVisible={setLeagueModalVisible}
          onOpenLeagueModal={() => sportsModalRef.current?.present()}
          onBack={goBack}
        />
      ),
    });
  }, [navigation, leagueModalVisible]);

  // --- Refresh handler ---
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshNews(), refreshNFLGames()]);
    } catch (error) {
      console.warn("Failed to refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // --- Combine news + highlights ---
  const combinedNewsAndHighlights: CombinedItem[] = React.useMemo(() => {
    const taggedNews: CombinedItem[] = news.map((item) => ({
      ...item,
      itemType: "news",
      // ensure publishedAt is always defined
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
        new Date(a.publishedAt || new Date().toISOString()).getTime() -
        new Date(b.publishedAt || new Date().toISOString()).getTime()
    );
    return combined;
  }, [news, highlights]);

  return (
    <>
      <View style={styles.container}>
        <TabBar
          tabs={tabs}
          selected={selectedTab}
          onTabPress={setSelectedTab}
        />

        <View style={styles.contentArea}>
          {selectedTab === "scores" && (
            <>
              <WeekSelector
                weeks={weeks}
                selectedWeekIndex={selectedWeekIndex}
                onSelectWeek={setSelectedWeekIndex}
                monthTextStyle={styles.monthText}
                monthTextSelectedStyle={styles.monthTextSelected}
              />

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                  />
                }
              >
                <NFLGamesList
                  games={nflGames}
                  loading={nflLoading}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  scrollEnabled={false}
                />
              </ScrollView>
            </>
          )}

          {selectedTab === "news" && (
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
              <NewsHighlightsList
                items={combinedNewsAndHighlights}
                loading={newsLoading}
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            </ScrollView>
          )}

          {selectedTab === "standings" && <NFLStandingsList />}
          {selectedTab === "stats" && <StatsTabContent />}
          {selectedTab === "forum" && <LeagueForum league="NFL" />}
        </View>
      </View>

      <SportsListModal
        ref={sportsModalRef}
        onSelect={() => {}}
        onClose={() => setLeagueModalVisible(false)}
      />
    </>
  );
}
