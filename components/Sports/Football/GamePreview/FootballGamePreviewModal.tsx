// ./NFL/GamePreview/NFLGamePreviewModal.tsx
import CustomActivityIndicator from "@/components/CustomActivityIndicator";
import { Colors } from "@/constants/styles";
import { getCFBTeam, getCFBTeamLogo } from "@/constants/teamsCFB";
import { getUFLTeam, getUFLTeamLogo } from "@/constants/teamsUFL";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useLastFiveGames } from "@/hooks/BaseballHooks/useLastFiveGames";
import { useFootballGameDetails } from "@/hooks/FootballHooks/useFootballGameDetails";
import useTeamDetails from "@/hooks/useTeams";
import { useVenue } from "@/hooks/useVenue";
import { useWeather } from "@/hooks/useWeather";
import { GamePreviewModalStyles } from "@/styles/ModalsStyles/GamePreviewModalStyles";
import { FootballGame } from "@/types/football/football";
import {
  formatPeriod,
  formatVenueAddress,
  getBroadcastDisplay,
} from "@/utils/games";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { getNFLTeam, getNFLTeamLogo } from "constants/teamsNFL";
import { BlurView } from "expo-blur";
import { useEffect, useMemo, useRef } from "react";
import { Text, View } from "react-native";
import {
  formatDate,
  formatTime,
  getHolidayLabel,
  safeDate,
} from "utils/dateUtils";
import { snapPoints } from "utils/modalUtils";
import { CenterInfo } from "../GameDetails/CenterInfo";
import { TeamRow } from "../GameDetails/TeamRow";
import GamePreviewContent from "./GamePreviewContent";

type Props = {
  game: FootballGame;
  isNFL: boolean;
  isCFB: boolean;
  visible: boolean;
  onClose: () => void;
};

export default function FootballGamePreviewModal({
  game,
  isNFL,
  isCFB,
  visible,
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

  const gameDateObj = new Date(game.date);
  const gameDate = safeDate(game?.date);
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);
  const holidayLabel = getHolidayLabel(gameDate);
  const isChampionship =
    game?.headline?.includes("Super Bowl") ??
    game?.headline?.includes("Championship");

  const gameId = game.id;
  const LEAGUE = game?.league?.code ?? "nfl";

  const homeId = game?.home?.id ?? 0;
  const awayId = game?.away?.id ?? 0;

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

  const homeCode = homeTeam?.code ?? game.home.code ?? "";
  const awayCode = awayTeam?.code ?? game.away.code ?? "";

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

  const homeColor = homeTeam?.color ?? Colors.midTone;
  const awayColor = awayTeam?.color ?? Colors.midTone;

  const styles = GamePreviewModalStyles({
    isDark: isDark,
    isChampionship: isChampionship,
    homeColor: homeColor,
    awayColor: awayColor,
  });

  const homeName = homeTeam?.fullName ?? "";
  const awayName = awayTeam?.fullName ?? "";

  const { score, details } = useFootballGameDetails(LEAGUE, gameId);
  const homeLastGames = useLastFiveGames(homeId, "football", LEAGUE).games;
  const awayLastGames = useLastFiveGames(awayId, "football", LEAGUE).games;

  const { teamDetails: homeTeamDetails } = useTeamDetails(LEAGUE, homeId);
  const { teamDetails: awayTeamDetails } = useTeamDetails(LEAGUE, awayId);

  const homeCoach = homeTeamDetails?.coach;
  const awayCoach = awayTeamDetails?.coach;

  const state = score?.status.state ?? "pre";
  const gameStatusDescription = score?.status.gameStatusDescription ?? "";
  const gameStatusDetail =
    score?.status.shortDetail ?? game.status.shortDetail ?? "";
  const tbd = gameStatusDetail.includes("TBD") ? "TBD" : null;
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isSuspended = gameStatusDescription === "Suspended";
  const isForfeited = gameStatusDescription === "Forfeit";
  const dontShowDetails =
    isDelayed || isCanceled || isPostponed || isSuspended || isForfeited;
  const clock = score?.status.displayClock ?? "0:00";
  const period = formatPeriod({ period: score?.status.period });
  const headline = details?.headline ?? holidayLabel;
  const broadcast = getBroadcastDisplay(details?.broadcasts) ?? "";
  const homeHasPossession = score?.home?.possession ?? false;
  const awayHasPossession = score?.away?.possession ?? false;
  const homeTimeouts = score?.home?.timeouts ?? 0;
  const awayTimeouts = score?.away?.timeouts ?? 0;
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
  const lastPlay = score?.lastPlay ?? null;
  const drives = score?.drives ?? {
    current: [],
    previous: [],
  };
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

  const officials = details?.officials ?? [];
  const highlights = details?.highlights ?? [];
  const injuries = details?.injuries ?? [];
  const leaders = score?.leaders ?? [];
  const teamStats = score?.boxScore?.teams ?? [];
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
  const venueName = venue?.name ?? baseVenue?.fullName;
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

  const isLoading = !!details;

  // --------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------
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

              {/* HEADER */}
              <View style={styles.gameHeaderContainer}>
                <TeamRow
                  id={awayId}
                  name={awayCode}
                  logo={awayLogo}
                  rank={awayRank}
                  score={awayScore}
                  record={awayRecord}
                  isWinner={awayWins}
                  isTie={isTie}
                  timeouts={awayTimeouts}
                  state={state}
                  gameStatusDescription={gameStatusDescription}
                  hasPossession={awayHasPossession}
                  league={LEAGUE}
                  isHome={false}
                  isDark={isDark}
                />

                <CenterInfo
                  date={formattedDate}
                  time={tbd || formattedTime}
                  gameStatusShortDetail={gameStatusDetail}
                  gameStatusDescription={gameStatusDescription}
                  broadcast={broadcast}
                  downDistance={null}
                  redzone={false}
                  period={period}
                  clock={clock}
                  state={state}
                  isDark={isDark}
                />

                <TeamRow
                  id={homeId}
                  name={homeCode}
                  logo={homeLogo}
                  rank={homeRank}
                  score={homeScore}
                  record={homeRecord}
                  isWinner={homeWins}
                  isTie={isTie}
                  timeouts={homeTimeouts}
                  state={state}
                  gameStatusDescription={gameStatusDescription}
                  hasPossession={homeHasPossession}
                  league={LEAGUE}
                  isHome={true}
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
                  drives={drives}
                  fieldPlay={fieldPlay}
                  homeChance={homeChance}
                  awayChance={awayChance}
                  homeCoach={homeCoach}
                  awayCoach={awayCoach}
                  lineScore={lineScore}
                  teamStats={teamStats}
                  injuries={injuries}
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
                  venueSurface={venueSurface}
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
