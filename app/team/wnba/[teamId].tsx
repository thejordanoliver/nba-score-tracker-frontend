import { CustomHeader } from "@/components/CustomHeader";
import ForumFeed from "@/components/Forum/ForumFeed";
import GamesList from "@/components/Sports/Basketball/Games/GamesList";
import Roster from "@/components/Sports/Basketball/Team/Roster";
import RosterStats from "@/components/Sports/Basketball/Team/RosterStats";
import TeamInfoModal from "@/components/Sports/Basketball/Team/TeamInfoModal";
import { Colors } from "@/constants/styles";
import { useBasketballTeamGames } from "@/hooks/BasketballHooks/useBasketballTeamGames";
import { useTeamStats } from "@/hooks/BasketballHooks/useTeamStats";
import useRoster from "@/hooks/LeagueHooks/useRoster";
import { useRosterStats } from "@/hooks/NBAHooks/useRosterStats";
import useTeamDetails from "@/hooks/useTeams";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import MonthSelector from "components/League/MonthSelector";
import { StandingsList } from "components/League/Standings/StandingsList";
import NewsList from "components/News/NewsList";
import MainScrollTabBar from "components/TabBars/MainTabScrollBar";
import { getWNBATeam, getWNBATeamLogo } from "constants/teamsWNBA";
import { useFavoriteTeamsContext } from "contexts/FavoriteTeamsContext";
import { useNotifications } from "contexts/NotificationContext";
import { usePreferences } from "contexts/PreferencesContext";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useTeamTabs } from "hooks/LeagueHooks/useLeagueTabs";
import { useLeaguesNews } from "hooks/NewsHooks/useLeaguesNews";
import { usePagerTabScrollProgress } from "hooks/usePagerTabScrollProgress";
import { useLayoutEffect, useRef, useState } from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";
import { teamDetailStyles } from "styles/TeamStyles/TeamDetailsStyles";
import { getWNBASeason } from "utils/dateUtils";

export default function TeamDetailScreen() {
  const league = "wnba";
  const { toggleNotifications, isNotified } = useNotifications();
  const currentSeason = getWNBASeason();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = teamDetailStyles;
  const navigation = useNavigation();
  const { teamId } = useLocalSearchParams();
  const { toggleFavorite, isFavorite } = useFavoriteTeamsContext();
  const teamIdStr = Array.isArray(teamId) ? teamId[0] : teamId;
  const teamIdNum = Number.parseInt(teamIdStr ?? "", 10);
  const team = getWNBATeam(teamIdNum);
  const teamColor = team?.color ?? Colors.midTone;
  const espnId = team?.espnId ?? 0;
  const teamLogo = getWNBATeamLogo(teamIdNum, true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [standingsYear, setStandingsYear] = useState(currentSeason.toString());
  const { tabs, selectedTab, setSelectedTab } = useTeamTabs(league);
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

  const { teamDetails } = useTeamDetails(league, teamIdNum);

  const {
    articles,
    loading: newsLoading,
    error: newsError,
    refreshing: refreshingNews,
    refresh: refreshNews,
  } = useLeaguesNews(league, 10);

  const {
    teamRoster,
    refreshingStats,
    loading: rosterStatsLoading,
    error: rosterStatsError,
    refetch,
  } = useRosterStats(teamIdNum, league);

  const {
    teamStats,
    loading: teamStatsLoading,
    error: teamStatsError,
  } = useTeamStats({
    teamId: espnId,
    league,
  });

  const {
    players,
    loading: playersLoading,
    error: playersError,
  } = useRoster(teamIdNum, league);

  const favorited = team ? isFavorite(league, team.id) : false;

  const {
    games,
    months,
    loading: gamesLoading,
    refreshing: gamesRefreshing,
    error: gamesError,
    refresh: refreshTeamGames,
    selectedMonthKey,
    selectMonth,
    firstSeasonGame,
    showCountdown,
  } = useBasketballTeamGames("wnba", teamIdNum, currentSeason);

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      if (selectedTab === "schedule") {
        await refreshTeamGames();
      }

      if (selectedTab === "news") {
        await refreshNews();
      }

      if (selectedTab === "stats") {
        await refetch();
      }
    } finally {
      setRefreshing(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader
          teamId={teamIdNum}
          logo={teamLogo}
          teamColor={teamColor}
          onBack={goBack}
          isTeamScreen
          isFavorite={favorited}
          onToggleFavorite={() => team && toggleFavorite(league, teamIdNum)}
          onToggleNotifications={() =>
            void toggleNotifications(league, teamIdNum)
          }
          isNotified={isNotified(league, teamIdNum)}
          onOpenInfo={() => setModalVisible(true)}
          league={league}
        />
      ),
    });
  }, [
    navigation,
    team,
    teamLogo,
    teamColor,
    favorited,
    toggleFavorite,
    teamIdNum,
    toggleNotifications,
    isNotified,
    league,
  ]);

  if (!team) {
    return (
      <View style={styles.loadContainer}>
        <CustomActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MainScrollTabBar
        tabs={tabs}
        selected={selectedTab}
        onTabPress={handleTabPress}
        isDark={isDark}
        scrollProgress={scrollProgress}
      />

      <PagerView
        ref={pagerRef}
        style={styles.contentArea}
        initialPage={tabToIndex(selectedTab)}
        onPageScroll={handlePageScroll}
        onPageSelected={(event) => handlePageChange(event.nativeEvent.position)}
      >
        <View key="schedule" style={styles.contentArea}>
          <MonthSelector
            months={months}
            selected={selectedMonthKey}
            onSelect={selectMonth}
            loading={gamesLoading}
          />

          <GamesList
            games={games}
            error={gamesError}
            loading={gamesLoading}
            refreshing={gamesRefreshing || refreshing}
            onRefresh={handleRefresh}
            showCountdown={showCountdown}
            countdownGame={firstSeasonGame}
            scrollEnabled={true}
            showHeaders={true}
          />
        </View>

        <View key="news" style={styles.contentArea}>
          <NewsList
            items={articles}
            loading={newsLoading}
            error={newsError}
            refreshing={refreshingNews}
            onRefresh={refreshNews}
            isDark={isDark}
          />
        </View>

        <View key="roster" style={styles.contentArea}>
          <Roster
            players={players}
            loading={playersLoading}
            error={playersError}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            league={league}
          />
        </View>

        <View key="stats" style={styles.contentArea}>
          <RosterStats
            rosterStats={teamRoster}
            teamId={teamIdNum}
            teamStats={teamStats}
            loading={rosterStatsLoading || teamStatsLoading}
            error={rosterStatsError || teamStatsError}
            refreshing={refreshingStats}
            onRefresh={refetch}
            league={league}
          />
        </View>

        <View key="standings" style={styles.contentArea}>
          <StandingsList
            year={standingsYear}
            onYearChange={setStandingsYear}
            league={league}
          />
        </View>

        <View key="forum" style={styles.contentArea}>
          <ForumFeed teamId={teamIdStr} league={league} />
        </View>
      </PagerView>

      <TeamInfoModal
        teamDetails={teamDetails}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        teamId={teamIdNum}
        teamLogo={teamLogo}
        league={league}
      />
    </View>
  );
}
