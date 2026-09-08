import { CustomHeader } from "@/components/CustomHeader";
import ForumFeed from "@/components/Forum/ForumFeed";
import GamesList from "@/components/Sports/Baseball/Games/GamesList";
import RosterStats from "@/components/Sports/Baseball/Team/RosterStats";
import TeamInfoModal from "@/components/Sports/Basketball/Team/TeamInfoModal";
import { Colors } from "@/constants/styles";
import { useRosterStats } from "@/hooks/BaseballHooks/useRosterStats";
import { useTeamStats } from "@/hooks/BaseballHooks/useTeamStats";
import useRoster from "@/hooks/LeagueHooks/useRoster";
import useTeamDetails from "@/hooks/useTeams";
import { useNavigation } from "@react-navigation/native";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import MonthSelector from "components/League/MonthSelector";
import { StandingsList } from "components/League/Standings/StandingsList";
import NewsList from "components/News/NewsList";
import Roster from "components/Sports/Baseball/Team/Roster";
import MainScrollTabBar from "components/TabBars/MainTabScrollBar";
import { getMLBTeam, getMLBTeamLogo } from "constants/teamsMLB";
import { useFavoriteTeamsContext } from "contexts/FavoriteTeamsContext";
import { useNotifications } from "contexts/NotificationContext";
import { usePreferences } from "contexts/PreferencesContext";
import { useLocalSearchParams } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useBaseballTeamGames } from "hooks/BaseballHooks/useBaseballTeamGames";
import { useTeamTabs } from "hooks/LeagueHooks/useLeagueTabs";
import { useLeaguesNews } from "hooks/NewsHooks/useLeaguesNews";
import { usePagerTabScrollProgress } from "hooks/usePagerTabScrollProgress";
import { useLayoutEffect, useRef, useState } from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";
import { getMLBSeason } from "utils/dateUtils";
import { teamDetailStyles } from "../../../styles/TeamStyles/TeamDetailsStyles";

export default function TeamDetailScreen() {
  const league = "mlb";
  const { toggleNotifications, isNotified } = useNotifications();
  const navigation = useNavigation();
  const currentSeason = getMLBSeason();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = teamDetailStyles;
  const { toggleFavorite, isFavorite } = useFavoriteTeamsContext();
  const { teamId } = useLocalSearchParams();
  const teamIdStr = Array.isArray(teamId) ? teamId[0] : teamId;
  const teamIdNum = Number(teamIdStr);
  const team = getMLBTeam(teamIdNum);
  const espnId = team?.espnId ?? 0;
  const teamLogo = getMLBTeamLogo(teamIdNum, true);
  const teamColor = team?.color ?? Colors.midTone;
  const teamSecondaryColor = team?.secondaryColor ?? Colors.midTone;
  const teamName = team?.name;
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [standingsYear, setStandingsYear] = useState(currentSeason.toString());
  const { tabs, selectedTab, setSelectedTab } = useTeamTabs(league);
  const pagerRef = useRef<PagerView>(null);
  const { scrollProgress, handlePageScroll, syncPageScrollProgress } =
    usePagerTabScrollProgress();
  const favorited = team ? isFavorite(league, team.id) : false;

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
  } = useBaseballTeamGames("mlb", teamIdNum, currentSeason);

  const tabToIndex = (tab: (typeof tabs)[number]) => tabs.indexOf(tab);
  const indexToTab = (index: number) => tabs[index];

  const handleTabPress = (tab: (typeof tabs)[number]) => {
    setSelectedTab(tab);
    pagerRef.current?.setPage(tabToIndex(tab));
  };

  const handlePageChange = (index: number) => {
    syncPageScrollProgress(index);
    const nextTab = indexToTab(index);

    if (nextTab) {
      setSelectedTab(nextTab);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      if (selectedTab === "schedule") {
        await refreshTeamGames();
      }

      if (selectedTab === "news") {
        await refreshNews();
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
          isTeamScreen={true}
          isFavorite={favorited}
          onToggleFavorite={() => team && toggleFavorite(league, team.id)}
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
    favorited,
    navigation,
    team,
    teamIdNum,
    toggleNotifications,
    isNotified,
    league,
    teamLogo,
    teamColor,
    toggleFavorite,
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
        style={{ flex: 1 }}
        initialPage={tabToIndex(selectedTab)}
        onPageScroll={handlePageScroll}
        onPageSelected={(event) => handlePageChange(event.nativeEvent.position)}
      >
        {/* SCHEDULE */}
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
            showHeaders={true}
            showCountdown={showCountdown}
            countdownGame={firstSeasonGame}
            scrollEnabled={true}
            teamLogo={teamLogo}
            teamColor={teamColor}
            teamSecondaryColor={teamSecondaryColor}
            teamName={teamName}
          />
        </View>

        {/* NEWS */}
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

        {/* ROSTER */}
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

        {/* STATS */}
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

        {/* STANDINGS */}
        <View key="standings" style={styles.contentArea}>
          <StandingsList
            year={standingsYear}
            onYearChange={setStandingsYear}
            league={league}
          />
        </View>

        {/* FORUM */}
        <View key="forum" style={styles.contentArea}>
          <ForumFeed teamId={teamIdStr ?? ""} league={league} />
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
