import MMAChampionsList from "@/components/Sports/MMA/Champions/MMAChampionsList";
import EventSelector, {
  getDefaultUFCEventIndex,
} from "@/components/Sports/MMA/EventSelector";
import { useLeagueCalendar } from "@/hooks/LeagueHooks/useLeagueCalendar";
import { useLeagueFavoriteHeader } from "@/hooks/UserHooks/useLeagueFavoriteHeader";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";
import { CustomHeader } from "../../components/CustomHeader";
import ForumFeed from "../../components/Forum/ForumFeed";
import NewsList from "../../components/News/NewsList";
import GamesList from "../../components/Sports/MMA/Games/GamesList";
import MainScrollTabBar from "../../components/TabBars/MainTabScrollBar";
import { usePreferences } from "../../contexts/PreferencesContext";
import { useLeagueTabs } from "../../hooks/LeagueHooks/useLeagueTabs";
import { useMMAEvents } from "../../hooks/MMAHooks/useMMAEvents";
import { useLeaguesNews } from "../../hooks/NewsHooks/useLeaguesNews";
import { LeagueScreenStyles } from "../../styles/LeagueStyles/LeagueStyles";

/* -------------------------------------------------------------------------- */
/*                                 Main Route                                 */
/* -------------------------------------------------------------------------- */

export default function MMALeagueScreen() {
  const params = useLocalSearchParams<{
    league?: string | string[];
    leagueLabel?: string;
  }>();

  const league = params.league;
  const isUFC = league === "ufc";

  if (isUFC) return <UFCLeagueScreen />;

  return <UFCLeagueScreen />;
}

function UFCLeagueScreen() {
  const league = "ufc";
  const favoriteHeaderProps = useLeagueFavoriteHeader(league);
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = LeagueScreenStyles(isDark);
  const navigation = useNavigation();

  const pagerRef = useRef<PagerView>(null);

  // null means "the user has not selected an event yet"
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(
    null,
  );

  const { tabs, selectedTab, setSelectedTab, hasVisitedTab } =
    useLeagueTabs(league);
  const { calendar } = useLeagueCalendar(league, league);

  const sortedCalendar = useMemo(() => {
    return [...(calendar ?? [])].sort((a, b) => {
      const aDate = new Date(a.startDate).getTime();
      const bDate = new Date(b.startDate).getTime();

      return aDate - bDate;
    });
  }, [calendar]);

  const defaultEventIndex = useMemo(() => {
    return getDefaultUFCEventIndex(sortedCalendar);
  }, [sortedCalendar]);

  const safeSelectedEventIndex = useMemo(() => {
    if (!sortedCalendar.length) return 0;

    const rawIndex = selectedEventIndex ?? defaultEventIndex;

    return Math.min(Math.max(rawIndex, 0), sortedCalendar.length - 1);
  }, [selectedEventIndex, defaultEventIndex, sortedCalendar.length]);

  const selectedEvent = sortedCalendar[safeSelectedEventIndex] ?? null;
  const selectedEventDate = selectedEvent?.startDate ?? null;

  const {
    games: mmaGames,
    loading,
    refreshing: refreshingGames,
    refreshGames,
    error,
  } = useMMAEvents({
    league: "ufc",
    date: selectedEventDate,
    enabled: Boolean(selectedEventDate),
  });

  const {
    articles,
    loading: newsLoading,
    refreshing: refreshingNews,
    error: newsError,
    refresh: refreshNews,
  } = useLeaguesNews(league, 10, { enabled: hasVisitedTab("news") });

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
  }, [favoriteHeaderProps, navigation, league]);

  return (
    <>
      <MainScrollTabBar
        tabs={tabs}
        selected={selectedTab}
        onTabPress={(tab) => {
          setSelectedTab(tab);

          const index = tabs.indexOf(tab);

          if (index >= 0) {
            pagerRef.current?.setPage(index);
          }
        }}
        isDark={isDark}
      />

      <View style={styles.container}>
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={(e) => {
            const index = e.nativeEvent.position;
            const nextTab = tabs[index];

            if (nextTab) {
              setSelectedTab(nextTab);
            }
          }}
        >
          <View key="fights" style={styles.contentArea}>
            <EventSelector
              events={sortedCalendar}
              loading={!sortedCalendar.length}
              selectedEventIndex={safeSelectedEventIndex}
              onSelectEvent={setSelectedEventIndex}
              isDark={isDark}
            />

            <GamesList
              games={mmaGames}
              loading={loading}
              error={error}
              refreshing={refreshingGames}
              onRefresh={refreshGames}
            />
          </View>

          <View key="news" style={styles.contentArea}>
            {hasVisitedTab("news") ? <NewsList
              items={articles}
              loading={newsLoading}
              error={newsError}
              refreshing={refreshingNews}
              onRefresh={refreshNews}
              isDark={isDark}
            /> : null}
          </View>

          <View key="champions" style={styles.contentArea}>
            {hasVisitedTab("champions") ? <MMAChampionsList /> : null}
          </View>

          <View key="forum" style={styles.contentArea}>
            {hasVisitedTab("forum") ? <ForumFeed league={league} /> : null}
          </View>
        </PagerView>
      </View>
    </>
  );
}
