import { CustomHeader } from "@/components/CustomHeader";
import {
  BoxScore,
  GameHeader,
  GameLiveChatOverlay,
  GameLocation,
  GameTeamStats,
  HeadCoaches,
  LastPlay,
  LineScore,
  TeamInjuries,
} from "@/components/Sports/Basketball/GameDetails";
import FanPrediction from "@/components/Sports/Basketball/GameDetails/FanPrediction/FanPrediction";
import { Highlights } from "@/components/Sports/Basketball/GameDetails/Highlights/Highlights";
import LastFiveGames from "@/components/Sports/Basketball/GameDetails/LastFiveGames";
import Leaders from "@/components/Sports/Basketball/GameDetails/Leaders";
import MatchupPredictor from "@/components/Sports/Basketball/GameDetails/MatchupPredictor";
import Officials from "@/components/Sports/Basketball/GameDetails/Officials";
import PlayersInFoulTrouble from "@/components/Sports/Basketball/GameDetails/PlayersInFoulTrouble";
import PlayersOnCourt from "@/components/Sports/Basketball/GameDetails/PlayersOnCourt";
import ShotChart from "@/components/Sports/Basketball/GameDetails/ShotChart";
import { getNBATeam, getNBATeamLogo } from "@/constants/teams";
import { getCBBTeam, getCBBTeamLogo } from "@/constants/teamsCBB";
import { getWCBBTeam, getWCBBTeamLogo } from "@/constants/teamsWCBB";
import { getWNBATeam, getWNBATeamLogo } from "@/constants/teamsWNBA";
import { useLastFiveGames } from "@/hooks/BaseballHooks/useLastFiveGames";
import { useBasketballGameDetails } from "@/hooks/BasketballHooks/useBasketballGameDetails";
import { useNotifications } from "@/contexts/NotificationContext";
import { useLiveVotes } from "@/hooks/useLiveVotes";
import useTeamDetails from "@/hooks/useTeams";
import { useVenue } from "@/hooks/useVenue";
import { useWeather } from "@/hooks/useWeather";
import type { BasketballGameCardProps } from "@/types/basketball/basketball";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import { Colors } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useScrollFade } from "hooks/useScrollFade";
import React, { useLayoutEffect, useMemo } from "react";
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
  formatPeriod,
  formatVenueAddress,
  getBroadcastDisplay,
} from "utils/games";

type RouteParams = {
  game?: string | string[];
  data?: string | string[];
  leagueId?: string | string[];
  league?: string | string[];
};

type BasketballGame = BasketballGameCardProps["game"];

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

function parseGameParam(value?: string | string[]): BasketballGame | undefined {
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
    return JSON.parse(decodedValue) as BasketballGame;
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
  props: Partial<BasketballGameCardProps> = {},
) {
  const styles = gameDetailsScreenStyles;
  const params = useLocalSearchParams<RouteParams>();
  const { resolvedColorScheme } = usePreferences();
  const {
    isGameNotified,
    openGameNotificationSettings,
  } = useNotifications();
  const isDark = resolvedColorScheme === "dark";
  const navigation = useNavigation();
  const { opacityAnim, handleScrollStart, handleScrollEnd } = useScrollFade();

  const routeGame = useMemo(() => {
    return (
      props.game ?? parseGameParam(params.data) ?? parseGameParam(params.game)
    );
  }, [params.data, params.game, props.game]);

  const LEAGUE = (
    routeGame?.league?.code ?? getRouteLeague(params.league) ?? "nba"
  ).toLowerCase();
  const isWNBA = LEAGUE === "wnba";
  const isWCBB = LEAGUE === "wcbb";
  const isCBB = LEAGUE === "cbb";

  const rawGameId = routeGame?.id ?? getRouteGameId(params.game);
  const parsedGameId = Number(rawGameId);
  const gameId = Number.isFinite(parsedGameId) ? parsedGameId : 0;
  const { details, score } = useBasketballGameDetails(LEAGUE, gameId);

  const game = useMemo(() => {
    if (routeGame) return routeGame;
    if (!score) return undefined;

    const toGameTeam = (team: typeof score.home) => ({
      ...team,
      id: Number(team.id),
      espnId: Number(team.id),
      name: team.fullName ?? team.name,
      shortName: team.shortName,
      city: "",
      state: "",
      logo: "",
      primaryColor: "",
      secondaryColor: "",
      nbaAPIID: 0,
      rank: team.rank ?? 0,
    });

    return {
      id: Number(score.gameId),
      date: score.date ?? "",
      league: { code: LEAGUE },
      home: toGameTeam(score.home),
      away: toGameTeam(score.away),
      attendance: 0,
    };
  }, [LEAGUE, routeGame, score]);

  const gameDateObj = game?.date ? new Date(game.date) : null;
  const gameDate = safeDate(game?.date);
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);
  const holidayLabel = getHolidayLabel(gameDate);
  const showGameChat = shouldShowGameChat(gameDateObj);
  const home = game?.home;
  const away = game?.away;
  const homeId = home?.id ?? 0;
  const awayId = away?.id ?? 0;

  const homeTeam = isWNBA
    ? getWNBATeam(homeId)
    : isWCBB
      ? getWCBBTeam(homeId)
      : isCBB
        ? getCBBTeam(homeId)
        : getNBATeam(homeId);
  const awayTeam = isWNBA
    ? getWNBATeam(awayId)
    : isWCBB
      ? getWCBBTeam(awayId)
      : isCBB
        ? getCBBTeam(awayId)
        : getNBATeam(awayId);

  const homeCode = homeTeam?.code ?? home?.code ?? "";
  const awayCode = awayTeam?.code ?? away?.code ?? "";
  const homeEspnId = homeTeam?.espnId ?? 0;
  const awayEspnId = awayTeam?.espnId ?? 0;
  const awayName =
    awayTeam?.fullName ?? awayTeam?.name ?? away?.name ?? "Away Team";
  const homeName =
    homeTeam?.fullName ?? homeTeam?.name ?? home?.name ?? "Home Team";

  const { teamDetails: homeTeamDetails } = useTeamDetails(LEAGUE, homeId);
  const { teamDetails: awayTeamDetails } = useTeamDetails(LEAGUE, awayId);
  const { votes: liveVotes, castVote: castLiveVote } = useLiveVotes(gameId);

  const homeCoach = homeTeamDetails?.coach;
  const awayCoach = awayTeamDetails?.coach;

  const awayColor =
    awayTeam?.color ??
    away?.primaryColor ??
    away?.secondaryColor ??
    Colors.midTone;

  const homeColor =
    homeTeam?.color ??
    home?.primaryColor ??
    home?.secondaryColor ??
    Colors.midTone;

  const homeLogo = isCBB
    ? getCBBTeamLogo(homeId, isDark)
    : isWCBB
      ? getWCBBTeamLogo(homeId, isDark)
      : isWNBA
        ? getWNBATeamLogo(homeId, isDark)
        : getNBATeamLogo(homeId, isDark);

  const awayLogo = isCBB
    ? getCBBTeamLogo(awayId, isDark)
    : isWCBB
      ? getWCBBTeamLogo(awayId, isDark)
      : isWNBA
        ? getWNBATeamLogo(awayId, isDark)
        : getNBATeamLogo(awayId, isDark);

  const homeHeaderLogo = isCBB
    ? getCBBTeamLogo(homeId, true)
    : isWCBB
      ? getWCBBTeamLogo(homeId, true)
      : isWNBA
        ? getWNBATeamLogo(homeId, true)
        : getNBATeamLogo(homeId, true);
  const awayHeaderLogo = isCBB
    ? getCBBTeamLogo(awayId, true)
    : isWCBB
      ? getWCBBTeamLogo(awayId, true)
      : isWNBA
        ? getWNBATeamLogo(awayId, true)
        : getNBATeamLogo(awayId, true);

  const homeLastGames = useLastFiveGames(homeId, "basketball", LEAGUE).games;
  const awayLastGames = useLastFiveGames(awayId, "basketball", LEAGUE).games;
  const isLoading = !score || !details || !homeLastGames || !awayLastGames;
  const homeScore = score?.home.score ?? 0;
  const awayScore = score?.away.score ?? 0;
  const homeWins = score?.home.winner ?? false;
  const awayWins = score?.away.winner ?? false;
  const homeRecord = score?.home?.record ?? "0-0";
  const awayRecord = score?.away?.record ?? "0-0";
  const homeTimeouts = score?.home.timeouts ?? 0;
  const awayTimeouts = score?.away.timeouts ?? 0;
  const gameStatusDescription = score?.status.gameStatusDescription ?? "";
  const state = score?.status.state ?? null;
  const gameNotificationsEnabled = isGameNotified(
    "basketball",
    LEAGUE,
    gameId,
    homeId,
    awayId,
  );
  const gameStatusDetail = score?.status.gameStatusDetail ?? "";
  const period = formatPeriod({
    period: score?.status.period ?? 0,
    isCBB: isCBB || isWCBB,
  });
  const clock = score?.status.displayClock ?? "0:00";
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isSuspended = gameStatusDescription === "Suspended";
  const isForfeited = gameStatusDescription === "Forfeit";
  const dontShowDetails =
    isDelayed || isCanceled || isPostponed || isSuspended || isForfeited;
  const homeRank = home?.rank ?? null;
  const awayRank = away?.rank ?? null;
  const plays = score?.plays ?? [];
  const highlights = details?.highlights ?? [];
  const injuries = details?.injuries ?? [];
  const officials = details?.officials ?? [];
  const leaders = score?.leaders ?? [];
  const playerStats = score?.playerStats ?? [];
  const teamStats = score?.teamStats ?? [];
  const lastPlay = score?.lastPlay;
  const headline = details?.headline ?? holidayLabel ?? "";
  const broadcast = getBroadcastDisplay(details?.broadcasts);
  const homeChance = Number(details?.predictor?.homeTeam?.gameProjection) || 0;
  const awayChance = Number(details?.predictor?.awayTeam?.gameProjection) || 0;
  const foulTrouble = score?.foulTrouble ?? [];
  const homeBonus = score?.home?.fouls?.bonusState ?? null;
  const awayBonus = score?.away?.fouls?.bonusState ?? null;
  const neutralSite = details?.neutralSite;
  const venueId = Number(details?.venue?.id);
  const { venue } = useVenue({ sport: "basketball", id: venueId });
  const { weather } = useWeather({
    lat: Number(venue?.latitude),
    lon: Number(venue?.longitude),
    location: venue?.city,
    date: gameDateObj,
  });
  const baseVenue = details?.venue;
  const baseVenueAddress = formatVenueAddress(baseVenue?.address);
  const venueName = venue?.name ?? baseVenue?.fullName;
  const venueAddress = venue?.address ?? baseVenueAddress;
  const venueCapacity = venue?.capacity ?? null;
  const venueImage = venue?.image ?? baseVenue?.images?.[0]?.href;
  const venueAttendance = details?.attendance ?? game?.attendance ?? null;
  const venueCity = venue?.city ?? baseVenue?.address?.city;
  const venueRegion =
    venue?.state ?? baseVenue?.address?.state ?? baseVenue?.address?.country;
  const venueLocation =
    venueCity && venueRegion
      ? `${venueCity}, ${venueRegion}`
      : (venueCity ?? "");

  const lineScore = score?.periodScores?.length
    ? {
        home: score.periodScores.map((p) => p.home.toString()),
        away: score.periodScores.map((p) => p.away.toString()),
      }
    : undefined;

  useLayoutEffect(() => {
    if (isLoading || !home || !away) {
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
          isNeutralSite={!!neutralSite}
          league={LEAGUE}
          isNotified={gameNotificationsEnabled}
          onToggleNotifications={() =>
            openGameNotificationSettings(
              "basketball",
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
    awayCode,
    awayColor,
    awayHeaderLogo,
    away,
    awayId,
    homeCode,
    homeColor,
    homeHeaderLogo,
    home,
    homeId,
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

  if (!game || !homeTeam || !awayTeam) return <View />;

  /* ---------------- Render ---------------- */

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.container}
        onScrollBeginDrag={handleScrollStart}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        stickyHeaderIndices={[0]}
      >
        <GameHeader
          // Game details
          headline={headline}
          league={LEAGUE}
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
          awayRecord={awayRecord}
          awayWins={awayWins}
          awayBonusState={awayBonus}
          awayTimeouts={awayTimeouts}
          // Home team
          homeId={homeId}
          homeName={homeCode}
          homeLogo={homeLogo}
          homeRank={homeRank}
          homeScore={homeScore}
          homeRecord={homeRecord}
          homeWins={homeWins}
          homeBonusState={homeBonus}
          homeTimeouts={homeTimeouts}
          // Live game state
          clock={clock}
          period={period}
          // Status
          gameStatusDescription={gameStatusDescription}
          gameStatusDetail={gameStatusDetail}
        />

        <View style={styles.innerContainer}>
          {!dontShowDetails && (
            <>
              <LastPlay
                lastPlay={lastPlay}
                homeId={homeId}
                awayId={awayId}
                state={state}
                league={LEAGUE}
              />

              <LineScore
                linescore={lineScore}
                awayCode={awayCode}
                homeCode={homeCode}
                league={LEAGUE}
                isDark={isDark}
                state={state}
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

              <Leaders
                leaders={leaders}
                homeId={homeId}
                homeLogo={homeLogo}
                awayId={awayId}
                awayLogo={awayLogo}
                state={state}
                isDark={isDark}
              />

              <PlayersOnCourt
                playerStats={playerStats}
                homeId={Number(homeEspnId)}
                awayId={Number(awayEspnId)}
                homeCode={homeCode}
                awayCode={awayCode}
                homeLogo={homeLogo}
                awayLogo={awayLogo}
                league={LEAGUE}
                isDark={isDark}
                state={state}
              />

              <PlayersInFoulTrouble
                foulTrouble={foulTrouble}
                homeId={homeId}
                homeCode={homeCode}
                homeLogo={homeLogo}
                awayId={awayId}
                awayCode={awayCode}
                awayLogo={awayLogo}
                league={LEAGUE}
                isDark={isDark}
                state={state}
              />

              <BoxScore
                playerStats={playerStats}
                homeId={homeId}
                homeName={homeName}
                homeLogo={homeLogo}
                awayId={awayId}
                awayName={awayName}
                awayLogo={awayLogo}
                isDark={isDark}
                league={LEAGUE}
                state={state}
              />

              <ShotChart
                plays={plays}
                homeEspnId={homeEspnId}
                awayEspnId={awayEspnId}
                homeId={homeId}
                awayId={awayId}
                homeColor={homeColor}
                awayColor={awayColor}
                homeLogo={homeLogo}
                awayLogo={awayLogo}
                league={LEAGUE}
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

              <TeamInjuries
                injuries={injuries}
                homeId={homeId}
                awayId={awayId}
                homeCode={homeCode}
                awayCode={awayCode}
                homeLogo={homeLogo}
                awayLogo={awayLogo}
                isDark={isDark}
                league={LEAGUE}
                state={state}
              />

              <Highlights highlights={highlights} isDark={isDark} />

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
                isDark={isDark}
              />
            </>
          )}
        </View>
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
