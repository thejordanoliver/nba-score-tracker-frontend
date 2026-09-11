import CustomActivityIndicator from "@/components/CustomActivityIndicator";
import { Colors } from "@/constants/styles";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useLastFiveGames } from "@/hooks/BaseballHooks/useLastFiveGames";
import useTeamDetails from "@/hooks/useTeams";
import { useVenue } from "@/hooks/useVenue";
import { useWeather } from "@/hooks/useWeather";
import { GamePreviewModalStyles } from "@/styles/ModalsStyles/GamePreviewModalStyles";
import { BaseballGame } from "@/types/baseball/baseball";
import {
  formatDate,
  formatTime,
  getHolidayLabel,
  safeDate,
} from "@/utils/dateUtils";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { getCBTeam, getCBTeamLogo } from "constants/teamsCB";
import { getMLBTeam, getMLBTeamLogo } from "constants/teamsMLB";
import { getSBTeam, getSBTeamLogo } from "constants/teamsSB";
import { BlurView } from "expo-blur";
import { useBaseballGameDetails } from "hooks/BaseballHooks/useBaseballGameDetails";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import { formatVenueAddress, getBroadcastDisplay } from "utils/games";
import { snapPoints } from "utils/modalUtils";
import { CenterInfo } from "../GameDetails/CenterInfo";
import { TeamRow } from "../GameDetails/TeamRow";
import GamePreviewContent from "./GamePreviewContent";

type BaseballGameCardProps = {
  game: BaseballGame;
  visible: boolean;
  onClose: () => void;
  isMLB: boolean;
  isCB: boolean;
  isSB: boolean;
};

export default function BaseballGamePreviewModal({
  game,
  visible,
  onClose,
  isMLB = false,
  isCB = false,
  isSB = false,
}: BaseballGameCardProps) {
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
  const isChampionship = game?.season.slug === "championship-series";

  const LEAGUE = game?.league?.code ?? "mlb";
  const gameId = game?.id;
  const home = game?.home;
  const away = game?.away;
  const homeId = home?.id;
  const awayId = away?.id;

  const homeTeam = isSB
    ? getSBTeam(home?.id)
    : isCB
      ? getCBTeam(home?.id)
      : getMLBTeam(home?.id);

  const awayTeam = isSB
    ? getSBTeam(away?.id)
    : isCB
      ? getCBTeam(away?.id)
      : getMLBTeam(away?.id);

  const homeTeamId = homeTeam?.id ?? 0;
  const awayTeamId = awayTeam?.id ?? 0;

  const homeCode = homeTeam?.code ?? homeTeam?.shortName ?? "";
  const awayCode = awayTeam?.code ?? awayTeam?.shortName ?? "";
  const homeName = homeTeam?.fullName ?? homeTeam?.shortName ?? "";
  const awayName = awayTeam?.fullName ?? awayTeam?.shortName ?? "";

  const homeLogo = isSB
    ? getSBTeamLogo(homeId, isDark)
    : isCB
      ? getCBTeamLogo(homeId, isDark)
      : getMLBTeamLogo(homeTeamId, isDark);

  const awayLogo = isSB
    ? getSBTeamLogo(awayId, isDark)
    : isCB
      ? getCBTeamLogo(awayId, isDark)
      : getMLBTeamLogo(awayTeamId, isDark);
  const homeHeaderLogo = isSB
    ? getSBTeamLogo(homeId, true)
    : isCB
      ? getCBTeamLogo(homeId, true)
      : getMLBTeamLogo(homeTeamId, true);

  const awayHeaderLogo = isSB
    ? getSBTeamLogo(awayId, true)
    : isCB
      ? getCBTeamLogo(awayId, true)
      : getMLBTeamLogo(awayTeamId, true);

  const homeColor = homeTeam?.color ?? Colors.midTone;
  const awayColor = awayTeam?.color ?? Colors.midTone;

  const styles = GamePreviewModalStyles({
    isDark: isDark,
    isChampionship: isChampionship,
    homeColor: homeColor,
    awayColor: awayColor,
  });

  const homeLastGames = useLastFiveGames(homeId, "baseball", LEAGUE).games;
  const awayLastGames = useLastFiveGames(awayId, "baseball", LEAGUE).games;

  const { teamDetails: homeTeamDetails } = useTeamDetails(LEAGUE, homeId);
  const { teamDetails: awayTeamDetails } = useTeamDetails(LEAGUE, awayId);

  const homeCoach = homeTeamDetails?.coach;
  const awayCoach = awayTeamDetails?.coach;

  const { details, score } = useBaseballGameDetails(LEAGUE, gameId);

  const broadcast = getBroadcastDisplay(game?.broadcasts);
  const state = score?.status?.state ?? "";
  const gameStatusDescription = score?.status.gameStatusDescription ?? "";
  const gameStatusDetail =
    score?.status.shortDetail ?? game.status.shortDetail ?? "";
  const tbd = gameStatusDetail.includes("TBD") ? "TBD" : null;
  const isTopInning = gameStatusDetail.includes("Top");
  const isBottomInning = gameStatusDetail.includes("Bot");

  const homeScore = score?.home.score ?? 0;
  const awayScore = score?.away.score ?? 0;
  const homeWins = score?.home?.winner ?? false;
  const awayWins = score?.away?.winner ?? false;

  const isCanceled = gameStatusDescription === "Canceled";
  const isPostponed = gameStatusDescription === "Postponed";
  const isSuspended = gameStatusDescription === "Suspended";
  const isForfeited = gameStatusDescription === "Forfeit";
  const isLoading = !score || !details || !homeLastGames || !awayLastGames;
  const dontShowDetails =
    isCanceled || isPostponed || isSuspended || isForfeited;

  const homeChance = Number(details?.predictor?.homeTeam?.gameProjection) || 0;
  const awayChance = Number(details?.predictor?.awayTeam?.gameProjection) || 0;

  const lineScore = score?.periodScores?.length
    ? {
        home: score.periodScores.map((p) => p.home.toString()),
        away: score.periodScores.map((p) => p.away.toString()),
      }
    : undefined;

  const outs = score?.situation.outs ?? 0;

  const bases = {
    onFirst: score?.situation.bases.onFirst ?? false,
    onSecond: score?.situation.bases.onSecond ?? false,
    onThird: score?.situation.bases?.onThird ?? false,
  };

  const homeHits = score?.home.hits ?? 0;
  const homeErrors = score?.home.errors ?? 0;
  const awayHits = score?.away.hits ?? 0;
  const awayErrors = score?.away.errors ?? 0;
  const homeRuns = score?.home.score ?? 0;
  const awayRuns = score?.away.score ?? 0;
  const homeRecord = home?.record ?? "0—0";
  const awayRecord = away?.record ?? "0—0";
  const homeRank = home?.homeRank;
  const awayRank = away?.awayRank;
  const teamStats = score?.teamStats ?? [];
  const playerStats = score?.playerStats ?? [];
  const officials = details?.officials ?? [];
  const highlights = details?.highlights ?? [];
  const injuries = details?.injuries ?? [];

  const venueId = Number(details?.venue?.id);
  const { venue } = useVenue({ sport: "baseball", id: venueId });
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
          {isLoading ? (
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
                  state={state}
                  id={awayId}
                  logo={awayLogo}
                  name={awayCode}
                  score={awayScore}
                  rank={awayRank}
                  isWinner={awayWins}
                  record={awayRecord}
                  gameStatusDescription={gameStatusDescription}
                  isHome={false}
                  isDark={isDark}
                  league={LEAGUE}
                />

                {/* Game Info */}
                <CenterInfo
                  state={state}
                  gameStatusDescription={gameStatusDescription}
                  gameStatusDetail={gameStatusDetail}
                  date={formattedDate}
                  time={tbd || formattedTime}
                  broadcast={broadcast}
                  isTopInning={isTopInning}
                  isBottomInning={isBottomInning}
                  outs={outs}
                  bases={bases}
                  isDark={isDark}
                />

                {/* Home Team Row */}
                <TeamRow
                  state={state}
                  id={homeId}
                  logo={homeLogo}
                  name={homeCode}
                  rank={homeRank}
                  score={homeScore}
                  isWinner={homeWins}
                  record={homeRecord}
                  gameStatusDescription={gameStatusDescription}
                  isHome={true}
                  isDark={isDark}
                  league={LEAGUE}
                />
              </View>

              {/* --- Scrollable Content --- */}
              {!dontShowDetails && (
                <GamePreviewContent
                  homeId={homeId}
                  awayId={awayId}
                  homeLogo={homeLogo}
                  homeHeaderLogo={homeHeaderLogo}
                  homeCode={homeCode}
                  homeName={homeName}
                  homeColor={homeColor}
                  homeLastGames={homeLastGames}
                  awayLogo={awayLogo}
                  awayHeaderLogo={awayHeaderLogo}
                  awayCode={awayCode}
                  awayName={awayName}
                  awayColor={awayColor}
                  awayLastGames={awayLastGames}
                  homeChance={homeChance}
                  awayChance={awayChance}
                  lineScore={lineScore}
                  homeHits={homeHits}
                  awayHits={awayHits}
                  homeRuns={homeRuns}
                  awayRuns={awayRuns}
                  homeCoach={homeCoach}
                  awayCoach={awayCoach}
                  awayErrors={awayErrors}
                  homeErrors={homeErrors}
                  teamStats={teamStats}
                  playerStats={playerStats}
                  highlights={highlights}
                  injuries={injuries}
                  weather={weather}
                  venueImage={venueImage}
                  venueCapacity={venueCapacity}
                  venueName={venueName}
                  venueLocation={venueLocation}
                  venueAddress={venueAddress}
                  venueAttendance={venueAttendance}
                  gameStatusDescription={gameStatusDescription}
                  state={state}
                  officials={officials}
                  isChampionship={isChampionship}
                  league={LEAGUE}
                  isMLB={isMLB}
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
