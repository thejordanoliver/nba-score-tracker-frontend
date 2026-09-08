import { resolveCBBConferenceselection } from "@/constants/cbbConferences";
import {
  cfbConferences,
  resolveCFBConferenceSelection,
} from "@/constants/cfbConferences";
import { cbbTeams, getCBBTeam } from "@/constants/teamsCBB";
import { getWCBBTeam, wcbbTeams } from "@/constants/teamsWCBB";
import { resolveWCBBConferenceselection } from "@/constants/wcbbConferences";
import { HeaderTitle } from "@react-navigation/elements";
import { Colors, Fonts } from "constants/styles";
import { getNBATeam, teams as nbaTeams } from "constants/teams";
import { cbTeams } from "constants/teamsCB";
import { cfbTeams, getCFBTeam } from "constants/teamsCFB";
import { getMLBTeam, mlbTeams } from "constants/teamsMLB";
import { getNFLTeam, nflTeams } from "constants/teamsNFL";
import { getNHLTeam, nhlTeams } from "constants/teamsNHL";
import { sbTeams } from "constants/teamsSB";
import { getWNBATeam, wnbaTeams } from "constants/teamsWNBA";
import { usePreferences } from "contexts/PreferencesContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  customHeaderStyles,

} from "../../styles/CustomHeaderStyles";
import { ConferenceBackground } from "./ConferenceBackground";
import { GameHeader } from "./GameHeader";
import { HeaderLeftActions } from "./HeaderLeftActions";
import { HeaderRightActions } from "./HeaderRightActions";
import { HomeHeader } from "./HomeHeader";
import { LeagueHeader } from "./LeagueHeader";
import { MessageThreadHeader } from "./MessageThreadHeader";
import { resolveRacingLeague } from "./racingConfig";
import { TeamBackground } from "./TeamBackground";
import type { CustomHeaderProps, HeaderTeamLike } from "./types";
import { EditFavoritesHeader } from "./EditFavoritesHeader";

const isConferenceSelectorTab = (tabName?: string) =>
  tabName === "College Football" ||
  tabName === "Men's College Basketball" ||
  tabName === "Women's College Basketball";

export function CustomHeader({
  title,
  tabName,
  onLogout,
  onSettings,
  onEdit,
  onMessages,
  onCreateMessage,
  onBack,
  onOpenLeagueModal,
  onHomeTabPress,
  onEditTabPress,
  homeScrollProgress,
  onToggleLayout,
  isGrid,
  teamColor,
  isTeamScreen = false,
  onSearchToggle,
  onNotificationsCenter,
  unreadNotificationCount,
  onOpenThemesSettings,
  onAddWidget,
  onToggleWidgetEditing,
  isWidgetEditing = false,
  teamId,
  teamCode,
  homeTeamCode,
  awayTeamCode,
  homeTeamId,
  awayTeamId,
  homeLogo,
  awayLogo,
  homeColor,
  awayColor,
  isFavorite,
  showFavoriteAction = false,
  favoritePending = false,
  notificationPending = false,
  isNotified,
  selectedConferenceName,
  onToggleFavorite,
  onToggleNotifications,
  isPlayerScreen,
  showBackButton = true,
  isEvent = false,
  isNeutralSite = false,
  modalVisible = false,
  onOpenInfo,
  league = "Leagues",
  racingLeague,
  logo,
  messageAvatar,
  messageUsername,
  messageFullName,
  messageIsOnline,
  messageIsVerified,
  homeSelectedTab = "scores",
  editFavoritesSelectedTab = "teams",
}: CustomHeaderProps) {
  const { resolvedColorScheme } = usePreferences();
  const { width } = useWindowDimensions();
  const isDark = resolvedColorScheme === "dark";
  const insets = useSafeAreaInsets();
  const styles = customHeaderStyles(isDark, width);

  const [profileMenuVisible, setProfileMenuVisible] = useState(false);

  const toggleProfileMenu = useCallback(() => {
    setProfileMenuVisible((current) => !current);
  }, []);

  const closeProfileMenu = useCallback(() => {
    setProfileMenuVisible(false);
  }, []);

  const handleProfileMessages = useCallback(() => {
    closeProfileMenu();
    onMessages?.();
  }, [closeProfileMenu, onMessages]);

  const handleProfileSettings = useCallback(() => {
    closeProfileMenu();
    onSettings?.();
  }, [closeProfileMenu, onSettings]);

  const handleEditProfile = useCallback(() => {
    closeProfileMenu();
    onEdit?.();
  }, [closeProfileMenu, onEdit]);

  const handleProfileLogout = useCallback(() => {
    closeProfileMenu();
    onLogout?.();
  }, [closeProfileMenu, onLogout]);

  useEffect(() => {
    if (tabName !== "Profile") {
      setProfileMenuVisible(false);
    }
  }, [tabName]);

  const selectedConference = useMemo(() => {
    if (!selectedConferenceName) {
      return null;
    }

    if (tabName === "College Football") {
      return resolveCFBConferenceSelection(selectedConferenceName) ?? null;
    }

    if (tabName === "Men's College Basketball") {
      return resolveCBBConferenceselection(selectedConferenceName) ?? null;
    }
    if (tabName === "Women's College Basketball") {
      return resolveWCBBConferenceselection(selectedConferenceName) ?? null;
    }

    return (
      cfbConferences.find(
        (conference) =>
          conference.uid !== "top25" &&
          (conference.shortName === selectedConferenceName ||
            conference.name === selectedConferenceName ||
            String(conference.groupId) === String(selectedConferenceName)),
      ) ?? null
    );
  }, [selectedConferenceName, tabName]);

  const conferenceLogo = selectedConference?.logoLight ?? null;

  const primaryColor = selectedConference?.color
    ? selectedConference.color
    : isDark
      ? Colors.black
      : Colors.white;

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: modalVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [modalVisible, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const selectedTeam = useMemo<HeaderTeamLike | null>(() => {
    if (!teamCode) {
      return null;
    }

    switch (league) {
      case "WNBA":
        return getWNBATeam(teamId ?? 0) as HeaderTeamLike;

      case "NFL":
        return getNFLTeam(teamId ?? 0) as HeaderTeamLike;

      case "CFB":
        return getCFBTeam(teamId ?? 0) as HeaderTeamLike;

      case "CBB":
        return getCBBTeam(teamId ?? 0) as HeaderTeamLike;

      case "WCBB":
        return getWCBBTeam(teamId ?? 0) as HeaderTeamLike;

      case "MLB":
        return getMLBTeam(teamId ?? 0) as HeaderTeamLike;

      case "NHL":
        return getNHLTeam(teamId ?? 0) as HeaderTeamLike;

      case "NBA":
      default:
        return getNBATeam(teamId ?? 0) as HeaderTeamLike;
    }
  }, [league, teamCode, teamId]);

  const teamsForLeague = useMemo<HeaderTeamLike[]>(() => {
    switch (league) {
      case "NFL":
        return nflTeams as HeaderTeamLike[];

      case "CFB":
        return cfbTeams as HeaderTeamLike[];

      case "CBB":
        return cbbTeams as HeaderTeamLike[];

      case "WCBB":
        return wcbbTeams as HeaderTeamLike[];

      case "MLB":
        return mlbTeams as HeaderTeamLike[];

      case "CB":
        return cbTeams as HeaderTeamLike[];

      case "SB":
        return sbTeams as HeaderTeamLike[];

      case "NHL":
        return nhlTeams as HeaderTeamLike[];

      case "WNBA":
        return wnbaTeams as HeaderTeamLike[];

      case "NBA":
      default:
        return nbaTeams as HeaderTeamLike[];
    }
  }, [league]);

  const homeTeam = useMemo<HeaderTeamLike>(() => {
    const team = teamsForLeague.find(
      (currentTeam) => String(currentTeam.id) === String(homeTeamId),
    );

    return (
      team ?? {
        id: homeTeamId,
        code: homeTeamCode ?? "HOM",
        color: Colors.lightGray,
      }
    );
  }, [homeTeamCode, homeTeamId, teamsForLeague]);

  const awayTeam = useMemo<HeaderTeamLike>(() => {
    const team = teamsForLeague.find(
      (currentTeam) => String(currentTeam.id) === String(awayTeamId),
    );

    return (
      team ?? {
        id: awayTeamId,
        code: awayTeamCode ?? "AWY",
        color: Colors.midTone,
      }
    );
  }, [awayTeamCode, awayTeamId, teamsForLeague]);

  const resolvedRacingLeague = useMemo(
    () => resolveRacingLeague(racingLeague, tabName, league),
    [league, racingLeague, tabName],
  );

  const isRacingHeader = Boolean(isEvent && resolvedRacingLeague);

  const textStyle: TextStyle = {
    fontFamily: Fonts.REGULAR,
    fontSize: 20,
    color: isDark ? Colors.white : Colors.black,
    textAlign: "center",
  };

  const containerStyle: ViewStyle = {
    width: width,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  };

  const headerIconColor =
    tabName === "Game" ||
    isRacingHeader ||
    selectedConference ||
    isTeamScreen ||
    isPlayerScreen
      ? Colors.white
      : isDark
        ? Colors.white
        : Colors.black;

  const isMessagesListScreen = tabName === "Messages" || title === "Messages";

  const shouldRenderGameHeader = tabName === "Game" || isRacingHeader;

  return (
    <View
      style={{
        paddingTop: insets.top,
        height: 56 + insets.top,
        zIndex: tabName === "Profile" ? 50 : 1,
        overflow: "visible",
      }}
    >
      {isConferenceSelectorTab(tabName) ? (
        <ConferenceBackground
          insets={insets}
          isDark={isDark}
          selectedTeam={selectedConference}
          logo={conferenceLogo}
          conferenceColor={primaryColor}
          isConferenceScreen
        />
      ) : (
        <TeamBackground
          insets={insets}
          isDark={isDark}
          selectedTeam={selectedTeam}
          logo={logo}
          teamColor={teamColor}
          isTeamScreen={isTeamScreen}
          isPlayerScreen={isPlayerScreen}
        />
      )}

      <View
        style={[
          containerStyle,
          {
            zIndex: 2,
            overflow: "visible",
          },
        ]}
      >
        <HeaderLeftActions
          tabName={tabName}
          showBackButton={showBackButton}
          onBack={onBack}
          onAddWidget={onAddWidget}
          onToggleWidgetEditing={onToggleWidgetEditing}
          isWidgetEditing={isWidgetEditing}
          onProfileMessages={onMessages ? handleProfileMessages : undefined}
          isDark={isDark}
          headerIconColor={headerIconColor}
        />

        {shouldRenderGameHeader ? (
          <GameHeader
            tabName={tabName}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeCode={homeTeamCode}
            awayCode={awayTeamCode}
            homeLogo={homeLogo}
            awayLogo={awayLogo}
            homeColor={homeColor}
            awayColor={awayColor}
            isEvent={isEvent}
            isNeutralSite={isNeutralSite}
            racingLeague={resolvedRacingLeague}
            eventTitle={title}
            eventLogo={logo ?? homeLogo}
            isDark={false}
          />
        ) : isConferenceSelectorTab(tabName) ? (
          <LeagueHeader
            selectedConference={selectedConference}
            selectedConferenceName={selectedConferenceName}
            tabName={tabName}
            onOpenLeagueModal={onOpenLeagueModal}
            rotate={rotate}
            isDark={isDark}
          />
        ) : tabName === "Message" ? (
          <MessageThreadHeader
            avatar={messageAvatar}
            username={messageUsername || title}
            fullName={messageFullName}
            isOnline={messageIsOnline}
            isVerified={messageIsVerified}
            isDark={isDark}
          />
        ) : tabName === "Home" ? (
          <HomeHeader
            isDark={isDark}
            selectedTab={homeSelectedTab}
            onTabPress={onHomeTabPress ?? (() => undefined)}
            scrollProgress={homeScrollProgress}
          />
        ) : tabName === "Edit Favorites" ? (
          <EditFavoritesHeader
            isDark={isDark}
            selectedTab={editFavoritesSelectedTab}
            onTabPress={onEditTabPress ?? (() => undefined)}
            scrollProgress={homeScrollProgress}
          />
        ) : (
          <View style={styles.defaultHeaderTitleContainer}>
            <HeaderTitle style={textStyle}>
              {title || tabName || ""}
            </HeaderTitle>
          </View>
        )}

        <HeaderRightActions
          isTeamScreen={isTeamScreen}
          isPlayerScreen={isPlayerScreen}
          showFavoriteAction={showFavoriteAction}
          favoritePending={favoritePending}
          notificationPending={notificationPending}
          favoriteIconColor={headerIconColor}
          onToggleFavorite={onToggleFavorite}
          onToggleNotifications={onToggleNotifications}
          onOpenInfo={onOpenInfo}
          isFavorite={isFavorite}
          isNotified={isNotified}
          tabName={tabName}
          isDark={isDark}
          profileMenuVisible={profileMenuVisible}
          onToggleProfileMenu={toggleProfileMenu}
          onProfileSettings={handleProfileSettings}
          onEditProfile={handleEditProfile}
          onProfileLogout={handleProfileLogout}
          onSearchToggle={onSearchToggle}
          onNotificationsCenter={onNotificationsCenter}
          unreadNotificationCount={unreadNotificationCount}
          onOpenThemesSettings={onOpenThemesSettings}
          isMessagesListScreen={isMessagesListScreen}
          onCreateMessage={onCreateMessage}
          onToggleLayout={onToggleLayout}
          isGrid={isGrid}
        />
      </View>
    </View>
  );
}
