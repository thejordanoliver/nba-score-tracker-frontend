import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import GamesList from "components/Games/GamesList";
import HeadingTwo from "components/Headings/HeadingTwo";
import NewsHighlightsList from "components/News/NewsHighlightsList";
import SummerGamesList from "components/summer-league/SummerGamesList";
import { useRouter } from "expo-router";
import { useSummerLeagueGames } from "hooks/useSummerLeagueGames";
import * as React from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Animated, Text, View, useColorScheme } from "react-native";
import { getStyles } from "styles/indexStyles";
import { Game, summerGame } from "types/types";
import { CustomHeaderTitle } from "../../components/CustomHeaderTitle";
import FavoritesScroll from "../../components/FavoritesScroll";
import FavoritesScrollSkeleton from "../../components/FavoritesScrollSkeleton";
import TabBar from "../../components/TabBar";
import { useNewsStore } from "../../hooks/newsStore";
import { useHighlights } from "../../hooks/useHighlights";
import { useNews } from "../../hooks/useNews";
import { useWeeklyGames } from "../../hooks/useWeeklyGames";

type Tab = "scores" | "news";

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

function mapSummerGameToGame(g: summerGame): Game {
  return {
    ...g,
    status:
      g.status.short === "FT"
        ? "Final"
        : g.status.short === "NS"
        ? "Scheduled"
        : "In Progress",
    period: g.period !== undefined ? String(g.period) : undefined,
  };
}

const isTodayOrTomorrow = (dateString: string) => {
  const gameDate = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );
  return (
    (gameDate >= today && gameDate < new Date(today.getTime() + 86400000)) ||
    (gameDate >= tomorrow && gameDate < new Date(tomorrow.getTime() + 86400000))
  );
};

export default function HomeScreen() {
  const {
    games: weeklyGames,
    loading: weeklyGamesLoading,
    refreshGames: refreshWeeklyGames,
  } = useWeeklyGames();

  const {
    games: summerGames,
    loading: summerLoading,
    refreshGames: refreshSummerGames,
  } = useSummerLeagueGames() as {
    games: summerGame[];
    loading: boolean;
    refreshGames: () => Promise<void>;
  };

  const {
    news,
    loading: newsLoading,
    error: newsError,
    refreshNews,
  } = useNews();

  const {
    highlights,
    loading: highlightsLoading,
    error: highlightsError,
  } = useHighlights("NBA highlights", 50);

  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const setArticles = useNewsStore((state) => state.setArticles);

  const tabs: Tab[] = ["scores", "news"];
  const [selectedTab, setSelectedTab] = useState<Tab>("scores");
  const underlineX = useRef(new Animated.Value(0)).current;
  const underlineWidth = useRef(new Animated.Value(0)).current;
  const tabMeasurements = useRef<{ x: number; width: number }[]>([]);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (news && news.length > 0) {
      setArticles(news);
    }
  }, [news, setArticles]);

  useFocusEffect(
    useCallback(() => {
      const loadFavorites = async () => {
        try {
          const stored = await AsyncStorage.getItem("favorites");
          if (stored) {
            setFavorites(JSON.parse(stored));
          }
        } catch (error) {
          console.warn("Failed to load favorites:", error);
        }
      };
      loadFavorites();
    }, [])
  );

  useEffect(() => {
    useNewsStore.getState().loadCachedArticles();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle title="Home" tabName="Home" isTeamScreen={false} />
      ),
    });
  }, [navigation, isDark]);

  const handleTabPress = (tab: Tab) => {
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (selectedTab === "scores") {
        await Promise.all([refreshWeeklyGames?.(), refreshSummerGames?.()]);
      } else if (selectedTab === "news") {
        await refreshNews?.();
      }
    } catch (err) {
      console.warn("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const styles = getStyles(isDark);

  const filteredWeekly = weeklyGames.filter((g) => isTodayOrTomorrow(g.date));
  const filteredSummer: summerGame[] = summerGames.filter((g) =>
    isTodayOrTomorrow(g.date)
  );

  const onlySummerLeagueToday =
    filteredWeekly.length === 0 && filteredSummer.length > 0;

  const combinedGames = [...filteredWeekly];
  filteredSummer.forEach((g) => {
    if (!combinedGames.some((cg) => cg.id === g.id)) {
      combinedGames.push(mapSummerGameToGame(g));
    }
  });

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
    <View style={styles.container}>
      <View style={styles.tabBarWrapper}>
        <TabBar
          tabs={tabs}
          selected={selectedTab}
          onTabPress={handleTabPress}
          renderLabel={(tab, isSelected) => (
            <Text
              style={{
                fontSize: 20,
                color: isSelected
                  ? isDark
                    ? "#fff"
                    : "#1d1d1d"
                  : isDark
                  ? "#888"
                  : "rgba(0, 0, 0, 0.5)",
                fontFamily: "Oswald_400Regular",
              }}
            >
              {tab.toUpperCase()}
            </Text>
          )}
        />
      </View>


      {selectedTab !== "news" &&
        ((weeklyGamesLoading || summerLoading) && !favorites.length ? (
          <FavoritesScrollSkeleton />
        ) : (
          <FavoritesScroll favoriteTeamIds={favorites} />
        ))}
      <View style={styles.contentArea}>
        {selectedTab === "scores" ? (
          <>
            <HeadingTwo style={{ marginHorizontal: 12 }}>
              Latest Games
            </HeadingTwo>

            {onlySummerLeagueToday ? (
              <SummerGamesList
                games={filteredSummer}
                loading={summerLoading}
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            ) : (
              <GamesList
                games={combinedGames}
                loading={weeklyGamesLoading || summerLoading}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                day={"todayTomorrow"}
              />
            )}
          </>
        ) : (
          <>
            {newsError ? (
              <Text style={styles.emptyText}>{newsError}</Text>
            ) : combinedNewsAndHighlights.length === 0 && !refreshing ? (
              <Text style={styles.emptyText}>
                No news or highlights available.
              </Text>
            ) : (
              <NewsHighlightsList
                items={combinedNewsAndHighlights}
                loading={newsLoading}
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}
