import { getCBBTeam, getCBBTeamLogo } from "@/constants/teamsCBB";
import { getWNBATeam, getWNBATeamLogo } from "@/constants/teamsWNBA";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useLastFiveGames } from "@/hooks/BaseballHooks/useLastFiveGames";
import { useBasketballGameDetails } from "@/hooks/BasketballHooks/useBasketballGameDetails";
import useTeamDetails from "@/hooks/useTeams";
import { useVenue } from "@/hooks/useVenue";
import { useWeather } from "@/hooks/useWeather";
import { GamePreviewModalStyles } from "@/styles/ModalsStyles/GamePreviewModalStyles";
import { BasketballGame } from "@/types/basketball/basketball";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import { Colors } from "constants/styles";
import { getNBATeam, getNBATeamLogo, getTeamBySummerId } from "constants/teams";
import { getWCBBTeam, getWCBBTeamLogo } from "constants/teamsWCBB";
import { BlurView } from "expo-blur";
import React, { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import {
  formatDate,
  formatTime,
  getHolidayLabel,
  safeDate,
} from "utils/dateUtils";
import {
  formatPeriod,
  formatVenueAddress,
  getBroadcastDisplay,
} from "utils/games";
import { snapPoints } from "utils/modalUtils";
import { CenterInfo, TeamRow } from "../GameDetails";
import GamePreviewContent from "./GamePreviewContent";

type Props = {
  visible: boolean;
  game: BasketballGame;
  onClose: () => void;
  isSL: boolean;
  isCBB: boolean;
  isWCBB: boolean;
  isWNBA: boolean;
  isGLEAGUE?: boolean;
};

export default function GamePreviewModal({
  visible,
  game,
  onClose,
  isSL,
  isCBB,
  isWCBB,
  isWNBA,
  isGLEAGUE,
}: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (!sheetRef.current) return;
    if (visible) {
      requestAnimationFrame(() => sheetRef.current?.present());
    } else {
      requestAnimationFrame(() => sheetRef.current?.dismiss());
    }
  }, [visible]);

  const gameDateObj = new Date(game.date);
  const gameDate = safeDate(game?.date);
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);
  const holidayLabel = getHolidayLabel(gameDate);
  const headline = game.headline || holidayLabel;

  const gameId = game.id;
  const LEAGUE = game?.league?.code ?? "cbb";

  const { details, score } = useBasketballGameDetails(LEAGUE, gameId);

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
        : isSL
          ? getTeamBySummerId(homeId)
          : getNBATeam(homeId);

  const awayTeam = isWNBA
    ? getWNBATeam(awayId)
    : isWCBB
      ? getWCBBTeam(awayId)
      : isCBB
        ? getCBBTeam(awayId)
        : isSL
          ? getTeamBySummerId(awayId)
          : getNBATeam(awayId);

  const homeCode = homeTeam?.code ?? home?.code ?? "";
  const awayCode = awayTeam?.code ?? away?.code ?? "";

  const awayName =
    awayTeam?.fullName ?? awayTeam?.name ?? away?.name ?? "Away Team";
  const homeName =
    homeTeam?.fullName ?? homeTeam?.name ?? home?.name ?? "Home Team";

  const homeColor = homeTeam?.color ?? Colors.midTone;
  const awayColor = awayTeam?.color ?? Colors.midTone;

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

  const isChampionship =
    headline?.includes("NBA Summer League - Final") ||
    headline?.includes("NBA Finals") ||
    headline?.includes(
      "Men's Basketball Championship - National Championship",
    ) ||
    headline?.includes(
      "Women's Basketball Championship - National Championship",
    );

  const styles = GamePreviewModalStyles({
    isDark: isDark,
    isChampionship: isChampionship,
    homeColor: homeColor,
    awayColor: awayColor,
  });
  const isLoading = !!details;
  const broadcast = getBroadcastDisplay(game?.broadcasts);
  const period = formatPeriod({
    period: game.status.period,
    isCBB: isCBB || isWCBB,
  });
  const clock = score?.status?.displayClock ?? "0:00";
  const gameStatusDescription = score?.status.gameStatusDescription ?? "";
  const state = score?.status.state ?? null;
  const gameStatusDetail =
    score?.status.gameStatusDetail ?? game.status.shortDetail ?? "";
  const tbd = gameStatusDetail.includes("TBD") ? "TBD" : null;
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isForfeited = gameStatusDescription === "Forfeit";
  const dontShowDetails = isForfeited || isPostponed || isDelayed || isCanceled;
  const homeRecord = game.home.record ?? "0-0";
  const awayRecord = game.away.record ?? "0-0";
  const homeChance = Number(details?.predictor?.homeTeam?.gameProjection) ?? 0;
  const awayChance = Number(details?.predictor?.awayTeam?.gameProjection) ?? 0;
  const teamStats = score?.teamStats ?? [];
  const playerStats = score?.playerStats ?? [];
  const leaders = score?.leaders ?? [];
  const officials = details?.officials ?? [];
  const highlights = details?.highlights ?? [];

  const homeRank = home?.rank ?? null;
  const awayRank = away?.rank ?? null;

  const homeScore = score?.home.score;
  const awayScore = score?.away.score;

  const homeWins = score?.home.winner ?? false;
  const awayWins = score?.away.winner ?? false;

  const homeBonus = score?.home?.fouls?.bonusState;
  const awayBonus = score?.away?.fouls?.bonusState;

  const homeTimeouts = score?.home.timeouts ?? 0;
  const awayTimeouts = score?.away.timeouts ?? 0;

  const lineScore = score?.periodScores?.length
    ? {
        home: score.periodScores.map((p) => p.home.toString()),
        away: score.periodScores.map((p) => p.away.toString()),
      }
    : undefined;

  const homeLastGames = useLastFiveGames(homeId, "basketball", LEAGUE).games;
  const awayLastGames = useLastFiveGames(awayId, "basketball", LEAGUE).games;

  const { teamDetails: homeTeamDetails } = useTeamDetails(LEAGUE, homeId);
  const { teamDetails: awayTeamDetails } = useTeamDetails(LEAGUE, awayId);

  const homeCoach = homeTeamDetails?.coach;
  const awayCoach = awayTeamDetails?.coach;

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
  const venueAttendance = game?.attendance || null;
  const venueCity = venue?.city ?? baseVenue?.address?.city;
  const venueRegion =
    venue?.state ?? baseVenue?.address?.state ?? baseVenue?.address?.country;
  const venueLocation =
    venueCity && venueRegion
      ? `${venueCity}, ${venueRegion}`
      : (venueCity ?? "");

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={2}
      snapPoints={snapPoints}
      onDismiss={onClose}
      enableContentPanningGesture
      enableHandlePanningGesture
      enableDynamicSizing={false}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      )}
      handleStyle={styles.handleStyle}
      handleIndicatorStyle={styles.handleIndicatorStyle}
      backgroundStyle={styles.backgroundStyle}
    >
      <View style={styles.container}>
        <View style={styles.leftCircle} />
        <View style={styles.rightCircle} />

        <BlurView intensity={100} style={styles.blurViewContainer}>
          {!isLoading ? (
            <View style={styles.loadingContainer}>
              <CustomActivityIndicator />
            </View>
          ) : (
            <>
              {headline && <Text style={styles.headlineText}>{headline}</Text>}

              {/* --- Header Section --- */}
              <View style={styles.gameHeaderContainer}>
                {/* Away Team Row */}
                <TeamRow
                  id={awayId}
                  name={awayCode}
                  logo={awayLogo}
                  bonusState={awayBonus}
                  rank={awayRank}
                  score={awayScore}
                  record={awayRecord}
                  isWinner={awayWins}
                  timeouts={awayTimeouts}
                  gameStatusDescription={gameStatusDescription}
                  isHome={false}
                  league={LEAGUE}
                  isDark={isDark}
                />

                {/* Game Info */}
                <CenterInfo
                  date={formattedDate}
                  time={tbd || formattedTime}
                  clock={clock}
                  period={period}
                  broadcast={broadcast}
                  gameStatusShortDescription={gameStatusDetail}
                  gameStatusDescription={gameStatusDescription}
                  isDark={isDark}
                />

                {/* Home Team Row */}
                <TeamRow
                  id={homeId}
                  name={homeCode}
                  logo={homeLogo}
                  rank={homeRank}
                  score={homeScore}
                  record={homeRecord}
                  bonusState={homeBonus}
                  isWinner={homeWins}
                  timeouts={homeTimeouts}
                  gameStatusDescription={gameStatusDescription}
                  isHome={true}
                  league={LEAGUE}
                  isDark={isDark}
                />
              </View>

              {/* --- Scrollable Content --- */}
              {!dontShowDetails && (
                <GamePreviewContent
                  state={state}
                  homeId={homeId}
                  awayId={awayId}
                  homeColor={homeColor}
                  homeName={homeName}
                  homeLogo={homeLogo}
                  awayLogo={awayLogo}
                  homeHeaderLogo={homeHeaderLogo}
                  awayHeaderLogo={awayHeaderLogo}
                  awayCode={awayCode}
                  awayColor={awayColor}
                  awayName={awayName}
                  homeCode={homeCode}
                  homeChance={homeChance}
                  awayChance={awayChance}
                  homeCoach={homeCoach}
                  awayCoach={awayCoach}
                  lineScore={lineScore}
                  teamStats={teamStats}
                  playerStats={playerStats}
                  homeLastGames={homeLastGames}
                  awayLastGames={awayLastGames}
                  officials={officials}
                  highlights={highlights}
                  venueImage={venueImage}
                  venueLocation={venueLocation}
                  venueName={venueName}
                  venueAddress={venueAddress}
                  venueCapacity={venueCapacity}
                  venueAttendance={venueAttendance}
                  leaders={leaders}
                  weather={weather}
                  league={LEAGUE}
                  isDark={isDark}
                />
              )}
            </>
          )}
        </BlurView>
      </View>
    </BottomSheetModal>
  );
}
