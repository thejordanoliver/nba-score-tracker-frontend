//./CFB/GamePreview/CFBGamePreviewModal.tsx
import CustomActivityIndicator from "@/components/CustomActivityIndicator";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useLastFiveGames } from "@/hooks/BaseballHooks/useLastFiveGames";
import { useHockeyGameDetails } from "@/hooks/HockeyHooks/useHockeyGameDetails";
import { useVenue } from "@/hooks/useVenue";
import { useWeather } from "@/hooks/useWeather";
import { GamePreviewModalStyles } from "@/styles/ModalsStyles/GamePreviewModalStyles";
import { HockeyGame } from "@/types/hockey/hockey";
import {
  formatDate,
  formatTime,
  getHolidayLabel,
  safeDate,
} from "@/utils/dateUtils";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { Colors } from "constants/styles";
import { getNHLTeam, getNHLTeamLogo } from "constants/teamsNHL";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  formatPeriod,
  formatVenueAddress,
  getBroadcastDisplay,
} from "utils/games";
import { snapPoints } from "utils/modalUtils";
import { CenterInfo } from "../GameDetails/CenterInfo";
import { TeamRow } from "../GameDetails/TeamRow";
import GamePreviewContent from "./GamePreviewContent";

type Props = {
  game: HockeyGame;
  isNHL: boolean;
  isMCH: boolean;
  visible: boolean;
  onClose: () => void;
};

export default function HockeyGamePreviewModal({
  game,
  isNHL = false,
  isMCH = false,
  visible,
  onClose,
}: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const sheetRef = useRef<BottomSheetModal>(null);

  const gameDateObj = new Date(game.date);
  const gameDate = safeDate(game?.date);
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);
  const holidayLabel = getHolidayLabel(gameDate);
  const headline = game.headline || holidayLabel;

  const LEAGUE = game?.league?.code ?? "nhl";
  const gameId = game?.id;

  const home = game.home;
  const away = game.away;
  const awayId = away.id;
  const homeId = home.id;
  const homeTeam = getNHLTeam(homeId);
  const awayTeam = getNHLTeam(awayId);
  const homeLogo = getNHLTeamLogo(homeId, true);
  const awayLogo = getNHLTeamLogo(awayId, true);

  // Modal open/close
  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const homeCode = homeTeam?.code ?? "";
  const awayCode = awayTeam?.code ?? "";
  const homeName = homeTeam?.fullName ?? "";
  const awayName = awayTeam?.fullName ?? "";
  const homeColor = homeTeam?.color ?? Colors.midTone;
  const awayColor = awayTeam?.color ?? Colors.midTone;

  const homeLastGames = useLastFiveGames(homeId, "hockey", LEAGUE).games;
  const awayLastGames = useLastFiveGames(awayId, "hockey", LEAGUE).games;
  const { details, score } = useHockeyGameDetails(LEAGUE, gameId);

  const isLoading = !!details;

  const isChampionship = headline?.includes("Stanley Cup Final");
  const styles = GamePreviewModalStyles({
    isDark: isDark,
    isChampionship: isChampionship,
    homeColor: homeColor,
    awayColor: awayColor,
  });

  const broadcast = getBroadcastDisplay(game?.broadcasts);
  const state = score?.status?.state;
  const gameStatusDescription = game.status.description ?? "";
  const gameStatusDetail = game.status.shortDetail ?? "";
  const tbd = gameStatusDetail.includes("TBD") ? "TBD" : null;
  const isCanceled = gameStatusDescription === "Canceled";
  const isPostponed = gameStatusDescription === "Postponed";
  const isDelayed = gameStatusDescription === "Delayed";
  const isForfeited = gameStatusDescription === "Forfeited";
  const dontShowDetails = isDelayed || isCanceled || isPostponed || isForfeited;
  const period = formatPeriod({ period: game.status.period, isNHL: true });
  const homeScore = score?.home?.score ?? 0;
  const awayScore = score?.away?.score ?? 0;
  const homeRank = score?.home?.rank;
  const awayRank = score?.away?.rank;
  const homeTimeouts = score?.home?.timeouts ?? 0;
  const awayTimeouts = score?.away?.timeouts ?? 0;
  const homeWins = homeScore > awayScore;
  const awayWins = awayScore > homeScore;
  const homeRecord = game?.home?.record ?? "0-0";
  const awayRecord = game?.away?.record ?? "0-0";
  const clock = game.status?.clock;
  const lineScore = score?.periodScores?.length
    ? {
        home: score.periodScores.map((p) => p.home.toString()),
        away: score.periodScores.map((p) => p.away.toString()),
      }
    : undefined;

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

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={2}
      snapPoints={snapPoints}
      onDismiss={onClose}
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
        <LinearGradient
          colors={
            isChampionship
              ? [Colors.dark.gold, Colors.dark.gold]
              : [awayColor, awayColor, homeColor, homeColor]
          }
          locations={isChampionship ? undefined : [0, 0.4, 0.6, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFill}
        />

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
                  rank={awayRank}
                  score={awayScore}
                  record={awayRecord}
                  isWinner={awayWins}
                  timeouts={awayTimeouts}
                  gameStatusDescription={gameStatusDescription}
                  isHome={false}
                  league={LEAGUE}
                  isDark
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
                  isDark
                />

                {/* Home Team Row */}
                <TeamRow
                  id={homeId}
                  name={homeCode}
                  logo={homeLogo}
                  rank={homeRank}
                  score={homeScore}
                  record={homeRecord}
                  isWinner={homeWins}
                  timeouts={homeTimeouts}
                  gameStatusDescription={gameStatusDescription}
                  isHome={true}
                  league={LEAGUE}
                  isDark
                />
              </View>

              {/* --- Scrollable Content --- */}
              {!dontShowDetails && (
                <GamePreviewContent
                  homeColor={homeColor}
                  gameStatusDescription={gameStatusDescription}
                  state={state}
                  awayCode={awayCode}
                  homeCode={homeCode}
                  awayColor={awayColor}
                  awayLogo={awayLogo}
                  awayName={awayName}
                  homeName={homeName}
                  homeId={homeId}
                  awayId={awayId}
                  homeLogo={homeLogo}
                  lineScore={lineScore}
                  homeLastGames={homeLastGames}
                  awayLastGames={awayLastGames}
                  venueImage={venueImage}
                  venueName={venueName}
                  venueLocation={venueLocation}
                  venueAddress={venueAddress}
                  venueCapacity={venueCapacity}
                  venueAttendance={venueAttendance}
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
