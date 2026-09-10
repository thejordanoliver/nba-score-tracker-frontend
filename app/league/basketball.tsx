import { useBasketballGames } from "@/hooks/BasketballHooks/useBasketballGames";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ScrollView, View } from "react-native";
import PagerView from "react-native-pager-view";

/* -------------------------------------------------------------------------- */
/*                                   Shared                                   */
/* -------------------------------------------------------------------------- */

import CalendarModal from "../../components/CalendarModal";
import { CustomHeader } from "../../components/CustomHeader";
import DateNavigator from "../../components/DateNavigator";
import ForumFeed from "../../components/Forum/ForumFeed";
import AwardSeasons from "../../components/League/Awards/AwardSeasons";
import RecruitsList from "../../components/League/Recruiting/RecruitsList";
import NewsList from "../../components/News/NewsList";
import GamesList from "../../components/Sports/Basketball/Games/GamesList";
import MainScrollTabBar from "../../components/TabBars/MainTabScrollBar";

import { Colors } from "../../constants/styles";
import { usePreferences } from "../../contexts/PreferencesContext";
import { useLeagueCalendar } from "../../hooks/LeagueHooks/useLeagueCalendar";
import { useLeagueTabs } from "../../hooks/LeagueHooks/useLeagueTabs";
import { useLeaguesNews } from "../../hooks/NewsHooks/useLeaguesNews";
import { LeagueScreenStyles } from "../../styles/LeagueStyles/LeagueStyles";
import { getLeagueCalendarDateKey } from "../../utils/leagueCalendarCache";

/* -------------------------------------------------------------------------- */
/*                                     NBA                                    */
/* -------------------------------------------------------------------------- */

import Draft, {
  getDefaultDraftYear,
} from "../../components/League/Draft/Draft";
import NBASeasonLeadersList from "../../components/League/SeasonLeadersList";
import { StandingsList } from "../../components/League/Standings/StandingsList";
import { NBAPlayoffBracket } from "../../components/Sports/Basketball/NBAPlayoffs/NBAPlayoffBracket";

import { useNBAPlayoffGames } from "../../hooks/NBAHooks/useNBAPlayoffGames";
import { useSeasonLeaders as useNBASeasonLeaders } from "../../hooks/NBAHooks/useSeasonLeaders";

/* -------------------------------------------------------------------------- */
/*                                     CBB/WCBB                                    */
/* -------------------------------------------------------------------------- */

import ConferenceListModal, {
  ConferenceListModalRef,
} from "@/components/League/ConferenceListModal";
import { ConferenceStandingsList } from "@/components/Sports/Basketball/Standings/ConferenceStandingsList";
import { getWCBBConferenceSelectionName } from "@/constants/wcbbConferences";
import { useConferenceStandings } from "@/hooks/BasketballHooks/useConferenceStandings";
import { usePagerTabScrollProgress } from "@/hooks/usePagerTabScrollProgress";
import { useLeagueFavoriteHeader } from "@/hooks/UserHooks/useLeagueFavoriteHeader";
import TournamentTreeBracket from "../../components/Sports/Basketball/CBBTournament/TournamentTreeBracket";
import { CBBStandingsList } from "../../components/Sports/Basketball/Standings/CBBStandingsList";
import CollegeSeasonLeadersList from "../../components/Sports/Football/SeasonLeaderList";
import { getCBBConferenceSelectionName } from "../../constants/cbbConferences";
import { useSeasonLeaders } from "../../hooks/FootballHooks/useSeasonLeaders";
import {
  getCBBSeason,
  getNBACalendarSeason,
  getRecruitYear,
  getWNBASeason,
} from "../../utils/dateUtils";

dayjs.extend(utc);
dayjs.extend(timezone);

type SelectedConference = number | string | null;

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const getMonthAnchor = (value: Date | string) =>
  dayjs(value).startOf("month").format("YYYY-MM-DD");

function isTop25Rank(rank: unknown) {
  const parsedRank = Number(rank);

  return Number.isFinite(parsedRank) && parsedRank >= 1 && parsedRank <= 25;
}

/* -------------------------------------------------------------------------- */
/*                                 Main Route                                 */
/* -------------------------------------------------------------------------- */

export default function BasketballLeagueScreen() {
  const params = useLocalSearchParams<{
    league?: string | string[];
    leagueLabel?: string;
  }>();

  const league = params.league;

  const isWNBA = league === "wnba";
  const isCBB = league === "cbb";
  const isWCBB = league === "wcbb";
  const isGLEAGUE = league === "gleague";

  if (isCBB) {
    return <CBBLeagueScreen />;
  }
  if (isWCBB) {
    return <WCBBLeagueScreen />;
  }
  if (isWNBA) {
    return <WNBALeagueScreen />;
  }
  if (isGLEAGUE) {
    return <GLeagueScreen />;
  }

  return <NBALeagueScreen />;
}

/* ========================================================================== */
/*                                    NBA                                     */
/* ========================================================================== */

function NBALeagueScreen() {
  const league = "nba";
  const favoriteHeaderProps = useLeagueFavoriteHeader(league);

  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = LeagueScreenStyles(isDark);

  const navigation = useNavigation();

  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    dayjs().startOf("day").toDate(),
  );

  const [calendarAnchorDate, setCalendarAnchorDate] = useState(() =>
    getMonthAnchor(new Date()),
  );

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [draftTeam, setDraftTeam] = useState("all");
  const [draftRound, setDraftRound] = useState("all");

  const [draftYear, setDraftYear] = useState(() =>
    getDefaultDraftYear(league).toString(),
  );

  const [standingsYear, setStandingsYear] = useState(() =>
    getNBACalendarSeason().toString(),
  );

  const selectedSeason = getNBACalendarSeason();

  const { tabs, selectedTab, setSelectedTab, hasVisitedTab } =
    useLeagueTabs(league);
  const pagerRef = useRef<PagerView>(null);
  const { scrollProgress, handlePageScroll, syncPageScrollProgress } =
    usePagerTabScrollProgress();
  const tabToIndex = (tab: (typeof tabs)[number]) => tabs.indexOf(tab);
  const indexToTab = (index: number) => tabs[index];
  const handleTabPress = (tab: (typeof tabs)[number]) => {
    setSelectedTab(tab);
    pagerRef.current?.setPage(tabToIndex(tab));
  };
  const handlePageChange = (index: number) => {
    syncPageScrollProgress(index);
    setSelectedTab(indexToTab(index));
  };

  const {
    calendar,
    error: calendarError,
    refresh: refreshCalendar,
  } = useLeagueCalendar(league, "raw", calendarAnchorDate);

  /* ------------------------------------------------------------------------ */
  /*                                NBA Games                                 */
  /* ------------------------------------------------------------------------ */

  const {
    games: nbaGames,
    error: nbaGamesError,
    refreshGames: refreshNBAGames,
    loading: loadingNBAGames,
  } = useBasketballGames(selectedDate, league);

  const {
    games: summerVegasGames,
    error: summerVegasGamesError,
    refreshGames: refreshSummerVegasGames,
    loading: loadingSummerVegasGames,
  } = useBasketballGames(selectedDate, "summervegas");

  const {
    games: summerUtahGames,
    error: summerUtahGamesError,
    refreshGames: refreshSummerUtahGames,
    loading: loadingSummerUtahGames,
  } = useBasketballGames(selectedDate, "summerutah");

  const {
    games: summerCaliforniaGames,
    error: summerCaliforniaGamesError,
    refreshGames: refreshSummerCaliforniaGames,
    loading: loadingSummerCaliforniaGames,
  } = useBasketballGames(selectedDate, "summercalifornia");

  const combinedGames = useMemo(() => {
    const allGames = [
      ...(nbaGames ?? []),
      ...(summerVegasGames ?? []),
      ...(summerUtahGames ?? []),
      ...(summerCaliforniaGames ?? []),
    ];

    const seenGameIds = new Set<string>();

    return allGames
      .filter((game) => {
        if (game.id === null || game.id === undefined) {
          return true;
        }

        const id = String(game.id);

        if (seenGameIds.has(id)) {
          return false;
        }

        seenGameIds.add(id);

        return true;
      })
      .sort((a, b) => {
        const aTime = new Date(a.date ?? 0).getTime();
        const bTime = new Date(b.date ?? 0).getTime();

        return aTime - bTime;
      });
  }, [nbaGames, summerVegasGames, summerUtahGames, summerCaliforniaGames]);

  const combinedGamesLoading =
    loadingNBAGames ||
    loadingSummerVegasGames ||
    loadingSummerUtahGames ||
    loadingSummerCaliforniaGames;

  const combinedGamesError =
    nbaGamesError ??
    summerVegasGamesError ??
    summerUtahGamesError ??
    summerCaliforniaGamesError ??
    null;

  /* ------------------------------------------------------------------------ */
  /*                              NBA Playoffs                                */
  /* ------------------------------------------------------------------------ */

  const {
    rounds: playoffRounds,
    loading: playoffLoading,
    error: playoffError,
    refreshingGames: refreshingPlayoffGames,
    refreshGames: refreshPlayoffGames,
  } = useNBAPlayoffGames({
    season: selectedSeason,
    enabled: hasVisitedTab("playoffs"),
  });

  /* ------------------------------------------------------------------------ */
  /*                              NBA Leaders                                 */
  /* ------------------------------------------------------------------------ */

  const {
    leaders,
    loading: leadersLoading,
    error: leadersError,
  } = useNBASeasonLeaders({ enabled: hasVisitedTab("stats") });

  /* ------------------------------------------------------------------------ */
  /*                                  News                                    */
  /* ------------------------------------------------------------------------ */

  const {
    articles,
    loading: newsLoading,
    refreshing: refreshingNews,
    error: newsError,
    refresh: refreshNews,
  } = useLeaguesNews(league, 10, { enabled: hasVisitedTab("news") });

  /* ------------------------------------------------------------------------ */
  /*                                 Effects                                  */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const nextAnchor = getMonthAnchor(selectedDate);

    setCalendarAnchorDate((previousAnchor) =>
      previousAnchor === nextAnchor ? previousAnchor : nextAnchor,
    );
  }, [selectedDate]);

  useEffect(() => {
    if (calendarError) {
      console.warn("NBA calendar error:", calendarError);
    }
  }, [calendarError]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader
          tabName={league.toUpperCase()}
          league={league}
          onBack={goBack}
          {...favoriteHeaderProps}
        />
      ),
    });
  }, [favoriteHeaderProps, league, navigation]);

  /* ------------------------------------------------------------------------ */
  /*                                Handlers                                  */
  /* ------------------------------------------------------------------------ */

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        refreshNBAGames(),
        refreshSummerVegasGames(),
        refreshSummerUtahGames(),
        refreshSummerCaliforniaGames(),
        refreshCalendar(),
      ]);
    } catch (refreshError) {
      console.warn(
        "Failed to refresh one or more NBA game feeds:",
        refreshError,
      );
    } finally {
      setRefreshing(false);
    }
  }, [
    refreshNBAGames,
    refreshSummerVegasGames,
    refreshSummerUtahGames,
    refreshSummerCaliforniaGames,
    refreshCalendar,
  ]);

  const changeDateByDays = useCallback((days: number) => {
    setSelectedDate((previousDate) =>
      dayjs(previousDate).add(days, "day").startOf("day").toDate(),
    );
  }, []);

  const handleCalendarMonthChange = useCallback((anchorDate: string) => {
    setCalendarAnchorDate((previousAnchor) =>
      previousAnchor === anchorDate ? previousAnchor : anchorDate,
    );
  }, []);

  const markedDates = useMemo(() => {
    return (calendar ?? []).reduce(
      (dates, calendarDate) => {
        if (typeof calendarDate !== "string") {
          return dates;
        }

        const dateKey = getLeagueCalendarDateKey(calendarDate);

        if (!dateKey) {
          return dates;
        }

        dates[dateKey] = {
          marked: true,
          dotColor: isDark ? Colors.white : Colors.black,
        };

        return dates;
      },
      {} as Record<
        string,
        {
          marked: boolean;
          dotColor: string;
        }
      >,
    );
  }, [calendar, isDark]);

  /* ------------------------------------------------------------------------ */
  /*                                  Render                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <MainScrollTabBar
        tabs={tabs}
        selected={selectedTab}
        onTabPress={handleTabPress}
        isDark={isDark}
        scrollProgress={scrollProgress}
      />

      <View style={styles.container}>
        <PagerView
          key={league}
          ref={pagerRef}
          style={styles.container}
          initialPage={tabToIndex(selectedTab)}
          onPageScroll={handlePageScroll}
          onPageSelected={(event) =>
            handlePageChange(event.nativeEvent.position)
          }
        >
          {/* SCORES */}
          <View key="scores">
            <DateNavigator
              selectedDate={selectedDate}
              onChangeDate={changeDateByDays}
              onOpenCalendar={() => setShowCalendarModal(true)}
              isDark={isDark}
            />

            <GamesList
              games={combinedGames}
              error={combinedGamesError}
              loading={combinedGamesLoading}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              showHeaders={false}
              scrollEnabled
            />
          </View>

          {/* NEWS */}
          <View key="news" style={styles.contentArea}>
            {hasVisitedTab("news") ? (
              <NewsList
                items={articles}
                loading={newsLoading}
                error={newsError}
                refreshing={refreshingNews}
                onRefresh={refreshNews}
                isDark={isDark}
              />
            ) : null}
          </View>

          {/* STANDINGS */}
          <View key="standings">
            {hasVisitedTab("standings") ? (
              <StandingsList
                year={standingsYear}
                onYearChange={setStandingsYear}
                league={league}
              />
            ) : null}
          </View>

          {/* PLAYOFFS */}
          <View key="playoffs" style={styles.contentArea}>
            {hasVisitedTab("playoffs") ? (
              <NBAPlayoffBracket
                rounds={playoffRounds}
                loading={playoffLoading}
                error={playoffError}
                refreshing={refreshingPlayoffGames}
                onRefresh={refreshPlayoffGames}
              />
            ) : null}
          </View>

          {/* STATS */}
          <ScrollView key="stats">
            {hasVisitedTab("stats") ? (
              <NBASeasonLeadersList
                leadersByStat={leaders}
                loading={leadersLoading}
                error={leadersError}
              />
            ) : null}
          </ScrollView>

          {/* DRAFT */}
          <View key="draft" style={styles.contentArea}>
            {hasVisitedTab("draft") ? (
              <Draft
                year={draftYear}
                team={draftTeam}
                round={draftRound}
                onYearChange={setDraftYear}
                onTeamChange={setDraftTeam}
                onRoundChange={setDraftRound}
                league={league}
              />
            ) : null}
          </View>

          {/* AWARDS */}
          <View key="awards" style={styles.contentArea}>
            {hasVisitedTab("awards") ? <AwardSeasons league={league} /> : null}
          </View>

          {/* FORUM */}
          <View key="forum" style={styles.contentArea}>
            {hasVisitedTab("forum") ? <ForumFeed league={league} /> : null}
          </View>
        </PagerView>
      </View>

      <CalendarModal
        visible={showCalendarModal}
        selectedDate={dayjs(selectedDate).format("YYYY-MM-DD")}
        onClose={() => setShowCalendarModal(false)}
        onMonthChange={handleCalendarMonthChange}
        onSelectDate={(dateString) => {
          const nextDate = dayjs(dateString, "YYYY-MM-DD")
            .startOf("day")
            .toDate();

          setSelectedDate(nextDate);
          setCalendarAnchorDate(getMonthAnchor(nextDate));
          setShowCalendarModal(false);
        }}
        markedDates={markedDates}
      />
    </>
  );
}

/* ========================================================================== */
/*                                    WNBA                                     */
/* ========================================================================== */

function WNBALeagueScreen() {
  const league = "wnba";
  const favoriteHeaderProps = useLeagueFavoriteHeader(league);

  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = LeagueScreenStyles(isDark);

  const navigation = useNavigation();

  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    dayjs().startOf("day").toDate(),
  );

  const [calendarAnchorDate, setCalendarAnchorDate] = useState(() =>
    getMonthAnchor(new Date()),
  );

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [draftTeam, setDraftTeam] = useState("all");
  const [draftRound, setDraftRound] = useState("all");

  const [draftYear, setDraftYear] = useState(() =>
    getDefaultDraftYear(league).toString(),
  );

  const [standingsYear, setStandingsYear] = useState(
    getWNBASeason().toString(),
  );

  const { tabs, selectedTab, setSelectedTab, hasVisitedTab } =
    useLeagueTabs(league);
  const pagerRef = useRef<PagerView>(null);
  const { scrollProgress, handlePageScroll, syncPageScrollProgress } =
    usePagerTabScrollProgress();
  const tabToIndex = (tab: (typeof tabs)[number]) => tabs.indexOf(tab);
  const indexToTab = (index: number) => tabs[index];
  const handleTabPress = (tab: (typeof tabs)[number]) => {
    setSelectedTab(tab);
    pagerRef.current?.setPage(tabToIndex(tab));
  };
  const handlePageChange = (index: number) => {
    syncPageScrollProgress(index);
    setSelectedTab(indexToTab(index));
  };

  const {
    calendar,
    error: calendarError,
    refresh: refreshCalendar,
  } = useLeagueCalendar(league, "raw", calendarAnchorDate);

  /* ------------------------------------------------------------------------ */
  /*                                WNBA Games                                 */
  /* ------------------------------------------------------------------------ */

  const {
    games: wnbaGames,
    error: wnbaGamesError,
    refreshGames: refreshWNBAGames,
    loading: loadingWNBAGames,
  } = useBasketballGames(selectedDate, league);

  /* ------------------------------------------------------------------------ */
  /*                                  News                                    */
  /* ------------------------------------------------------------------------ */

  const {
    articles,
    loading: newsLoading,
    refreshing: refreshingNews,
    error: newsError,
    refresh: refreshNews,
  } = useLeaguesNews(league, 10, { enabled: hasVisitedTab("news") });

  /* ------------------------------------------------------------------------ */
  /*                                 Effects                                  */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const nextAnchor = getMonthAnchor(selectedDate);

    setCalendarAnchorDate((previousAnchor) =>
      previousAnchor === nextAnchor ? previousAnchor : nextAnchor,
    );
  }, [selectedDate]);

  useEffect(() => {
    if (calendarError) {
      console.warn("WNBA calendar error:", calendarError);
    }
  }, [calendarError]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader
          tabName={league.toUpperCase()}
          league={league}
          onBack={goBack}
          {...favoriteHeaderProps}
        />
      ),
    });
  }, [favoriteHeaderProps, league, navigation]);

  /* ------------------------------------------------------------------------ */
  /*                                Handlers                                  */
  /* ------------------------------------------------------------------------ */

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([refreshWNBAGames(), refreshCalendar()]);
    } catch (refreshError) {
      console.warn(
        "Failed to refresh one or more WNBA game feeds:",
        refreshError,
      );
    } finally {
      setRefreshing(false);
    }
  }, [refreshWNBAGames, refreshCalendar]);

  const changeDateByDays = useCallback((days: number) => {
    setSelectedDate((previousDate) =>
      dayjs(previousDate).add(days, "day").startOf("day").toDate(),
    );
  }, []);

  const handleCalendarMonthChange = useCallback((anchorDate: string) => {
    setCalendarAnchorDate((previousAnchor) =>
      previousAnchor === anchorDate ? previousAnchor : anchorDate,
    );
  }, []);

  const markedDates = useMemo(() => {
    return (calendar ?? []).reduce(
      (dates, calendarDate) => {
        if (typeof calendarDate !== "string") {
          return dates;
        }

        const dateKey = getLeagueCalendarDateKey(calendarDate);

        if (!dateKey) {
          return dates;
        }

        dates[dateKey] = {
          marked: true,
          dotColor: isDark ? Colors.white : Colors.black,
        };

        return dates;
      },
      {} as Record<
        string,
        {
          marked: boolean;
          dotColor: string;
        }
      >,
    );
  }, [calendar, isDark]);

  /* ------------------------------------------------------------------------ */
  /*                                  Render                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <MainScrollTabBar
        tabs={tabs}
        selected={selectedTab}
        onTabPress={handleTabPress}
        isDark={isDark}
        scrollProgress={scrollProgress}
      />

      <View style={styles.container}>
        <PagerView
          key={league}
          ref={pagerRef}
          style={styles.container}
          initialPage={tabToIndex(selectedTab)}
          onPageScroll={handlePageScroll}
          onPageSelected={(event) =>
            handlePageChange(event.nativeEvent.position)
          }
        >
          {/* SCORES */}
          <View key="scores">
            <DateNavigator
              selectedDate={selectedDate}
              onChangeDate={changeDateByDays}
              onOpenCalendar={() => setShowCalendarModal(true)}
              isDark={isDark}
            />

            <GamesList
              games={wnbaGames}
              error={wnbaGamesError}
              loading={loadingWNBAGames}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              showHeaders={false}
              scrollEnabled
            />
          </View>

          {/* NEWS */}
          <View key="news" style={styles.contentArea}>
            {hasVisitedTab("news") ? (
              <NewsList
                items={articles}
                loading={newsLoading}
                error={newsError}
                refreshing={refreshingNews}
                onRefresh={refreshNews}
                isDark={isDark}
              />
            ) : null}
          </View>

          {/* STANDINGS */}
          <View key="standings">
            {hasVisitedTab("standings") ? (
              <StandingsList
                year={standingsYear}
                onYearChange={setStandingsYear}
                league={league}
              />
            ) : null}
          </View>

          {/* DRAFT */}
          <View key="draft" style={styles.contentArea}>
            {hasVisitedTab("draft") ? (
              <Draft
                year={draftYear}
                team={draftTeam}
                round={draftRound}
                onYearChange={setDraftYear}
                onTeamChange={setDraftTeam}
                onRoundChange={setDraftRound}
                league="wnba"
              />
            ) : null}
          </View>

          {/* AWARDS */}
          <View key="awards" style={styles.contentArea}>
            {hasVisitedTab("awards") ? <AwardSeasons league={league} /> : null}
          </View>

          {/* FORUM */}
          <View key="forum" style={styles.contentArea}>
            {hasVisitedTab("forum") ? <ForumFeed league={league} /> : null}
          </View>
        </PagerView>
      </View>

      <CalendarModal
        visible={showCalendarModal}
        selectedDate={dayjs(selectedDate).format("YYYY-MM-DD")}
        onClose={() => setShowCalendarModal(false)}
        onMonthChange={handleCalendarMonthChange}
        onSelectDate={(dateString) => {
          const nextDate = dayjs(dateString, "YYYY-MM-DD")
            .startOf("day")
            .toDate();

          setSelectedDate(nextDate);
          setCalendarAnchorDate(getMonthAnchor(nextDate));
          setShowCalendarModal(false);
        }}
        markedDates={markedDates}
      />
    </>
  );
}

/* ========================================================================== */
/*                                    G League                                     */
/* ========================================================================== */

function GLeagueScreen() {
  const league = "gleague";
  const favoriteHeaderProps = useLeagueFavoriteHeader(league);

  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = LeagueScreenStyles(isDark);

  const navigation = useNavigation();

  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    dayjs().startOf("day").toDate(),
  );

  const [calendarAnchorDate, setCalendarAnchorDate] = useState(() =>
    getMonthAnchor(new Date()),
  );

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { tabs, selectedTab, setSelectedTab, hasVisitedTab } =
    useLeagueTabs(league);
  const pagerRef = useRef<PagerView>(null);
  const { scrollProgress, handlePageScroll, syncPageScrollProgress } =
    usePagerTabScrollProgress();
  const tabToIndex = (tab: (typeof tabs)[number]) => tabs.indexOf(tab);
  const indexToTab = (index: number) => tabs[index];
  const handleTabPress = (tab: (typeof tabs)[number]) => {
    setSelectedTab(tab);
    pagerRef.current?.setPage(tabToIndex(tab));
  };
  const handlePageChange = (index: number) => {
    syncPageScrollProgress(index);
    setSelectedTab(indexToTab(index));
  };

  const {
    calendar,
    error: calendarError,
    refresh: refreshCalendar,
  } = useLeagueCalendar(league, "raw", calendarAnchorDate);

  /* ------------------------------------------------------------------------ */
  /*                                WNBA Games                                 */
  /* ------------------------------------------------------------------------ */

  const {
    games: gLeagueGames,
    error: gLeagueGamesError,
    refreshGames: refreshGLeagueGames,
    loading: loadingGLeagueGames,
  } = useBasketballGames(selectedDate, "gleague");

  /* ------------------------------------------------------------------------ */
  /*                                  News                                    */
  /* ------------------------------------------------------------------------ */

  const {
    articles,
    loading: newsLoading,
    refreshing: refreshingNews,
    error: newsError,
    refresh: refreshNews,
  } = useLeaguesNews(league, 10, { enabled: hasVisitedTab("news") });

  /* ------------------------------------------------------------------------ */
  /*                                 Effects                                  */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const nextAnchor = getMonthAnchor(selectedDate);

    setCalendarAnchorDate((previousAnchor) =>
      previousAnchor === nextAnchor ? previousAnchor : nextAnchor,
    );
  }, [selectedDate]);

  useEffect(() => {
    if (calendarError) {
      console.warn("GLEAGUE calendar error:", calendarError);
    }
  }, [calendarError]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader
          tabName={"NBA G League"}
          league={league}
          onBack={goBack}
          {...favoriteHeaderProps}
        />
      ),
    });
  }, [favoriteHeaderProps, league, navigation]);

  /* ------------------------------------------------------------------------ */
  /*                                Handlers                                  */
  /* ------------------------------------------------------------------------ */

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([refreshGLeagueGames(), refreshCalendar()]);
    } catch (refreshError) {
      console.warn(
        "Failed to refresh one or more GLEAGUE game feeds:",
        refreshError,
      );
    } finally {
      setRefreshing(false);
    }
  }, [refreshGLeagueGames, refreshCalendar]);

  const changeDateByDays = useCallback((days: number) => {
    setSelectedDate((previousDate) =>
      dayjs(previousDate).add(days, "day").startOf("day").toDate(),
    );
  }, []);

  const handleCalendarMonthChange = useCallback((anchorDate: string) => {
    setCalendarAnchorDate((previousAnchor) =>
      previousAnchor === anchorDate ? previousAnchor : anchorDate,
    );
  }, []);

  const markedDates = useMemo(() => {
    return (calendar ?? []).reduce(
      (dates, calendarDate) => {
        if (typeof calendarDate !== "string") {
          return dates;
        }

        const dateKey = getLeagueCalendarDateKey(calendarDate);

        if (!dateKey) {
          return dates;
        }

        dates[dateKey] = {
          marked: true,
          dotColor: isDark ? Colors.white : Colors.black,
        };

        return dates;
      },
      {} as Record<
        string,
        {
          marked: boolean;
          dotColor: string;
        }
      >,
    );
  }, [calendar, isDark]);

  /* ------------------------------------------------------------------------ */
  /*                                  Render                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <MainScrollTabBar
        tabs={tabs}
        selected={selectedTab}
        onTabPress={handleTabPress}
        isDark={isDark}
        scrollProgress={scrollProgress}
      />

      <View style={styles.container}>
        <PagerView
          key={league}
          ref={pagerRef}
          style={styles.container}
          initialPage={tabToIndex(selectedTab)}
          onPageScroll={handlePageScroll}
          onPageSelected={(event) =>
            handlePageChange(event.nativeEvent.position)
          }
        >
          {/* SCORES */}
          <View key="scores">
            <DateNavigator
              selectedDate={selectedDate}
              onChangeDate={changeDateByDays}
              onOpenCalendar={() => setShowCalendarModal(true)}
              isDark={isDark}
            />

            <GamesList
              games={gLeagueGames}
              error={gLeagueGamesError}
              loading={loadingGLeagueGames}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              showHeaders={false}
              scrollEnabled
            />
          </View>

          {/* NEWS */}
          <View key="news" style={styles.contentArea}>
            {hasVisitedTab("news") ? (
              <NewsList
                items={articles}
                loading={newsLoading}
                error={newsError}
                refreshing={refreshingNews}
                onRefresh={refreshNews}
                isDark={isDark}
              />
            ) : null}
          </View>

          {/* FORUM */}
          <View key="forum" style={styles.contentArea}>
            {hasVisitedTab("forum") ? <ForumFeed league={league} /> : null}
          </View>
        </PagerView>
      </View>

      <CalendarModal
        visible={showCalendarModal}
        selectedDate={dayjs(selectedDate).format("YYYY-MM-DD")}
        onClose={() => setShowCalendarModal(false)}
        onMonthChange={handleCalendarMonthChange}
        onSelectDate={(dateString) => {
          const nextDate = dayjs(dateString, "YYYY-MM-DD")
            .startOf("day")
            .toDate();

          setSelectedDate(nextDate);
          setCalendarAnchorDate(getMonthAnchor(nextDate));
          setShowCalendarModal(false);
        }}
        markedDates={markedDates}
      />
    </>
  );
}

/* ========================================================================== */
/*                                    CBB                                     */
/* ========================================================================== */
function CBBLeagueScreen() {
  const league = "cbb";
  const favoriteHeaderProps = useLeagueFavoriteHeader(league);
  const currentSeason = getCBBSeason();

  const navigation = useNavigation();

  const conferenceModalRef = useRef<ConferenceListModalRef>(null);

  const { resolvedColorScheme } = usePreferences();

  const isDark = resolvedColorScheme === "dark";
  const styles = LeagueScreenStyles(isDark);

  /* ------------------------------------------------------------------------ */
  /*                                  State                                   */
  /* ------------------------------------------------------------------------ */

  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    dayjs().startOf("day").toDate(),
  );
  const [gamesRefreshing, setGamesRefreshing] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedConference, setSelectedConference] =
    useState<SelectedConference>("top25");
  const [isConferenceModalOpen, setIsConferenceModalOpen] = useState(false);
  const [recruitTeam, setRecruitTeam] = useState("all");
  const [recruitYear, setRecruitYear] = useState(() =>
    String(getRecruitYear()),
  );
  const [recruitView, setRecruitView] = useState<"players" | "teams">(
    "players",
  );
  const { tabs, selectedTab, setSelectedTab, hasVisitedTab } =
    useLeagueTabs(league);
  const pagerRef = useRef<PagerView>(null);
  const { scrollProgress, handlePageScroll, syncPageScrollProgress } =
    usePagerTabScrollProgress();
  const tabToIndex = (tab: (typeof tabs)[number]) => tabs.indexOf(tab);
  const indexToTab = (index: number) => tabs[index];
  const handleTabPress = (tab: (typeof tabs)[number]) => {
    setSelectedTab(tab);
    pagerRef.current?.setPage(tabToIndex(tab));
  };
  const handlePageChange = (index: number) => {
    syncPageScrollProgress(index);
    setSelectedTab(indexToTab(index));
  };

  /* ------------------------------------------------------------------------ */
  /*                               Conference                                 */
  /* ------------------------------------------------------------------------ */

  const selectedConferenceName = useMemo(() => {
    return getCBBConferenceSelectionName(selectedConference);
  }, [selectedConference]);

  const selectedConferenceGroupId = useMemo(() => {
    if (
      selectedConference == null ||
      selectedConference === "top25" ||
      Number(selectedConference) === 50
    ) {
      return null;
    }

    const conferenceId = Number(selectedConference);

    return Number.isFinite(conferenceId) ? conferenceId : null;
  }, [selectedConference]);

  const { conferences, conferencesLoading, conferencesError } =
    useConferenceStandings(league, selectedConferenceGroupId, {
      enabled: hasVisitedTab("standings"),
    });

  /* ------------------------------------------------------------------------ */
  /*                                Calendar                                  */
  /* ------------------------------------------------------------------------ */

  const { calendar } = useLeagueCalendar(league);

  const markedDates = useMemo(() => {
    return (calendar ?? []).reduce(
      (dates, calendarDate) => {
        if (typeof calendarDate !== "string") {
          return dates;
        }

        const dateKey =
          getLeagueCalendarDateKey(calendarDate) ??
          dayjs(calendarDate).format("YYYY-MM-DD");

        if (!dateKey) {
          return dates;
        }

        dates[dateKey] = {
          marked: true,
          dotColor: isDark ? Colors.white : Colors.black,
        };

        return dates;
      },
      {} as Record<
        string,
        {
          marked: boolean;
          dotColor: string;
        }
      >,
    );
  }, [calendar, isDark]);

  /* ------------------------------------------------------------------------ */
  /*                                   Games                                  */
  /* ------------------------------------------------------------------------ */

  const {
    games: cbbGames,
    error: cbbGamesError,
    refreshGames: refreshCBBGames,
    loading: cbbGamesLoading,
  } = useBasketballGames(selectedDate, league, selectedConferenceGroupId);

  const displayedGames = useMemo(() => {
    if (!selectedConference) {
      return cbbGames ?? [];
    }

    if (selectedConference === "top25") {
      return (cbbGames ?? []).filter(
        (game) => isTop25Rank(game.home?.rank) || isTop25Rank(game.away?.rank),
      );
    }

    return cbbGames ?? [];
  }, [cbbGames, selectedConference]);

  /* ------------------------------------------------------------------------ */
  /*                                   News                                   */
  /* ------------------------------------------------------------------------ */

  const {
    articles,
    loading: newsLoading,
    refreshing: refreshingNews,
    error: newsError,
    refresh: refreshNews,
  } = useLeaguesNews(league, 10, { enabled: hasVisitedTab("news") });

  /* ------------------------------------------------------------------------ */
  /*                                  Leaders                                 */
  /* ------------------------------------------------------------------------ */

  const {
    categories,
    loading: leadersLoading,
    error: leadersError,
  } = useSeasonLeaders(currentSeason, league, {
    enabled: hasVisitedTab("stats"),
  });

  /* ------------------------------------------------------------------------ */
  /*                                  Header                                  */
  /* ------------------------------------------------------------------------ */

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader
          tabName={"Men's College Basketball"}
          league={"Men's Colege Basketball"}
          onBack={goBack}
          modalVisible={isConferenceModalOpen}
          setModalVisible={setIsConferenceModalOpen}
          onOpenLeagueModal={() => conferenceModalRef.current?.present()}
          selectedConferenceName={selectedConferenceName}
          {...favoriteHeaderProps}
        />
      ),
    });
  }, [
    favoriteHeaderProps,
    isConferenceModalOpen,
    league,
    navigation,
    selectedConferenceName,
  ]);
  /* ------------------------------------------------------------------------ */
  /*                                 Handlers                                 */
  /* ------------------------------------------------------------------------ */

  const handleScoresRefresh = useCallback(async () => {
    setGamesRefreshing(true);

    try {
      await refreshCBBGames();
    } catch (error) {
      console.warn("Failed to refresh CBB games:", error);
    } finally {
      setGamesRefreshing(false);
    }
  }, [refreshCBBGames]);

  const changeDateByDays = useCallback((days: number) => {
    setSelectedDate((previousDate) =>
      dayjs(previousDate).add(days, "day").startOf("day").toDate(),
    );
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                                  Pages                                   */
  /* ------------------------------------------------------------------------ */

  const scoresPage = (
    <View key="scores" style={styles.contentArea}>
      <DateNavigator
        selectedDate={selectedDate}
        onChangeDate={changeDateByDays}
        onOpenCalendar={() => setShowCalendarModal(true)}
        isDark={isDark}
      />

      <GamesList
        games={displayedGames}
        error={cbbGamesError}
        loading={cbbGamesLoading}
        refreshing={gamesRefreshing}
        onRefresh={handleScoresRefresh}
        showHeaders={false}
        isCBB
      />
    </View>
  );

  const newsPage = (
    <View key="news" style={styles.contentArea}>
      {hasVisitedTab("news") ? (
        <NewsList
          items={articles}
          loading={newsLoading}
          error={newsError}
          refreshing={refreshingNews}
          onRefresh={refreshNews}
          isDark={isDark}
        />
      ) : null}
    </View>
  );

  const standingsPage = (
    <View key="standings" style={styles.contentArea}>
      {hasVisitedTab("standings") ? (
        !selectedConferenceGroupId ? (
          <CBBStandingsList league={league} />
        ) : (
          <ConferenceStandingsList
            conferences={conferences}
            loading={conferencesLoading}
            error={conferencesError}
            league={league}
          />
        )
      ) : null}
    </View>
  );

  const statsPage = (
    <View key="stats" style={styles.contentArea}>
      {hasVisitedTab("stats") ? (
        <CollegeSeasonLeadersList
          loading={leadersLoading}
          error={leadersError}
          categories={categories}
          league={league}
        />
      ) : null}
    </View>
  );

  const bracketPage = (
    <View key="bracket" style={styles.contentArea}>
      {hasVisitedTab("bracket") ? (
        <TournamentTreeBracket league={league} season={2025} />
      ) : null}
    </View>
  );

  const recruitsPage = (
    <View key="recruits" style={styles.contentArea}>
      {hasVisitedTab("recruits") ? (
        <RecruitsList
          year={recruitYear}
          team={recruitTeam}
          view={recruitView}
          onYearChange={setRecruitYear}
          onTeamChange={setRecruitTeam}
          onViewChange={setRecruitView}
          league={league}
        />
      ) : null}
    </View>
  );

  const awardsPage = (
    <View key="awards" style={styles.contentArea}>
      {hasVisitedTab("awards") ? <AwardSeasons league={league} /> : null}
    </View>
  );

  const forumPage = (
    <View key="forum" style={styles.contentArea}>
      {hasVisitedTab("forum") ? <ForumFeed league={league} /> : null}
    </View>
  );

  const pagerPages = [
    scoresPage,
    newsPage,
    standingsPage,
    statsPage,
    bracketPage,
    recruitsPage,
    awardsPage,
    forumPage,
  ];

  /* ------------------------------------------------------------------------ */
  /*                                  Render                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <MainScrollTabBar
        tabs={tabs}
        selected={selectedTab}
        onTabPress={handleTabPress}
        isDark={isDark}
        scrollProgress={scrollProgress}
      />

      <View style={styles.container}>
        <PagerView
          key={league}
          ref={pagerRef}
          style={styles.container}
          initialPage={tabToIndex(selectedTab)}
          onPageScroll={handlePageScroll}
          onPageSelected={(event) =>
            handlePageChange(event.nativeEvent.position)
          }
        >
          {pagerPages}
        </PagerView>
      </View>

      <CalendarModal
        visible={showCalendarModal}
        selectedDate={dayjs(selectedDate).format("YYYY-MM-DD")}
        onClose={() => setShowCalendarModal(false)}
        onSelectDate={(dateString) => {
          const nextDate = dayjs(dateString, "YYYY-MM-DD")
            .startOf("day")
            .toDate();

          setSelectedDate(nextDate);
          setShowCalendarModal(false);
        }}
        markedDates={markedDates}
      />

      <ConferenceListModal
        ref={conferenceModalRef}
        selectedConference={selectedConference}
        onSelect={setSelectedConference}
        onOpen={() => setIsConferenceModalOpen(true)}
        onClose={() => setIsConferenceModalOpen(false)}
        league={league}
      />
    </>
  );
}

/* ========================================================================== */
/*                                    WCBB                                     */
/* ========================================================================== */

function WCBBLeagueScreen() {
  const league = "wcbb";
  const favoriteHeaderProps = useLeagueFavoriteHeader(league);
  const currentSeason = getCBBSeason();

  const navigation = useNavigation();

  const conferenceModalRef = useRef<ConferenceListModalRef>(null);

  const { resolvedColorScheme } = usePreferences();

  const isDark = resolvedColorScheme === "dark";
  const styles = LeagueScreenStyles(isDark);

  /* ------------------------------------------------------------------------ */
  /*                                  State                                   */
  /* ------------------------------------------------------------------------ */

  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    dayjs().startOf("day").toDate(),
  );
  const [gamesRefreshing, setGamesRefreshing] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedConference, setSelectedConference] =
    useState<SelectedConference>("top25");
  const [isConferenceModalOpen, setIsConferenceModalOpen] = useState(false);
  const { tabs, selectedTab, setSelectedTab, hasVisitedTab } =
    useLeagueTabs(league);
  const pagerRef = useRef<PagerView>(null);
  const { scrollProgress, handlePageScroll, syncPageScrollProgress } =
    usePagerTabScrollProgress();
  const tabToIndex = (tab: (typeof tabs)[number]) => tabs.indexOf(tab);
  const indexToTab = (index: number) => tabs[index];
  const handleTabPress = (tab: (typeof tabs)[number]) => {
    setSelectedTab(tab);
    pagerRef.current?.setPage(tabToIndex(tab));
  };
  const handlePageChange = (index: number) => {
    syncPageScrollProgress(index);
    setSelectedTab(indexToTab(index));
  };

  /* ------------------------------------------------------------------------ */
  /*                               Conference                                 */
  /* ------------------------------------------------------------------------ */

  const selectedConferenceName = useMemo(() => {
    return getWCBBConferenceSelectionName(selectedConference);
  }, [selectedConference]);

  const selectedConferenceGroupId = useMemo(() => {
    if (
      selectedConference == null ||
      selectedConference === "top25" ||
      Number(selectedConference) === 50
    ) {
      return null;
    }

    const conferenceId = Number(selectedConference);

    return Number.isFinite(conferenceId) ? conferenceId : null;
  }, [selectedConference]);

  const { conferences, conferencesLoading, conferencesError } =
    useConferenceStandings(league, selectedConferenceGroupId, {
      enabled: hasVisitedTab("standings"),
    });

  /* ------------------------------------------------------------------------ */
  /*                                Calendar                                  */
  /* ------------------------------------------------------------------------ */

  const { calendar } = useLeagueCalendar(league);

  const markedDates = useMemo(() => {
    return (calendar ?? []).reduce(
      (dates, calendarDate) => {
        if (typeof calendarDate !== "string") {
          return dates;
        }

        const dateKey =
          getLeagueCalendarDateKey(calendarDate) ??
          dayjs(calendarDate).format("YYYY-MM-DD");

        if (!dateKey) {
          return dates;
        }

        dates[dateKey] = {
          marked: true,
          dotColor: isDark ? Colors.white : Colors.black,
        };

        return dates;
      },
      {} as Record<
        string,
        {
          marked: boolean;
          dotColor: string;
        }
      >,
    );
  }, [calendar, isDark]);

  /* ------------------------------------------------------------------------ */
  /*                                   Games                                  */
  /* ------------------------------------------------------------------------ */

  const {
    games: wcbbGames,
    error: wcbbGamesError,
    refreshGames: refreshWCBBGames,
    loading: wcbbGamesLoading,
  } = useBasketballGames(selectedDate, league, selectedConferenceGroupId);

  const displayedGames = useMemo(() => {
    if (!selectedConference) {
      return wcbbGames ?? [];
    }

    if (selectedConference === "top25") {
      return (wcbbGames ?? []).filter(
        (game) => isTop25Rank(game.home?.rank) || isTop25Rank(game.away?.rank),
      );
    }

    return wcbbGames ?? [];
  }, [wcbbGames, selectedConference]);

  /* ------------------------------------------------------------------------ */
  /*                                   News                                   */
  /* ------------------------------------------------------------------------ */

  const {
    articles,
    loading: newsLoading,
    refreshing: refreshingNews,
    error: newsError,
    refresh: refreshNews,
  } = useLeaguesNews(league, 10, { enabled: hasVisitedTab("news") });

  /* ------------------------------------------------------------------------ */
  /*                                  Leaders                                 */
  /* ------------------------------------------------------------------------ */

  const {
    categories,
    loading: leadersLoading,
    error: leadersError,
  } = useSeasonLeaders(currentSeason, league, {
    enabled: hasVisitedTab("stats"),
  });

  /* ------------------------------------------------------------------------ */
  /*                                  Header                                  */
  /* ------------------------------------------------------------------------ */

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader
          tabName={"Women's College Basketball"}
          league={"Women's Colege Basketball"}
          onBack={goBack}
          modalVisible={isConferenceModalOpen}
          setModalVisible={setIsConferenceModalOpen}
          onOpenLeagueModal={() => conferenceModalRef.current?.present()}
          selectedConferenceName={selectedConferenceName}
          {...favoriteHeaderProps}
        />
      ),
    });
  }, [
    favoriteHeaderProps,
    isConferenceModalOpen,
    league,
    navigation,
    selectedConferenceName,
  ]);
  /* ------------------------------------------------------------------------ */
  /*                                 Handlers                                 */
  /* ------------------------------------------------------------------------ */

  const handleScoresRefresh = useCallback(async () => {
    setGamesRefreshing(true);

    try {
      await refreshWCBBGames();
    } catch (error) {
      console.warn("Failed to refresh WCBB games:", error);
    } finally {
      setGamesRefreshing(false);
    }
  }, [refreshWCBBGames]);

  const changeDateByDays = useCallback((days: number) => {
    setSelectedDate((previousDate) =>
      dayjs(previousDate).add(days, "day").startOf("day").toDate(),
    );
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                                  Pages                                   */
  /* ------------------------------------------------------------------------ */

  const scoresPage = (
    <View key="scores" style={styles.contentArea}>
      <DateNavigator
        selectedDate={selectedDate}
        onChangeDate={changeDateByDays}
        onOpenCalendar={() => setShowCalendarModal(true)}
        isDark={isDark}
      />

      <GamesList
        games={displayedGames}
        error={wcbbGamesError}
        loading={wcbbGamesLoading}
        refreshing={gamesRefreshing}
        onRefresh={handleScoresRefresh}
        showHeaders={false}
        isCBB
      />
    </View>
  );

  const newsPage = (
    <View key="news" style={styles.contentArea}>
      {hasVisitedTab("news") ? (
        <NewsList
          items={articles}
          loading={newsLoading}
          error={newsError}
          refreshing={refreshingNews}
          onRefresh={refreshNews}
          isDark={isDark}
        />
      ) : null}
    </View>
  );

  const standingsPage = (
    <View key="standings" style={styles.contentArea}>
      {hasVisitedTab("standings") ? (
        !selectedConferenceGroupId ? (
          <CBBStandingsList league={league} />
        ) : (
          <ConferenceStandingsList
            conferences={conferences}
            loading={conferencesLoading}
            error={conferencesError}
            league={league}
          />
        )
      ) : null}
    </View>
  );

  const statsPage = (
    <View key="stats" style={styles.contentArea}>
      {hasVisitedTab("stats") ? (
        <CollegeSeasonLeadersList
          loading={leadersLoading}
          error={leadersError}
          categories={categories}
          league={league}
        />
      ) : null}
    </View>
  );

  const bracketPage = (
    <View key="bracket" style={styles.contentArea}>
      {hasVisitedTab("bracket") ? (
        <TournamentTreeBracket league={league} season={currentSeason} />
      ) : null}
    </View>
  );

  const awardsPage = (
    <View key="awards" style={styles.contentArea}>
      {hasVisitedTab("awards") ? <AwardSeasons league={league} /> : null}
    </View>
  );

  const forumPage = (
    <View key="forum" style={styles.contentArea}>
      {hasVisitedTab("forum") ? <ForumFeed league={league} /> : null}
    </View>
  );

  const pagerPages = [
    scoresPage,
    newsPage,
    standingsPage,
    statsPage,
    bracketPage,
    awardsPage,
    forumPage,
  ];

  /* ------------------------------------------------------------------------ */
  /*                                  Render                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <MainScrollTabBar
        tabs={tabs}
        selected={selectedTab}
        onTabPress={handleTabPress}
        isDark={isDark}
        scrollProgress={scrollProgress}
      />

      <View style={styles.container}>
        <PagerView
          key={league}
          ref={pagerRef}
          style={styles.container}
          initialPage={tabToIndex(selectedTab)}
          onPageScroll={handlePageScroll}
          onPageSelected={(event) =>
            handlePageChange(event.nativeEvent.position)
          }
        >
          {pagerPages}
        </PagerView>
      </View>

      <CalendarModal
        visible={showCalendarModal}
        selectedDate={dayjs(selectedDate).format("YYYY-MM-DD")}
        onClose={() => setShowCalendarModal(false)}
        onSelectDate={(dateString) => {
          const nextDate = dayjs(dateString, "YYYY-MM-DD")
            .startOf("day")
            .toDate();

          setSelectedDate(nextDate);
          setShowCalendarModal(false);
        }}
        markedDates={markedDates}
      />

      <ConferenceListModal
        ref={conferenceModalRef}
        selectedConference={selectedConference}
        onSelect={setSelectedConference}
        onOpen={() => setIsConferenceModalOpen(true)}
        onClose={() => setIsConferenceModalOpen(false)}
        league={league}
      />
    </>
  );
}
