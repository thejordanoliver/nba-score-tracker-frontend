import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import CalendarModal from "components/CalendarModal";
import CombinedGamesList, {
  CombinedGamesSection,
} from "components/CombinedGamesList";
import DateNavigator from "components/DateNavigator";
import SportsListModal, {
  SportsListModalRef,
} from "components/League/SportsListModal";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useRouter } from "expo-router";
import { useNFLSeasonGames } from "hooks/NFLHooks/useNFLSeasonGames";
import { useSeasonGames as useDBGames } from "hooks/useDBGames";
import { useSeasonGames as useLiveSeasonGames } from "hooks/useSeasonGames";
import { useSummerLeagueGames } from "hooks/useSummerLeagueGames";
import * as React from "react";
import { useCallback, useLayoutEffect, useRef, useState, useEffect } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  View,
  useColorScheme,
} from "react-native";
import { getScoresStyles } from "styles/leagueStyles";
import { CustomHeaderTitle } from "../../components/CustomHeaderTitle";
import { useHighlights } from "../../hooks/useHighlights";
import { useNews } from "../../hooks/useNews";
import {
  normalizeTeam,
  localDateOnly,
  filterByDate,
  normalizeNFLGames,
} from "utils/games";

dayjs.extend(utc);
dayjs.extend(timezone);

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

const CACHE_KEYS = {
  liveGames: "liveGamesCache",
  dbGames: "dbGamesCache",
  summerGames: "summerGamesCache",
  nflGames: "nflGamesCache",
};

// ... imports remain the same

export default function ScoresScreen() {
  const currentYear = "2025";

  const {
    games: liveGames,
    loading: liveLoading,
    refreshGames: refreshLiveGames,
  } = useLiveSeasonGames(currentYear);

  const {
    games: nflGames,
    loading: nflLoading,
    refetch: refreshNFLGames,
  } = useNFLSeasonGames("2025", "1");

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

  const { news, refreshNews } = useNews();
  const { highlights } = useHighlights("NBA highlights", 50);

  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getScoresStyles(isDark);

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const sportsModalRef = useRef<SportsListModalRef>(null);
  const [leagueModalVisible, setLeagueModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [favorites, setFavorites] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // --- Favorites ---
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
          modalVisible={leagueModalVisible}
          setModalVisible={setLeagueModalVisible}
          onOpenLeagueModal={() => sportsModalRef.current?.present()}
        />
      ),
    });
  }, [navigation, leagueModalVisible]);

  // --- Normalize games ---
  const normalizedNFLGames = normalizeNFLGames(nflGames).map((game) => ({
    ...game,
    date: game.game?.date?.date || new Date().toISOString(),
    home: normalizeTeam(game.teams?.home),
    away: normalizeTeam(game.teams?.away),
  }));

  const inProgressGames = liveGames.filter((g) => g.status === "In Progress");
  const dbOnlyGames = dbGames.filter((g) => g.status === "Scheduled" || g.status === "Final");
  const combinedSeasonGames = [...inProgressGames, ...dbOnlyGames];

  const filteredSeasonGames = filterByDate(combinedSeasonGames, selectedDate);
  const filteredSummerGames = filterByDate(summerGames, selectedDate);
  const filteredNFLGames = filterByDate(normalizedNFLGames, selectedDate);

  const normalizedSeasonGames = filteredSeasonGames.map((game) => ({
    ...game,
    date: game.date ? String(game.date) : new Date().toISOString(),
    period: game.period !== undefined ? String(game.period) : undefined,
    home: normalizeTeam(game.home),
    away: normalizeTeam(game.away),
  }));

  const normalizedSummerGames = filteredSummerGames.map((game) => ({
    ...game,
    date: game.date ? String(game.date) : new Date().toISOString(),
    period: game.period !== undefined ? String(game.period) : undefined,
    home: normalizeTeam(game.home),
    away: normalizeTeam(game.away),
  }));

  // --- Favorites logic ---
  const favoriteGames = React.useMemo(() => {
    if (!favorites.length) return [];

    const nbaFav = normalizedSeasonGames.filter(
      (game) =>
        favorites.includes(`NBA:${game.home.id}`) ||
        favorites.includes(`NBA:${game.away.id}`)
    ).map((game) => ({ ...game, league: { name: "NBA" } }));

    const nflFav = filteredNFLGames.filter(
      (game) =>
        favorites.includes(`NFL:${game.teams?.home?.id}`) ||
        favorites.includes(`NFL:${game.teams?.away?.id}`)
    ).map((game) => ({
      ...game,
      league: { name: "NFL" },
      home: normalizeTeam(game.teams?.home),
      away: normalizeTeam(game.teams?.away),
    }));

    return [...nbaFav, ...nflFav];
  }, [favorites, normalizedSeasonGames, filteredNFLGames]);

  const nbaWithoutFavorites = React.useMemo(() => {
    if (!favorites.length) return normalizedSeasonGames;
    return normalizedSeasonGames.filter(
      (game) =>
        !favorites.includes(`NBA:${game.home.id}`) &&
        !favorites.includes(`NBA:${game.away.id}`)
    );
  }, [favorites, normalizedSeasonGames]);

  const nflWithoutFavorites = React.useMemo(() => {
    if (!favorites.length) return filteredNFLGames;
    return filteredNFLGames.filter(
      (game) =>
        !favorites.includes(`NFL:${game.teams?.home?.id}`) &&
        !favorites.includes(`NFL:${game.teams?.away?.id}`)
    ).map((game) => ({
      ...game,
      home: normalizeTeam(game.teams?.home),
      away: normalizeTeam(game.teams?.away),
    }));
  }, [favorites, filteredNFLGames]);

  // --- Combine games by category ---
  const gamesByCategory: CombinedGamesSection[] = React.useMemo(() => {
    const sections: CombinedGamesSection[] = [
      { category: "Favorites", data: favoriteGames },
      { category: "NFL", data: nflWithoutFavorites },
      { category: "NBA", data: nbaWithoutFavorites },
      { category: "NBA Summer League", data: normalizedSummerGames },
    ];
    return sections.filter((section) => section.data.length > 0);
  }, [favoriteGames, nflWithoutFavorites, nbaWithoutFavorites, normalizedSummerGames]);

  // --- Refresh ---
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshLiveGames(),
        refreshDBGames(),
        refreshSummerGames(),
        refreshNFLGames(),
        refreshNews(),
      ]);
    } catch (error) {
      console.warn("Failed to refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const changeDateByDays = (days: number) => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };



  return (
    <>
      <View style={styles.container}>
        <View style={styles.contentArea}>
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
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            <CombinedGamesList
              gamesByCategory={gamesByCategory}
              loading={liveLoading || dbLoading || summerLoading || nflLoading}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          </ScrollView>
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
          ...[...combinedSeasonGames, ...summerGames].reduce(
            (acc, game) => {
              if (!game.date) return acc;
              const localDate = localDateOnly(game.date);
              const iso = `${localDate.getFullYear()}-${String(
                localDate.getMonth() + 1
              ).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
              acc[iso] = { marked: true, dotColor: isDark ? "#fff" : "#1d1d1d" };
              return acc;
            },
            {} as Record<string, { marked: boolean; dotColor: string }>
          ),
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

