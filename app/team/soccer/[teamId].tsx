import { CustomHeader } from "@/components/CustomHeader";
import { Colors } from "@/constants/styles";
import { getSOCCTeam, getSOCCTeamLogo } from "@/constants/teamsSOCC";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import NewsList from "components/News/NewsList";
import MainScrollTabBar from "components/TabBars/MainTabScrollBar";
import { useNotifications } from "contexts/NotificationContext";
import { usePreferences } from "contexts/PreferencesContext";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";

import Roster from "@/components/Sports/Baseball/Team/Roster";
import GamesList from "@/components/Sports/Soccer/Games/GamesList";
import useRoster from "@/hooks/LeagueHooks/useRoster";
import { useSoccerTeamGames } from "@/hooks/SoccerHooks/useSoccerTeamGames";
import { useTeamTabs } from "hooks/LeagueHooks/useLeagueTabs";
import { useLeaguesNews } from "hooks/NewsHooks/useLeaguesNews";
import { usePagerTabScrollProgress } from "hooks/usePagerTabScrollProgress";
import { useLayoutEffect, useRef, useState } from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";
import { getMLBSeason } from "utils/dateUtils";
import { teamDetailStyles } from "../../../styles/TeamStyles/TeamDetailsStyles";

export default function TeamDetailScreen() {
  const navigation = useNavigation();
  const currentSeason = getMLBSeason();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = teamDetailStyles;
  const { teamId, league } = useLocalSearchParams<{
    teamId: string;
    league: string;
  }>();
  const { toggleNotifications, isNotified } = useNotifications();

  const teamIdNum = Number(teamId);
  const team = getSOCCTeam(teamId);
  const teamLogo = getSOCCTeamLogo(teamId, true);
  const teamColor = team?.color ?? Colors.midTone;
  const [refreshing, setRefreshing] = useState(false);
  const { tabs, selectedTab, setSelectedTab } = useTeamTabs("SOCC");
  const pagerRef = useRef<PagerView>(null);
  const { scrollProgress, handlePageScroll, syncPageScrollProgress } =
    usePagerTabScrollProgress();

  const {
    articles,
    loading: newsLoading,
    error: newsError,
    refreshing: refreshingNews,
    refresh: refreshNews,
  } = useLeaguesNews(league, 10);

  const {
    games: teamGames,
    loading: gamesLoading,
    error: gamesError,
    refreshGames: refreshTeamGames,
  } = useSoccerTeamGames(teamIdNum, league, currentSeason);

  const {
    players,
    loading: playersLoading,
    error: playersError,
  } = useRoster(teamIdNum, "SOCC");

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
          onToggleNotifications={() =>
            void toggleNotifications(league, teamIdNum)
          }
          isNotified={isNotified(league, teamIdNum)}
          league={league}
        />
      ),
    });
  }, [
    navigation,
    team,
    teamIdNum,
    teamLogo,
    teamColor,
    league,
    toggleNotifications,
    isNotified,
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
          <GamesList
            games={teamGames}
            error={gamesError}
            loading={gamesLoading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            showHeaders={true}
            scrollEnabled={true}
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
            league={"soccer"}
          />
        </View>
      </PagerView>
    </View>
  );
}
