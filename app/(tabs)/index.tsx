import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import GamesList from "components/Games/GamesList";
import HeadingTwo from "components/Headings/HeadingTwo";
import NewsHighlightsList from "components/News/NewsHighlightsList";
import SummerGamesList from "components/summer-league/SummerGamesList";
import { useRouter } from "expo-router";
import { useCombinedGames } from "hooks/useCombinedGames";
import { useCombinedNewsAndHighlights } from "hooks/useCombinedNewsAndHighlights";
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
import { summerGame } from "types/types";
import { CustomHeaderTitle } from "../../components/CustomHeaderTitle";
import FavoritesScroll from "../../components/FavoritesScroll";
import FavoritesScrollSkeleton from "../../components/FavoritesScrollSkeleton";
import TabBar from "../../components/TabBar";
import { useNewsStore } from "../../hooks/newsStore";
import { useHighlights } from "../../hooks/useHighlights";
import { useNews } from "../../hooks/useNews";
import { useWeeklyGames } from "../../hooks/useWeeklyGames";

type Tab = "scores" | "news";

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

  // Save news articles in store
  useEffect(() => {
    if (news && news.length > 0) {
      setArticles(news);
    }
  }, [news, setArticles]);

  // Load cached favorites
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

  // Load cached news on mount
  useEffect(() => {
    useNewsStore.getState().loadCachedArticles();
  }, []);

  // Set header
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

  // 🔹 Use extracted hooks
  const { combinedGames, filteredSummer, onlySummerLeagueToday } =
    useCombinedGames(weeklyGames, summerGames);

  const combinedNewsAndHighlights = useCombinedNewsAndHighlights(
    news,
    highlights
  );

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
