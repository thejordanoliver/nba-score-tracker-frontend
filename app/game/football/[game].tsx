import { CustomHeader } from "@/components/CustomHeader";
import Leaders from "@/components/Sports/Football/GameDetails/Leaders";
import PlayByPlay from "@/components/Sports/Football/GameDetails/PlayByPlay/PlayByPlay";
import TeamDrives from "@/components/Sports/Football/GameDetails/TeamDrives";
import TeamScoringSummary from "@/components/Sports/Football/GameDetails/TeamScoringSummary";
import { getCFBTeam, getCFBTeamLogo } from "@/constants/teamsCFB";
import { getUFLTeam, getUFLTeamLogo } from "@/constants/teamsUFL";
import { useNotifications } from "@/contexts/NotificationContext";
import { useLastFiveGames } from "@/hooks/BaseballHooks/useLastFiveGames";
import { useFootballGameDetails } from "@/hooks/FootballHooks/useFootballGameDetails";
import { useLiveVotes } from "@/hooks/useLiveVotes";
import useTeamDetails from "@/hooks/useTeams";
import { useVenue } from "@/hooks/useVenue";
import { FootballGameCardProps } from "@/types/football/football";
import {
  formatPeriod,
  formatVenueAddress,
  getBroadcastDisplay,
} from "@/utils/games";
import { useNavigation } from "@react-navigation/native";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import GameHeader from "components/Sports/Football/GameDetails/GameHeader";
import { getNFLTeam, getNFLTeamLogo } from "constants/teamsNFL";
import { usePreferences } from "contexts/PreferencesContext";
import { useLocalSearchParams } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useScrollFade } from "hooks/useScrollFade";
import { useWeather } from "hooks/useWeather";
import { useLayoutEffect, useMemo } from "react";
import { ScrollView, View } from "react-native";
import { gameDetailsScreenStyles } from "styles/GameDetailStyles/GameDetailsScreenStyles";
import {
  formatDate,
  formatTime,
  getHolidayLabel,
  safeDate,
  shouldShowGameChat,
} from "utils/dateUtils";
import {
  FanPrediction,
  GameLiveChatOverlay,
  GameLocation,
  GameTeamStats,
  HeadCoaches,
  Highlights,
  LastFiveGames,
  LineScore,
  MatchupPredictor,
  Officials,
  TeamInjuries,
} from "../../../components/Sports/Basketball/GameDetails";

type RouteParams = {
  game?: string | string[];
  data?: string | string[];
  leagueId?: string | string[];
  league?: string | string[];
};

type FootballGame = FootballGameCardProps["game"];

function getFirstParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseGameParam(value?: string | string[]): FootballGame | undefined {
  const rawValue = getFirstParam(value);

  if (!rawValue || rawValue === "undefined" || rawValue === "null") {
    return undefined;
  }

  const decodedValue = safeDecode(rawValue).trim();

  // Dynamic route params are often just the game id.
  // Only JSON strings should be parsed into a full game object.
  if (!decodedValue.startsWith("{")) {
    return undefined;
  }

  try {
    return JSON.parse(decodedValue) as FootballGame;
  } catch {
    return undefined;
  }
}

function getRouteGameId(value?: string | string[]) {
  const rawValue = getFirstParam(value);

  if (!rawValue || rawValue === "undefined" || rawValue === "null") {
    return null;
  }

  const decodedValue = safeDecode(rawValue).trim();
  return decodedValue && !decodedValue.startsWith("{") ? decodedValue : null;
}

function getRouteLeague(value?: string | string[]) {
  const league = getFirstParam(value)?.trim().toLowerCase();
  return league && /^[a-z0-9][a-z0-9._-]*$/.test(league) ? league : null;
}

export default function GameDetailsScreen(
  props: Partial<FootballGameCardProps> = {},
) {
  const styles = gameDetailsScreenStyles;
  const params = useLocalSearchParams<RouteParams>();
  const { resolvedColorScheme } = usePreferences();
  const { isGameNotified, openGameNotificationSettings } = useNotifications();
  const isDark = resolvedColorScheme === "dark";
  const navigation = useNavigation();
  const { opacityAnim, handleScrollStart, handleScrollEnd } = useScrollFade();

  const routeGame = useMemo(() => {
    return (
      props.game ?? parseGameParam(params.data) ?? parseGameParam(params.game)
    );
  }, [params.data, params.game, props.game]);

  const LEAGUE = (
    routeGame?.league?.code ??
    getRouteLeague(params.league) ??
    "nfl"
  ).toLowerCase();
  const isCFB = LEAGUE === "cfb";
  const isNFL = LEAGUE === "nfl";

  const rawGameId = routeGame?.id ?? getRouteGameId(params.game);
  const parsedGameId = Number(rawGameId);
  const gameId = Number.isFinite(parsedGameId) ? parsedGameId : 0;
  const { score, details, loading } = useFootballGameDetails(LEAGUE, gameId);

  const game = useMemo(() => {
    if (routeGame) return routeGame;
    if (!score) return undefined;

    return {
      id: Number(score.gameId),
      date: score.date,
      league: { code: LEAGUE },
      home: {
        ...score.home,
        logo: score.home.logo ?? "",
        primaryColor: score.home.color,
        conferenceId: null,
      },
      away: {
        ...score.away,
        logo: score.away.logo ?? "",
        primaryColor: score.away.color,
        conferenceId: null,
      },
      situation: { isRedZone: false },
    };
  }, [LEAGUE, routeGame, score]);

  const gameDateObj = useMemo(() => {
    return game?.date ? new Date(game.date) : null;
  }, [game?.date]);

  const gameDate = safeDate(game?.date);
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);
  const showGameChat = shouldShowGameChat(gameDateObj);
  const holidayLabel = getHolidayLabel(gameDate);
  const home = game?.home;
  const away = game?.away;

  const homeId = home?.id ?? 0;
  const awayId = away?.id ?? 0;

  const homeTeam = isNFL
    ? getNFLTeam(homeId)
    : isCFB
      ? getCFBTeam(homeId)
      : getUFLTeam(homeId);

  const awayTeam = isNFL
    ? getNFLTeam(awayId)
    : isCFB
      ? getCFBTeam(awayId)
      : getUFLTeam(awayId);

  const homeLogo = isNFL
    ? getNFLTeamLogo(homeId, isDark)
    : isCFB
      ? getCFBTeamLogo(homeId, isDark)
      : getUFLTeamLogo(homeId, isDark);
  const awayLogo = isNFL
    ? getNFLTeamLogo(awayId, isDark)
    : isCFB
      ? getCFBTeamLogo(awayId, isDark)
      : getUFLTeamLogo(awayId, isDark);

  const homeHeaderLogo = isNFL
    ? getNFLTeamLogo(homeId, true)
    : isCFB
      ? getCFBTeamLogo(homeId, true)
      : getUFLTeamLogo(homeId, true);
  const awayHeaderLogo = isNFL
    ? getNFLTeamLogo(awayId, true)
    : isCFB
      ? getCFBTeamLogo(awayId, true)
      : getUFLTeamLogo(awayId, true);

  const homeCode = useMemo(
    () => homeTeam?.code ?? home?.code ?? "",
    [home?.code, homeTeam?.code],
  );
  const awayCode = useMemo(
    () => awayTeam?.code ?? away?.code ?? "",
    [away?.code, awayTeam?.code],
  );
  const homeName = useMemo(
    () => homeTeam?.name ?? home?.name ?? "",
    [home?.name, homeTeam?.name],
  );
  const awayName = useMemo(
    () => awayTeam?.name ?? away?.name ?? "",
    [away?.name, awayTeam?.name],
  );

  const awayColor = useMemo(() => awayTeam?.color ?? "", [awayTeam?.color]);
  const homeColor = useMemo(() => homeTeam?.color ?? "", [homeTeam?.color]);

  const { teamDetails: homeTeamDetails } = useTeamDetails(LEAGUE, homeId);
  const { teamDetails: awayTeamDetails } = useTeamDetails(LEAGUE, awayId);
  const { votes: liveVotes, castVote: castLiveVote } = useLiveVotes(gameId);
  const homeLastGames = useLastFiveGames(homeId, "football", LEAGUE).games;
  const awayLastGames = useLastFiveGames(awayId, "football", LEAGUE).games;

  const homeCoach = homeTeamDetails?.coach;
  const awayCoach = awayTeamDetails?.coach;

  const isLoading = loading || !game || !home || !away || !score || !details;

  const state = score?.status.state ?? "pre";
  const gameNotificationsEnabled = isGameNotified(
    "football",
    LEAGUE,
    gameId,
    homeId,
    awayId,
  );

  const gameStatusDescription = score?.status.gameStatusDescription ?? "";
  const gameStatusDetail = score?.status.shortDetail ?? "";
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isSuspended = gameStatusDescription === "Suspended";
  const isForfeited = gameStatusDescription === "Forfeit";
  const dontShowDetails =
    isDelayed || isCanceled || isPostponed || isSuspended || isForfeited;
  const clock = score?.status.displayClock ?? "0:00";
  const period = formatPeriod({ period: score?.status.period });
  const redzone = game?.situation?.isRedZone ?? false;
  const headline = details?.headline ?? holidayLabel;
  const broadcast = getBroadcastDisplay(details?.broadcasts) ?? "";
  const scoringPlays = score?.scoringPlays;
  const lastPlay = score?.lastPlay ?? null;
  const drives = score?.drives;
  const currentDrives = drives?.current ?? [];
  const previousDrives = drives?.previous ?? [];
  const fieldPlay = useMemo(() => {
    const plays = score?.plays ?? [];
    const currentDrives = score?.drives?.current ?? [];
    const previousDrives = score?.drives?.previous ?? [];

    if (lastPlay) {
      return lastPlay;
    }

    if (plays.length > 0) {
      return plays[plays.length - 1];
    }

    for (let index = currentDrives.length - 1; index >= 0; index -= 1) {
      const drivePlays = currentDrives[index]?.plays ?? [];

      if (drivePlays.length > 0) {
        return drivePlays[drivePlays.length - 1];
      }
    }

    for (let index = previousDrives.length - 1; index >= 0; index -= 1) {
      const drivePlays = previousDrives[index]?.plays ?? [];

      if (drivePlays.length > 0) {
        return drivePlays[drivePlays.length - 1];
      }
    }

    return null;
  }, [lastPlay, score?.plays, score?.drives]);

  const downDistance = currentDrives[0]?.end?.downDistanceText;

  const homeHasPossession = score?.home?.possession ?? false;
  const awayHasPossession = score?.away?.possession ?? false;

  const homeTimeouts = score?.home?.timeouts;
  const awayTimeouts = score?.away?.timeouts;
  const homeRecord = score?.home.record;
  const awayRecord = score?.away.record;
  const homeChance = Number(details?.predictor?.homeTeam?.gameProjection) || 0;
  const awayChance = Number(details?.predictor?.awayTeam?.gameProjection) || 0;

  const homeScore = score?.home.score ?? 0;
  const awayScore = score?.away.score ?? 0;
  const homeWins = homeScore > awayScore;
  const awayWins = awayScore > homeScore;
  const isTie = homeScore === awayScore;
  const lineScore = score?.periodScores?.length
    ? {
        home: score.periodScores.map((p) => p.home.toString()),
        away: score.periodScores.map((p) => p.away.toString()),
      }
    : undefined;

  const homeRank = score?.home?.rank;
  const awayRank = score?.away?.rank;
  const officials = details?.officials ?? [];
  const highlights = details?.highlights;
  const injuries = details?.injuries ?? [];
  const leaders = score?.leaders;
  const teamStats = score?.boxScore?.teams ?? [];
  const neutralSite = details?.neutralSite;
  const venueId = Number(details?.venue?.id);
  const baseVenue = details?.venue;
  const { venue } = useVenue({ sport: "football", id: venueId });
  const { weather } = useWeather({
    lat: Number(venue?.latitude),
    lon: Number(venue?.longitude),
    location: venue?.city,
    date: gameDateObj,
  });

  const baseVenueAddress = formatVenueAddress(baseVenue?.address);
  const venueName = venue?.name ?? baseVenue?.fullName ?? null;
  const venueAddress = venue?.address ?? baseVenueAddress;
  const venueCapacity = venue?.capacity ?? null;
  const venueImage = venue?.image ?? baseVenue?.images?.[0]?.href ?? null;
  const venueAttendance = details?.attendance ?? null;
  const venueSurface = baseVenue?.grass;
  const venueCity = venue?.city ?? baseVenue?.address?.city;
  const venueRegion =
    venue?.state ?? baseVenue?.address?.state ?? baseVenue?.address?.country;
  const venueLocation =
    venueCity && venueRegion
      ? `${venueCity}, ${venueRegion}`
      : (venueCity ?? "");

  useLayoutEffect(() => {
    if (isLoading || !game || !home || !away) {
      navigation.setOptions({
        header: () => null,
      });
      return;
    }

    navigation.setOptions({
      header: () => (
        <CustomHeader
          tabName="Game"
          onBack={goBack}
          homeLogo={homeHeaderLogo}
          awayLogo={awayHeaderLogo}
          homeTeamCode={homeCode}
          awayTeamCode={awayCode}
          homeColor={homeColor}
          awayColor={awayColor}
          isNeutralSite={neutralSite}
          league={LEAGUE}
          isNotified={gameNotificationsEnabled}
          onToggleNotifications={() =>
            openGameNotificationSettings(
              "football",
              LEAGUE,
              gameId,
              homeId,
              awayId,
            )
          }
        />
      ),
    });
  }, [
    LEAGUE,
    away,
    awayId,
    awayCode,
    game,
    awayHeaderLogo,
    homeHeaderLogo,
    home,
    homeId,
    homeCode,
    awayColor,
    homeColor,
    gameId,
    gameNotificationsEnabled,
    isLoading,
    navigation,
    neutralSite,
    openGameNotificationSettings,
  ]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomActivityIndicator />
      </View>
    );
  }

  if (!game) return <View />;

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.container}
        onScrollBeginDrag={handleScrollStart}
        onMomentumScrollEnd={handleScrollEnd}
        stickyHeaderIndices={[0]}
      >
        <GameHeader
          // Game details
          headline={headline}
          league={LEAGUE}
          state={state}
          date={formattedDate}
          time={formattedTime}
          broadcast={broadcast}
          isDark={isDark}
          // Away team
          awayId={awayId}
          awayName={awayCode}
          awayLogo={awayLogo}
          awayRank={awayRank}
          awayScore={awayScore}
          awayWins={awayWins}
          awayRecord={awayRecord}
          awayTimeouts={awayTimeouts}
          awayPossession={awayHasPossession}
          // Home team
          homeId={homeId}
          homeName={homeCode}
          homeLogo={homeLogo}
          homeRank={homeRank}
          homeScore={homeScore}
          homeWins={homeWins}
          homeRecord={homeRecord}
          homeTimeouts={homeTimeouts}
          homePossession={homeHasPossession}
          // Live game state
          clock={clock}
          period={period}
          downDistance={downDistance}
          redzone={redzone}
          isTie={isTie}
          // Status
          gameStatusShortDetail={gameStatusDetail}
          gameStatusDescription={gameStatusDescription}
        />

        {!dontShowDetails && (
          <View style={styles.innerContainer}>
            <LineScore
              linescore={lineScore}
              homeCode={homeCode}
              awayCode={awayCode}
              isDark={isDark}
              state={state}
              league={LEAGUE}
            />

            <FanPrediction
              votes={liveVotes}
              castVote={castLiveVote}
              gameId={gameId}
              awayId={awayId}
              awayCode={awayCode}
              awayLogo={awayLogo}
              awayColor={awayColor}
              homeId={homeId}
              homeCode={homeCode}
              homeLogo={homeLogo}
              homeColor={homeColor}
              state={state}
            />

            <PlayByPlay
              width={420}
              height={130}
              awayCode={awayCode}
              homeCode={homeCode}
              awayName={awayName}
              homeName={homeName}
              awayLogo={awayLogo}
              homeLogo={homeLogo}
              awayTeamId={awayId}
              homeTeamId={homeId}
              awayColor={awayColor}
              homeColor={homeColor}
              drives={drives}
              play={fieldPlay}
              showPlay={Boolean(fieldPlay)}
              isDark={isDark}
              state={state}
              league={LEAGUE}
              neutralSite={neutralSite}
            />

            <MatchupPredictor
              homeId={homeId}
              homeCode={homeCode}
              homeLogo={homeLogo}
              homeHeaderLogo={homeHeaderLogo}
              homeChance={homeChance}
              homeColor={homeColor}
              awayId={awayId}
              awayCode={awayCode}
              awayLogo={awayLogo}
              awayHeaderLogo={awayHeaderLogo}
              awayChance={awayChance}
              awayColor={awayColor}
              size={180}
              isDark={isDark}
              state={state}
            />

            <GameTeamStats
              stats={teamStats}
              awayName={awayCode}
              awayLogo={awayLogo}
              awayColor={awayColor}
              homeName={homeCode}
              homeLogo={homeLogo}
              homeColor={homeColor}
              league={LEAGUE}
              state={state}
              isDark={isDark}
            />

            <Leaders
              leaders={leaders}
              awayId={awayId}
              homeId={homeId}
              awayLogo={awayLogo}
              homeLogo={homeLogo}
              awayCode={awayCode}
              homeCode={homeCode}
              isDark={isDark}
              state={state}
              league={LEAGUE}
            />

            <TeamDrives
              previousDrives={previousDrives}
              currentDrives={currentDrives}
              awayId={awayId}
              homeId={homeId}
              homeCode={homeCode}
              awayCode={awayCode}
              homeLogo={homeLogo}
              awayLogo={awayLogo}
              league={LEAGUE}
              isDark={isDark}
              state={state}
            />

            <TeamScoringSummary
              scoringPlays={scoringPlays}
              homeId={homeId}
              awayId={awayId}
              homeCode={homeCode}
              awayCode={awayCode}
              homeLogo={homeLogo}
              awayLogo={awayLogo}
              isDark={isDark}
              state={state}
              league={LEAGUE}
            />

            <LastFiveGames
              homeId={homeId}
              awayId={awayId}
              homeCode={homeCode}
              awayCode={awayCode}
              homeGames={homeLastGames}
              awayGames={awayLastGames}
              league={LEAGUE}
              state={state}
              isDark={isDark}
            />

            <Highlights highlights={highlights} isDark={isDark} />

            <TeamInjuries
              injuries={injuries}
              homeId={homeId}
              awayId={awayId}
              homeCode={homeCode}
              awayCode={awayCode}
              homeLogo={homeLogo}
              awayLogo={awayLogo}
              isDark={isDark}
              state={state}
              league={LEAGUE}
            />

            <HeadCoaches
              homeCode={homeCode}
              awayCode={awayCode}
              homeCoach={homeCoach}
              awayCoach={awayCoach}
              homeLogo={homeLogo}
              awayLogo={awayLogo}
              isDark={isDark}
              state={state}
            />

            <Officials officials={officials} isDark={isDark} state={state} />

            <GameLocation
              venueImage={venueImage}
              venueName={venueName}
              location={venueLocation}
              address={venueAddress}
              venueCapacity={venueCapacity}
              venueAttendance={venueAttendance}
              weather={weather}
              grass={venueSurface}
              surface={"football"}
              isDark={isDark}
            />
          </View>
        )}
      </ScrollView>

      {!dontShowDetails && showGameChat && (
        <GameLiveChatOverlay
          gameId={String(gameId)}
          opacityAnim={opacityAnim}
          state={state}
        />
      )}
    </>
  );
}
