import { getSOCCTeam, getSOCCTeamLogo } from "@/constants/teamsSOCC";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useLastFiveGames } from "@/hooks/BaseballHooks/useLastFiveGames";
import { useSoccerGameDetails } from "@/hooks/SoccerHooks/useSoccerGameDetails";
import { useVenue } from "@/hooks/useVenue";
import { useWeather } from "@/hooks/useWeather";
import { GamePreviewModalStyles } from "@/styles/ModalsStyles/GamePreviewModalStyles";
import { SoccerGame } from "@/types/soccer/soccer";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import { Colors } from "constants/styles";
import { BlurView } from "expo-blur";
import React, { useEffect, useMemo, useRef } from "react";
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
import { CenterInfo } from "../GameDetails/CenterInfo";
import { TeamRow } from "../GameDetails/TeamRow";
import GamePreviewContent from "./GamePreviewContent";

type Props = {
  visible: boolean;
  game: SoccerGame;
  onClose: () => void;
};

export default function SoccerGamePreviewModal({
  visible,
  game,
  onClose,
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

  const gameDateObj = game?.date ? new Date(game.date) : null;
  const gameDate = safeDate(game?.date);
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);
  const holidayLabel = getHolidayLabel(gameDate);

  const gameId = game.id;
  const LEAGUE = game?.league?.code ?? "epl";

  const { details, score } = useSoccerGameDetails(LEAGUE, gameId);
  const home = score?.home;
  const away = score?.away;

  const homeId = Number(home?.id ?? 0);
  const awayId = Number(away?.id ?? 0);

  const homeTeam = getSOCCTeam(homeId);
  const awayTeam = getSOCCTeam(awayId);

  const awayCode = useMemo(() => awayTeam?.code ?? "", [awayTeam?.code]);
  const homeCode = useMemo(() => homeTeam?.code ?? "", [homeTeam?.code]);

  const awayName = useMemo(() => awayTeam?.name ?? "", [awayTeam?.name]);
  const homeName = useMemo(() => homeTeam?.name ?? "", [homeTeam?.name]);

  const isHomeNational = useMemo(
    () => homeTeam?.isNational,
    [homeTeam?.isNational],
  );
  const isHomeAllStar = useMemo(
    () => homeTeam?.isAllStar,
    [homeTeam?.isAllStar],
  );

  const isAwayNational = useMemo(
    () => awayTeam?.isNational,
    [awayTeam?.isNational],
  );
  const isAwayAllStar = useMemo(
    () => awayTeam?.isAllStar,
    [awayTeam?.isAllStar],
  );

  const homeLogo = getSOCCTeamLogo(homeId, true);
  const awayLogo = getSOCCTeamLogo(awayId, true);

  const headline = game.headline || holidayLabel;
  const isChampionship = headline?.includes("Final");

  const homeColor = homeTeam?.color ?? Colors.midTone;
  const awayColor = awayTeam?.color ?? Colors.midTone;

  const styles = GamePreviewModalStyles({
    isDark: isDark,
    isChampionship: isChampionship,
    homeColor: homeColor,
    awayColor: awayColor,
  });
  const isGameLoading = !score || !details || !homeTeam || !awayTeam;
  const broadcast = getBroadcastDisplay(game?.broadcasts);
  const period = formatPeriod({ period: game.status.period, isSOCC: true });
  const clock = score?.status.displayClock ?? "0:00";
  const gameStatusDescription = game.status?.description;
  const gameStatusDetail = game.status.shortDetail;
  const tbd = gameStatusDetail?.includes("TBD") ? "TBD" : null;
  const isSuspended = gameStatusDescription === "Suspended";
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isForfeited = gameStatusDescription === "Forfeit";

  const dontShowDetails =
    isForfeited || isPostponed || isDelayed || isCanceled || isSuspended;
  const state = score?.status.state ?? "";
  const homeScore = score?.home?.score ?? 0;
  const awayScore = score?.away?.score ?? 0;
  const homeRecord = score?.home?.record ?? "0-0-0";
  const awayRecord = score?.away?.record ?? "0-0-0";

  const homeWins = score?.home?.winner;
  const awayWins = score?.away?.winner;
  const isTie = awayWins === homeWins;
  const teamStats = score?.teamStats ?? [];
  const officials = details?.officials ?? [];

  const lineScore = score?.periodScores?.length
    ? {
        home: score.periodScores.map((p) => p.home.toString()),
        away: score.periodScores.map((p) => p.away.toString()),
      }
    : undefined;

  const homeLastGames = useLastFiveGames(homeId, "soccer", LEAGUE).games;
  const awayLastGames = useLastFiveGames(awayId, "soccer", LEAGUE).games;

  const venueId = Number(details?.venue?.id);
  const { venue } = useVenue({ sport: "soccer", id: venueId });
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
  const venueImage = venue?.image ?? baseVenue?.images[0]?.href;
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
          {isGameLoading ? (
            <View style={styles.loadingContainer}>
              <CustomActivityIndicator />
            </View>
          ) : (
            <>
              {headline && <Text style={styles.headlineText}>{headline}</Text>}

              {/* --- Header Section --- */}
              <View style={styles.gameHeaderContainer}>
                <TeamRow
                  id={awayId}
                  logo={awayLogo}
                  name={awayCode}
                  rank={null}
                  score={awayScore}
                  isTie={isTie}
                  isWinner={awayWins}
                  record={awayRecord}
                  isDark={isDark}
                  isHome={false}
                  league={LEAGUE}
                  state={state}
                  gameStatusDescription={gameStatusDescription}
                  isNational={isAwayNational}
                  isAllStar={isAwayAllStar}
                />
                <CenterInfo
                  gameStatusDescription={gameStatusDescription}
                  gameStatusDetail={gameStatusDetail}
                  state={state}
                  broadcast={broadcast}
                  period={period}
                  clock={clock}
                  time={tbd || formattedTime}
                  date={formattedDate}
                  isDark={isDark}
                />

                <TeamRow
                  id={homeId}
                  logo={homeLogo}
                  name={homeCode}
                  rank={null}
                  score={homeScore}
                  isTie={isTie}
                  isWinner={homeWins}
                  record={homeRecord}
                  isHome={true}
                  isDark={isDark}
                  league={LEAGUE}
                  state={state}
                  gameStatusDescription={gameStatusDescription}
                  isNational={isHomeNational}
                  isAllStar={isHomeAllStar}
                />
              </View>

              {/* --- Scrollable Content --- */}
              {!dontShowDetails && (
                <GamePreviewContent
                  homeId={homeId}
                  awayId={awayId}
                  homeColor={homeColor}
                  homeName={homeName}
                  homeLogo={homeLogo}
                  awayLogo={awayLogo}
                  awayCode={awayCode}
                  awayColor={awayColor}
                  awayName={awayName}
                  homeCode={homeCode}
                  lineScore={lineScore}
                  teamStats={teamStats}
                  homeLastGames={homeLastGames}
                  awayLastGames={awayLastGames}
                  officials={officials}
                  venueImage={venueImage}
                  venueLocation={venueLocation}
                  venueName={venueName}
                  venueAddress={venueAddress}
                  venueCapacity={venueCapacity}
                  venueAttendance={venueAttendance}
                  state={state}
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
