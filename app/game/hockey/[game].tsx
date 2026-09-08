import { CustomHeader } from "@/components/CustomHeader";
import {
  GameLiveChatOverlay,
  GameLocation,
  GameTeamStats,
  HeadCoaches,
  Highlights,
  LastFiveGames,
  LastPlay,
  LineScore,
  MatchupPredictor,
  TeamInjuries,
} from "@/components/Sports/Basketball/GameDetails";
import FanPrediction from "@/components/Sports/Basketball/GameDetails/FanPrediction/FanPrediction";
import Officials from "@/components/Sports/Basketball/GameDetails/Officials";
import GameHeader from "@/components/Sports/Hockey/GameDetails/GameHeader";
import GameSummary from "@/components/Sports/Hockey/GameDetails/GameSummary";
import ShotChart from "@/components/Sports/Hockey/GameDetails/ShotChart";
import { Colors } from "@/constants/styles";
import { useLastFiveGames } from "@/hooks/BaseballHooks/useLastFiveGames";
import { useHockeyGameDetails } from "@/hooks/HockeyHooks/useHockeyGameDetails";
import { useLiveVotes } from "@/hooks/useLiveVotes";
import useTeamDetails from "@/hooks/useTeams";
import { useVenue } from "@/hooks/useVenue";
import { HockeyGameCardProps } from "@/types/hockey/hockey";
import {
  formatDate,
  formatTime,
  getHolidayLabel,
  safeDate,
  shouldShowGameChat,
} from "@/utils/dateUtils";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import { getNHLTeam, getNHLTeamLogo } from "constants/teamsNHL";
import { usePreferences } from "contexts/PreferencesContext";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useScrollFade } from "hooks/useScrollFade";
import { useWeather } from "hooks/useWeather";
import { useLayoutEffect, useMemo } from "react";
import { ScrollView, View } from "react-native";
import { gameDetailsScreenStyles } from "styles/GameDetailStyles/GameDetailsScreenStyles";
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

type HockeyGame = HockeyGameCardProps["game"];

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

function parseGameParam(value?: string | string[]): HockeyGame | undefined {
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
    return JSON.parse(decodedValue) as HockeyGame;
  } catch {
    return undefined;
  }
}

export default function GameDetailsScreen(
  props: Partial<HockeyGameCardProps> = {},
) {
  const styles = gameDetailsScreenStyles;
  const params = useLocalSearchParams<RouteParams>();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const navigation = useNavigation();
  const { opacityAnim, handleScrollStart, handleScrollEnd } = useScrollFade();

  const game = useMemo(() => {
    return (
      props.game ?? parseGameParam(params.data) ?? parseGameParam(params.game)
    );
  }, [params.data, params.game, props.game]);

  const gameDateObj = useMemo(() => {
    return game?.date ? new Date(game.date) : null;
  }, [game?.date]);

  const gameDate = safeDate(game?.date);
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);
  const holidayLabel = getHolidayLabel(gameDate);
  const showGameChat = shouldShowGameChat(gameDateObj);

  const LEAGUE = game?.league?.code ?? "nhl";
  const gameId = game?.id ?? 0;

  const home = game?.home;
  const away = game?.away;

  const homeId = home?.id ?? 0;
  const awayId = away?.id ?? 0;
  const homeTeam = getNHLTeam(homeId);
  const awayTeam = getNHLTeam(awayId);

  const homeEspnId = homeTeam?.espnId ?? 0;
  const awayEspnId = awayTeam?.espnId ?? 0;

  const homeLogo = getNHLTeamLogo(homeId, isDark);
  const awayLogo = getNHLTeamLogo(awayId, isDark);
  const homeHeaderLogo = getNHLTeamLogo(homeId, true);
  const awayHeaderLogo = getNHLTeamLogo(awayId, true);
  const awayCode = useMemo(() => awayTeam?.code ?? "", [awayTeam?.code]);
  const homeCode = useMemo(() => homeTeam?.code ?? "", [homeTeam?.code]);

  const awayColor = awayTeam?.color ?? Colors.midTone;
  const homeColor = homeTeam?.color ?? Colors.midTone;

  const { teamDetails: homeTeamDetails } = useTeamDetails(LEAGUE, homeId);
  const { teamDetails: awayTeamDetails } = useTeamDetails(LEAGUE, awayId);
  const { votes: liveVotes, castVote: castLiveVote } = useLiveVotes(gameId);
  const homeLastGames = useLastFiveGames(homeId, "hockey", LEAGUE).games;
  const awayLastGames = useLastFiveGames(awayId, "hockey", LEAGUE).games;

  const homeCoach = homeTeamDetails?.coach;
  const awayCoach = awayTeamDetails?.coach;

  const { details, score } = useHockeyGameDetails(LEAGUE, gameId);

  const isLoading = !score || !details || !homeLastGames || !awayLastGames;
  const gameStatusDescription = score?.status?.gameStatusDescription ?? "";
  const gameStatusDetail = score?.status?.gameStatusDetail ?? "";
  const state = score?.status?.state ?? null;
  const plays = score?.plays;
  const lastPlay = score?.lastPlay;
  // const playerStats = score?.playerStats ?? [];
  const teamStats = score?.teamStats ?? [];
  console.log(LEAGUE);
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isSuspended = gameStatusDescription === "Suspended";
  const isForfeited = gameStatusDescription === "Forfeit";
  const dontShowDetails =
    isDelayed || isCanceled || isPostponed || isSuspended || isForfeited;
  const headline = details?.headline ?? holidayLabel;
  const broadcast = getBroadcastDisplay(details?.broadcasts);
  const period = formatPeriod({ period: score?.status.period, isNHL: true });
  const homeChance = Number(details?.predictor?.homeTeam?.gameProjection) || 0;
  const awayChance = Number(details?.predictor?.awayTeam?.gameProjection) || 0;
  const clock = score?.status.displayClock ?? "0:00";
  const homeScore = score?.home?.score ?? 0;
  const awayScore = score?.away?.score ?? 0;
  const homeWins = homeScore > awayScore;
  const awayWins = awayScore > homeScore;
  const homeRecord = score?.home?.records[0]?.summary ?? "0-0";
  const awayRecord = score?.away?.records[0]?.summary ?? "0-0";
  const homeTimeouts = score?.home?.timeouts ?? 0;
  const awayTimeouts = score?.away.timeouts ?? 0;
  const officials = details?.officials ?? [];
  const injuries = details?.injuries ?? [];
  const highlights = details?.highlights ?? [];
  const lineScore = score?.periodScores?.length
    ? {
        home: score.periodScores.map((p) => p.home.toString()),
        away: score.periodScores.map((p) => p.away.toString()),
      }
    : undefined;

  const neutralSite = details?.neutralSite;
  const venueId = Number(details?.venue?.id);
  const { venue } = useVenue({ sport: "hockey", id: venueId });
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
  const venueAttendance = game?.attendance || null;
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
    isLoading,
    navigation,
    neutralSite,
  ]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomActivityIndicator />
      </View>
    );
  }

  if (!game || !homeTeam || !awayTeam) return <View />;

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.container}
        stickyHeaderIndices={[0]}
        onScrollBeginDrag={handleScrollStart}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
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
          awayScore={awayScore}
          awayRecord={awayRecord}
          awayWins={awayWins}
          awayTimeouts={awayTimeouts}
          // Home team
          homeId={homeId}
          homeName={homeCode}
          homeLogo={homeLogo}
          homeScore={homeScore}
          homeRecord={homeRecord}
          homeWins={homeWins}
          homeTimeouts={homeTimeouts}
          // Live game state
          clock={clock}
          period={period}
          // Status
          gameStatusDescription={gameStatusDescription}
          gameStatusDetail={gameStatusDetail}
        />

        {!dontShowDetails && (
          <View style={styles.innerContainer}>
            <LastPlay
              lastPlay={lastPlay}
              homeId={homeId}
              awayId={awayId}
              state={state}
              league={LEAGUE}
            />

            <LineScore
              linescore={lineScore}
              homeCode={homeCode}
              awayCode={awayCode}
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

            <GameSummary plays={plays ?? []} isDark={isDark} />

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
