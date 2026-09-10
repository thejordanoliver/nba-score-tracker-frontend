import ForumFeed from "@/components/Forum/ForumFeed";
import AwardSeasons from "@/components/League/Awards/AwardSeasons";
import ConferenceListModal, {
  ConferenceListModalRef,
} from "@/components/League/ConferenceListModal";
import Draft, { getDefaultDraftYear } from "@/components/League/Draft/Draft";
import RecruitsList from "@/components/League/Recruiting/RecruitsList";
import { StandingsList } from "@/components/League/Standings/StandingsList";
import WeekSelector, {
  FootballWeekGroup,
} from "@/components/League/WeekSelector";
import NewsList from "@/components/News/NewsList";
import { ConferenceStandingsList } from "@/components/Sports/Basketball/Standings/ConferenceStandingsList";
import GamesList from "@/components/Sports/Football/Games/GamesList";
import { CFPBracket } from "@/components/Sports/Football/Playoffs/CFBPlayoffs/CFPBracket";
import { NFLPlayoffBracket } from "@/components/Sports/Football/Playoffs/NFLPlayoffs/NFLPlayoffBracket";
import SeasonLeadersList from "@/components/Sports/Football/SeasonLeaderList";
import { CFBStandingsList } from "@/components/Sports/Football/Standings/CFBStandingsList";
import MainScrollTabBar from "@/components/TabBars/MainTabScrollBar";
import { getCFBConferenceSelectionName } from "@/constants/cfbConferences";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useConferenceStandings } from "@/hooks/BasketballHooks/useConferenceStandings";
import { useCFBPlayoffs } from "@/hooks/FootballHooks/useCFBPlayoffs";
import { useFootballGames } from "@/hooks/FootballHooks/useFootballGames";
import { useNFLPlayoffs } from "@/hooks/FootballHooks/useNFLPlayoffs";
import { useSeasonLeaders } from "@/hooks/FootballHooks/useSeasonLeaders";
import { useLeagueCalendar } from "@/hooks/LeagueHooks/useLeagueCalendar";
import { useLeagueTabs } from "@/hooks/LeagueHooks/useLeagueTabs";
import { useLeaguesNews } from "@/hooks/NewsHooks/useLeaguesNews";
import { usePagerTabScrollProgress } from "@/hooks/usePagerTabScrollProgress";
import { useLeagueFavoriteHeader } from "@/hooks/UserHooks/useLeagueFavoriteHeader";
import { LeagueScreenStyles } from "@/styles/LeagueStyles/LeagueStyles";
import { getFootballSeason, getRecruitYear } from "@/utils/dateUtils";
import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useLocalSearchParams } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";
import { CustomHeader } from "../../components/CustomHeader";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

type SelectedConference = number | string | null;

function getSeasonTypeFromStage(stage?: string): number {
  const normalizedStage = String(stage ?? "").toLowerCase();

  if (normalizedStage.includes("preseason")) {
    return 1;
  }

  if (
    normalizedStage.includes("postseason") ||
    normalizedStage.includes("playoff")
  ) {
    return 3;
  }

  return 2;
}

function getSeasonSlugFromStage(stage?: string): string {
  const normalizedStage = String(stage ?? "").toLowerCase();

  if (normalizedStage.includes("preseason")) {
    return "pre-season";
  }

  if (
    normalizedStage.includes("postseason") ||
    normalizedStage.includes("playoff")
  ) {
    return "post-season";
  }

  return "regular-season";
}

/* -------------------------------------------------------------------------- */
/*                                 Main Route                                 */
/* -------------------------------------------------------------------------- */

export default function FootballLeagueScreen() {
  const params = useLocalSearchParams<{
    league?: string | string[];
    leagueLabel?: string;
  }>();

  const league = params.league;
  const isCFB = league === "cfb";
  const isUFL = league === "ufl";

  if (isCFB) {
    return <CFBLeagueScreen />;
  }
  if (isUFL) {
    return <UFLLeagueScreen />;
  }

  return <NFLLeagueScreen />;
}

/* ========================================================================== */
/*                                    NFL                                     */
/* ========================================================================== */

function NFLLeagueScreen() {
  const league = "nfl";
  const favoriteHeaderProps = useLeagueFavoriteHeader(league);
  const currentSeason = getFootballSeason();
  const navigation = useNavigation();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = LeagueScreenStyles(isDark);
  const [screenRefreshing, setScreenRefreshing] = useState(false);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(
    null,
  );
  const [standingsYear, setStandingsYear] = useState(currentSeason.toString());
  const [draftYear, setDraftYear] = useState(() =>
    getDefaultDraftYear("nfl").toString(),
  );
  const [draftTeam, setDraftTeam] = useState("all");
  const [draftRound, setDraftRound] = useState("all");

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

  const { calendar } = useLeagueCalendar(league, "football");

  const weekGroups = useMemo<FootballWeekGroup[]>(() => {
    if (!calendar?.length) {
      return [];
    }

    return calendar
      .filter((week) => week.stage !== "Off Season")
      .map((week, index) => {
        const seasonType = getSeasonTypeFromStage(week.stage);
        const seasonSlug = getSeasonSlugFromStage(week.stage);

        return {
          key: `${seasonSlug}-week-${week.weekNumber}-${index}`,
          label: week.label || `Week ${week.weekNumber}`,
          season: {
            year: currentSeason,
            type: seasonType,
            slug: seasonSlug,
          },
          week: {
            number: week.weekNumber,
          },
          count: 0,
          games: [],
        };
      });
  }, [calendar, currentSeason]);

  const activeWeekIndex = useMemo(() => {
    if (!calendar?.length || !weekGroups.length) {
      return null;
    }

    const now = dayjs();

    const activeCalendarWeek = calendar.find(
      (week) =>
        week.stage !== "Off Season" &&
        now.isBetween(dayjs(week.startDate), dayjs(week.endDate), null, "[]"),
    );

    if (!activeCalendarWeek) {
      return null;
    }

    const activeSeasonType = getSeasonTypeFromStage(activeCalendarWeek.stage);

    const index = weekGroups.findIndex(
      (group) =>
        group.week.number === activeCalendarWeek.weekNumber &&
        group.season.type === activeSeasonType,
    );

    return index >= 0 ? index : null;
  }, [calendar, weekGroups]);

  const resolvedWeekIndex = selectedWeekIndex ?? activeWeekIndex;

  const selectedWeek =
    resolvedWeekIndex != null ? weekGroups[resolvedWeekIndex] : undefined;

  const selectedWeekNumber = selectedWeek?.week.number;
  const selectedSeasonType = selectedWeek?.season.type;

  const {
    games: selectedWeekGames,
    loading: gamesLoading,
    refreshing: gamesRefreshing,
    refreshGames,
  } = useFootballGames({
    league,
    season: currentSeason,
    week: selectedWeekNumber,
    seasontype: selectedSeasonType,
    enabled: selectedWeekNumber != null && selectedSeasonType != null,
  });

  const {
    articles,
    loading: newsLoading,
    refreshing: refreshingNews,
    error: newsError,
    refresh: refreshNews,
  } = useLeaguesNews(league, 10, { enabled: hasVisitedTab("news") });

  const {
    playoffData: nflPlayoffData,
    playoffLoading: nflPlayoffLoading,
    playoffError: nflPlayoffError,
    onRefresh: refreshNFLPlayoffs,
    playoffRefreshing: nflPlayoffRefreshing,
  } = useNFLPlayoffs(currentSeason, { enabled: hasVisitedTab("playoffs") });

  const {
    categories,
    loading: leadersLoading,
    error: leadersError,
  } = useSeasonLeaders(currentSeason, league, {
    enabled: hasVisitedTab("stats"),
  });

  useEffect(() => {
    setSelectedWeekIndex((currentIndex) => {
      if (currentIndex == null) {
        return null;
      }

      return currentIndex < weekGroups.length ? currentIndex : null;
    });
  }, [weekGroups.length]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader
          tabName={league.toUpperCase()}
          onBack={goBack}
          {...favoriteHeaderProps}
        />
      ),
    });
  }, [favoriteHeaderProps, league, navigation]);

  const handleRefresh = useCallback(async () => {
    setScreenRefreshing(true);

    try {
      await refreshGames();
    } catch (error) {
      console.warn(`Failed to refresh ${league} games:`, error);
    } finally {
      setScreenRefreshing(false);
    }
  }, [league, refreshGames]);

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
          <View key="scores" style={styles.contentArea}>
            <WeekSelector
              groups={weekGroups}
              loading={gamesLoading}
              selectedWeekIndex={resolvedWeekIndex}
              onSelectWeek={setSelectedWeekIndex}
              isDark={isDark}
            />

            <GamesList
              games={selectedWeekGames}
              loading={gamesLoading}
              refreshing={screenRefreshing || gamesRefreshing}
              onRefresh={handleRefresh}
              showHeaders={false}
              isNFL={true}
            />
          </View>
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

          <View key="standings">
            {hasVisitedTab("standings") ? (
              <StandingsList
                year={standingsYear}
                onYearChange={setStandingsYear}
                league={league}
              />
            ) : null}
          </View>

          <View key="playoffs" style={styles.contentArea}>
            {hasVisitedTab("playoffs") ? (
              <NFLPlayoffBracket
                bracket={nflPlayoffData}
                loading={nflPlayoffLoading}
                error={nflPlayoffError}
                refreshing={nflPlayoffRefreshing}
                onRefresh={refreshNFLPlayoffs}
              />
            ) : null}
          </View>

          <View key="stats" style={styles.contentArea}>
            {hasVisitedTab("stats") ? (
              <SeasonLeadersList
                loading={leadersLoading}
                error={leadersError}
                categories={categories}
                league={league}
              />
            ) : null}
          </View>

          <View key="draft" style={styles.contentArea}>
            {hasVisitedTab("draft") ? (
              <Draft
                year={draftYear}
                team={draftTeam}
                round={draftRound}
                onYearChange={setDraftYear}
                onTeamChange={setDraftTeam}
                onRoundChange={setDraftRound}
                league="nfl"
              />
            ) : null}
          </View>

          <View key="awards" style={styles.contentArea}>
            {hasVisitedTab("awards") ? <AwardSeasons league="NFL" /> : null}
          </View>

          <View key="forum" style={styles.contentArea}>
            {hasVisitedTab("forum") ? <ForumFeed league={league} /> : null}
          </View>
        </PagerView>
      </View>
    </>
  );
}

/* ========================================================================== */
/*                                    CFB                                     */
/* ========================================================================== */

function CFBLeagueScreen() {
  const league = "cfb";
  const favoriteHeaderProps = useLeagueFavoriteHeader(league);
  const currentSeason = getFootballSeason();
  const currentRecruitCycle = String(getRecruitYear());
  const navigation = useNavigation();
  const conferenceModalRef = useRef<ConferenceListModalRef>(null);
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = LeagueScreenStyles(isDark);
  const [screenRefreshing, setScreenRefreshing] = useState(false);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(
    null,
  );
  const [selectedConference, setSelectedConference] =
    useState<SelectedConference>("top25");
  const [isConferenceModalOpen, setIsConferenceModalOpen] = useState(false);
  const [recruitView, setRecruitView] = useState<"players" | "teams">(
    "players",
  );
  const [recruitYear, setRecruitYear] = useState(() => currentRecruitCycle);
  const [recruitTeam, setRecruitTeam] = useState("all");
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

  const { calendar, loading: calendarLoading } = useLeagueCalendar(
    league,
    "football",
  );

  const selectedConferenceName = useMemo(() => {
    return getCFBConferenceSelectionName(selectedConference);
  }, [selectedConference]);

  const selectedConferenceGroupId = useMemo(() => {
    if (
      selectedConference == null ||
      selectedConference === "top25" ||
      Number(selectedConference) === 80
    ) {
      return null;
    }

    const conferenceId = Number(selectedConference);

    return Number.isFinite(conferenceId) ? conferenceId : null;
  }, [selectedConference]);

  const weekGroups = useMemo<FootballWeekGroup[]>(() => {
    if (!calendar?.length) {
      return [];
    }

    return calendar
      .filter((week) => week.stage !== "Off Season")
      .map((week, index) => {
        const seasonType = getSeasonTypeFromStage(week.stage);
        const seasonSlug = getSeasonSlugFromStage(week.stage);

        return {
          key: `${seasonSlug}-week-${week.weekNumber}-${index}`,
          label: week.label || `Week ${week.weekNumber}`,
          season: {
            year: currentSeason,
            type: seasonType,
            slug: seasonSlug,
          },
          week: {
            number: week.weekNumber,
          },
          count: 0,
          games: [],
        };
      });
  }, [calendar, currentSeason]);

  const activeWeekIndex = useMemo(() => {
    if (!calendar?.length || !weekGroups.length) {
      return null;
    }

    const now = dayjs();

    const activeCalendarWeek = calendar.find(
      (week) =>
        week.stage !== "Off Season" &&
        now.isBetween(dayjs(week.startDate), dayjs(week.endDate), null, "[]"),
    );

    if (!activeCalendarWeek) {
      return null;
    }

    const activeSeasonType = getSeasonTypeFromStage(activeCalendarWeek.stage);

    const index = weekGroups.findIndex(
      (group) =>
        group.week.number === activeCalendarWeek.weekNumber &&
        group.season.type === activeSeasonType,
    );

    return index >= 0 ? index : null;
  }, [calendar, weekGroups]);

  const resolvedWeekIndex = selectedWeekIndex ?? activeWeekIndex;

  const selectedWeek =
    resolvedWeekIndex != null ? weekGroups[resolvedWeekIndex] : undefined;

  const selectedWeekNumber = selectedWeek?.week.number;
  const selectedSeasonType = selectedWeek?.season.type;

  const {
    games: selectedWeekGames,
    loading: gamesLoading,
    refreshing: gamesRefreshing,
    refreshGames,
  } = useFootballGames({
    league: league,
    season: currentSeason,
    week: selectedWeekNumber,
    seasontype: selectedSeasonType,
    conferenceId:
      selectedConference !== "top25" && selectedConference != null
        ? selectedConference
        : undefined,
    enabled: selectedWeekNumber != null && selectedSeasonType != null,
  });

  const {
    articles,
    loading: newsLoading,
    refreshing: refreshingNews,
    error: newsError,
    refresh: refreshNews,
  } = useLeaguesNews(league, 10, { enabled: hasVisitedTab("news") });

  const {
    games: cfpGames,
    loading: cfpLoading,
    refreshing: cfpRefreshing,
    error: cfpError,
    refetch: refetchCFPPlayoffs,
  } = useCFBPlayoffs({
    season: currentSeason,
    enabled: hasVisitedTab("playoffs"),
  });

  const {
    categories,
    loading: leadersLoading,
    error: leadersError,
  } = useSeasonLeaders(currentSeason, league, {
    enabled: hasVisitedTab("stats"),
  });

  const { conferences, conferencesLoading, conferencesError } =
    useConferenceStandings(league, selectedConferenceGroupId, {
      enabled: hasVisitedTab("standings"),
    });

  useEffect(() => {
    setSelectedWeekIndex((currentIndex) => {
      if (currentIndex == null) {
        return null;
      }

      return currentIndex < weekGroups.length ? currentIndex : null;
    });
  }, [weekGroups.length]);

  useEffect(() => {
    setSelectedWeekIndex(null);

    setSelectedConference("top25");

    setIsConferenceModalOpen(false);
  }, [currentSeason, league]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader
          tabName={"College Football"}
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

  const handleRefresh = useCallback(async () => {
    setScreenRefreshing(true);

    try {
      await refreshGames();
    } catch (error) {
      console.warn(`Failed to refresh ${league} games:`, error);
    } finally {
      setScreenRefreshing(false);
    }
  }, [league, refreshGames]);

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
          <View key="scores" style={styles.contentArea}>
            <WeekSelector
              groups={weekGroups}
              loading={gamesLoading || calendarLoading}
              selectedWeekIndex={resolvedWeekIndex}
              onSelectWeek={setSelectedWeekIndex}
              isDark={isDark}
            />

            <GamesList
              games={selectedWeekGames}
              loading={gamesLoading || calendarLoading}
              refreshing={screenRefreshing || gamesRefreshing}
              onRefresh={handleRefresh}
              showHeaders={false}
              isCFB={true}
            />
          </View>
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
          <View key="standings" style={styles.contentArea}>
            {hasVisitedTab("standings") ? (
              !selectedConferenceGroupId ? (
                <CFBStandingsList />
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

          <View key="stats" style={styles.contentArea}>
            {hasVisitedTab("stats") ? (
              <SeasonLeadersList
                loading={leadersLoading}
                error={leadersError}
                categories={categories}
                league={league}
              />
            ) : null}
          </View>

          <View key="playoffs" style={styles.contentArea}>
            {hasVisitedTab("playoffs") ? (
              <CFPBracket
                games={cfpGames}
                loading={cfpLoading}
                refreshing={cfpRefreshing}
                error={cfpError}
                onRetry={() => {
                  void refetchCFPPlayoffs();
                }}
              />
            ) : null}
          </View>

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

          <View key="awards" style={styles.contentArea}>
            {hasVisitedTab("awards") ? <AwardSeasons league={league} /> : null}
          </View>

          <View key="forum" style={styles.contentArea}>
            {hasVisitedTab("forum") ? <ForumFeed league={league} /> : null}
          </View>
        </PagerView>
      </View>

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

  /* ------------------------------------------------------------------------ */
  /*                                  Render                                  */
  /* ------------------------------------------------------------------------ */
}

/* ========================================================================== */
/*                                    UFL                                     */
/* ========================================================================== */

function UFLLeagueScreen() {
  const league = "ufl";
  const favoriteHeaderProps = useLeagueFavoriteHeader(league);
  const currentSeason = getFootballSeason();
  const navigation = useNavigation();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = LeagueScreenStyles(isDark);
  const [screenRefreshing, setScreenRefreshing] = useState(false);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
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

  const { calendar } = useLeagueCalendar(league, "football");

  const weekGroups = useMemo<FootballWeekGroup[]>(() => {
    if (!calendar?.length) {
      return [];
    }

    return calendar
      .filter((week) => week.stage !== "Off Season")
      .map((week, index) => {
        const seasonType = getSeasonTypeFromStage(week.stage);
        const seasonSlug = getSeasonSlugFromStage(week.stage);

        return {
          key: `${seasonSlug}-week-${week.weekNumber}-${index}`,
          label: week.label || `Week ${week.weekNumber}`,
          season: {
            year: currentSeason,
            type: seasonType,
            slug: seasonSlug,
          },
          week: {
            number: week.weekNumber,
          },
          count: 0,
          games: [],
        };
      });
  }, [calendar, currentSeason]);

  const selectedWeek = weekGroups[selectedWeekIndex];
  const selectedWeekNumber = selectedWeek?.week.number ?? 1;
  const selectedSeasonType = selectedWeek?.season.type ?? 2;

  const {
    games: selectedWeekGames,
    loading: gamesLoading,
    refreshing: gamesRefreshing,
    refreshGames,
  } = useFootballGames({
    league: league,
    season: currentSeason,
    week: selectedWeekNumber,
    seasontype: selectedSeasonType,
  });

  const {
    articles,
    loading: newsLoading,
    refreshing: refreshingNews,
    error: newsError,
    refresh: refreshNews,
  } = useLeaguesNews(league, 10, { enabled: hasVisitedTab("news") });

  useEffect(() => {
    if (!weekGroups.length) {
      setSelectedWeekIndex(0);
      return;
    }

    setSelectedWeekIndex((currentIndex) =>
      currentIndex < weekGroups.length ? currentIndex : 0,
    );
  }, [weekGroups.length]);

  useEffect(() => {
    if (!calendar?.length || !weekGroups.length) {
      return;
    }

    const now = dayjs();

    const activeCalendarWeek = calendar.find(
      (week) =>
        week.stage !== "Off Season" &&
        now.isBetween(dayjs(week.startDate), dayjs(week.endDate), null, "[]"),
    );

    if (!activeCalendarWeek) {
      return;
    }

    const activeSeasonType = getSeasonTypeFromStage(activeCalendarWeek.stage);

    const matchingGroupIndex = weekGroups.findIndex(
      (group) =>
        group.week.number === activeCalendarWeek.weekNumber &&
        group.season.type === activeSeasonType,
    );

    if (matchingGroupIndex >= 0) {
      setSelectedWeekIndex(matchingGroupIndex);
    }
  }, [calendar, weekGroups]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader
          tabName={league.toUpperCase()}
          onBack={goBack}
          {...favoriteHeaderProps}
        />
      ),
    });
  }, [favoriteHeaderProps, league, navigation]);

  const handleRefresh = useCallback(async () => {
    setScreenRefreshing(true);

    try {
      await refreshGames();
    } catch (error) {
      console.warn(`Failed to refresh ${league} games:`, error);
    } finally {
      setScreenRefreshing(false);
    }
  }, [league, refreshGames]);

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
          <View key="scores" style={styles.contentArea}>
            <WeekSelector
              groups={weekGroups}
              loading={gamesLoading}
              selectedWeekIndex={selectedWeekIndex}
              onSelectWeek={setSelectedWeekIndex}
              isDark={isDark}
            />

            <GamesList
              games={selectedWeekGames}
              loading={gamesLoading}
              refreshing={screenRefreshing || gamesRefreshing}
              onRefresh={handleRefresh}
              showHeaders={false}
              isNFL={true}
            />
          </View>
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

          <View key="standings" />

          <View key="stats" />

          {/* FORUM */}
          <View key="forum" style={styles.contentArea}>
            {hasVisitedTab("forum") ? <ForumFeed league={league} /> : null}
          </View>
        </PagerView>
      </View>
    </>
  );
}
