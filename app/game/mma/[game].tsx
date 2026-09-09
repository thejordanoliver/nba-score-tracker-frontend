import { CustomHeader } from "@/components/CustomHeader";
import {
  FanPrediction,
  GameLiveChatOverlay,
  GameLocation,
} from "@/components/Sports/Basketball/GameDetails";
import { useLiveVotes } from "@/hooks/useLiveVotes";
import { useVenue } from "@/hooks/useVenue";
import { useWeather } from "@/hooks/useWeather";
import {
  formatDate,
  formatTime,
  getHolidayLabel,
  safeDate,
  shouldShowGameChat,
} from "@/utils/dateUtils";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import GameHeader from "components/Sports/MMA/GameDetails/GameHeader";
import { usePreferences } from "contexts/PreferencesContext";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useScrollFade } from "hooks/useScrollFade";
import React, { useLayoutEffect, useMemo } from "react";
import { ScrollView, View } from "react-native";
import { gameDetailsScreenStyles } from "styles/GameDetailStyles/GameDetailsScreenStyles";
import { MMAFightCardProps } from "types/mma/mma";
import {
  formatPeriod,
  formatVenueAddress,
  getBroadcastDisplay,
} from "utils/games";
import MatchupComparison from "../../../components/Sports/MMA/GameDetails/MatchupComparison";
const LEAGUE = "MMA";

const leftStancePlaceholder =
  "https://res.cloudinary.com/dm3qtdhag/image/upload/v1781892206/leftStancePlaceholder_bplhud.png";
const rightStancePlaceholder =
  "https://res.cloudinary.com/dm3qtdhag/image/upload/v1781892222/rightStancePlaceholder_igoaxo.png";
const headshotPlaceholder =
  "https://res.cloudinary.com/dm3qtdhag/image/upload/v1781892365/playerPlaceholder_vi9zk3.png";

type RouteParams = {
  game?: string | string[];
  data?: string | string[];
  leagueId?: string | string[];
  league?: string | string[];
};

type MMAFight = MMAFightCardProps["game"];

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

function parseGameParam(value?: string | string[]): MMAFight | undefined {
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
    return JSON.parse(decodedValue) as MMAFight;
  } catch {
    return undefined;
  }
}

export default function GameDetailsScreen(
  props: Partial<MMAFightCardProps> = {},
) {
  const navigation = useNavigation();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = gameDetailsScreenStyles;
  const params = useLocalSearchParams<RouteParams>();
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
  const showGameChat = shouldShowGameChat(gameDateObj);
  const holidayLabel = getHolidayLabel(gameDate);

  const gameId = game?.id ?? 0;
  const { votes: liveVotes, castVote: castLiveVote } = useLiveVotes(gameId);

  const firstFighter = game?.competitors?.[0];
  const secondFighter = game?.competitors?.[1];
  const firstFighterId = Number(firstFighter?.id);
  const secondFighterId = Number(secondFighter?.id);
  const firstFighterLastName = firstFighter?.lastName ?? "TBD";
  const secondFighterLastName = secondFighter?.lastName ?? "TBD";
  const firstFighterName = firstFighter?.shortName ?? "TBD";
  const secondFighterName = secondFighter?.shortName ?? "TBD";
  const firstFighterColor = firstFighter?.color;
  const secondFighterColor = secondFighter?.color;
  const firstFighterPhoto = firstFighter?.headshot ?? headshotPlaceholder;
  const secondFighterPhoto = secondFighter?.headshot ?? headshotPlaceholder;
  const firstFighterStance =
    firstFighter?.rightStance ?? rightStancePlaceholder;
  const secondFighterStance =
    secondFighter?.leftStance ?? leftStancePlaceholder;
  const firstFighterAge = firstFighter?.age ?? "N/A";
  const secondFighterAge = secondFighter?.age ?? "N/A";
  const firstFighterCountry = firstFighter?.associationCountry ?? "N/A";
  const secondFighterCountry = secondFighter?.associationCountry ?? "N/A";
  const firstFighterWeight = firstFighter?.weight ?? "N/A";
  const secondFighterWeight = secondFighter?.weight ?? "N/A";
  const firstFighterHeight = firstFighter?.height ?? "N/A";
  const secondFighterHeight = secondFighter?.height ?? "N/A";
  const firstFighterReach = firstFighter?.reach ?? "N/A";
  const secondFighterReach = secondFighter?.reach ?? "N/A";
  const firstFighterFlag = firstFighter?.flag ?? "N/A";
  const secondFighterFlag = secondFighter?.flag ?? "N/A";
  const firstFighterRecord = firstFighter?.record ?? "0-0";
  const secondFighterRecord = secondFighter?.record ?? "0-0";
  const firstFighterClass = firstFighter?.weightClassShortName ?? "N/A";
  const secondFighterClass = secondFighter?.weightClassShortName ?? "N/A";
  const firstFighterWinner = firstFighter?.winner === true;
  const secondFighterWinner = secondFighter?.winner === true;
  const firstFighterIsChampion = firstFighter?.isChampion ?? false;
  const secondFighterIsChampion = secondFighter?.isChampion ?? false;

  const gameStatusDescription = game?.status.description;

  const state = game?.status.state ?? "";
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isSuspended = gameStatusDescription === "Suspended";
  const isForfeited = gameStatusDescription === "Forfeit";
  const dontShowDetails =
    isDelayed || isCanceled || isPostponed || isSuspended || isForfeited;
  const headline = game?.headline ?? holidayLabel;
  const results = game?.method;
  const broadcasts = game?.broadcasts;
  const broadcast = getBroadcastDisplay(broadcasts);
  const period = formatPeriod({ period: game?.status.period, isMMA: true });
  const clock = game?.status.displayClock;
  const isLoading = !game;

  const venueId = Number(game?.venue?.id);
  const { venue } = useVenue({ sport: "mma", id: venueId });
  const { weather } = useWeather({
    lat: Number(venue?.latitude),
    lon: Number(venue?.longitude),
    location: venue?.city,
    date: gameDateObj,
  });

  const baseVenue = game?.venue;
  const baseVenueAddress = formatVenueAddress(baseVenue?.address);
  const venueName = venue?.name ?? baseVenue?.fullName;
  const venueAddress = venue?.address ?? baseVenueAddress;
  const venueCapacity = venue?.capacity ?? null;
  const venueImage = venue?.image ?? "";
  const venueAttendance = baseVenue?.attendance || null;
  const venueCity = venue?.city ?? baseVenue?.address?.city;
  const venueRegion =
    venue?.state ?? baseVenue?.address?.state ?? baseVenue?.address?.country;
  const venueLocation =
    venueCity && venueRegion
      ? `${venueCity}, ${venueRegion}`
      : (venueCity ?? "");

  useLayoutEffect(() => {
    if (isLoading) {
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
          awayTeamCode={secondFighterLastName}
          homeTeamCode={firstFighterLastName}
          homeLogo={firstFighterFlag}
          awayLogo={secondFighterFlag}
          awayColor={secondFighterColor}
          homeColor={firstFighterColor}
          isNeutralSite
          league={LEAGUE}
        />
      ),
    });
  }, [
    navigation,
    isLoading,
    secondFighterLastName,
    firstFighterLastName,
    firstFighterFlag,
    secondFighterFlag,
    secondFighterColor,
    firstFighterColor,
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
        onScrollEndDrag={handleScrollEnd}
        stickyHeaderIndices={[0]}
      >
        <GameHeader
          // Fight details
          headline={headline}
          date={formattedDate}
          time={formattedTime}
          broadcast={broadcast}
          isDark={isDark}
          // First fighter
          firstFighterId={firstFighterId}
          firstFighterName={firstFighterName}
          firstFighterHeadshot={firstFighterPhoto}
          firstFighterFlag={firstFighterFlag}
          firstFighterRecord={firstFighterRecord}
          firstFighterIsWinner={firstFighterWinner}
          // Second fighter
          secondFighterId={secondFighterId}
          secondFighterName={secondFighterName}
          secondFighterHeadshot={secondFighterPhoto}
          secondFighterFlag={secondFighterFlag}
          secondFighterRecord={secondFighterRecord}
          secondFighterIsWinner={secondFighterWinner}
          // Live fight state
          clock={clock}
          period={period}
          results={results}
          // Status
          gameStatusDescription={gameStatusDescription}
        />

        {!dontShowDetails && (
          <View style={styles.innerContainer}>
            <FanPrediction
              votes={liveVotes}
              castVote={castLiveVote}
              gameId={gameId}
              awayId={secondFighterId}
              awayCode={secondFighterLastName}
              awayLogo={secondFighterFlag}
              awayColor={secondFighterColor}
              homeId={firstFighterId}
              homeCode={firstFighterLastName}
              homeLogo={firstFighterFlag}
              homeColor={firstFighterColor}
              state={state}
            />

            <MatchupComparison
              firstFighterId={firstFighterId}
              secondFighterId={secondFighterId}
              firstFighterStance={firstFighterStance}
              secondFighterStance={secondFighterStance}
              firstFighterHeight={firstFighterHeight}
              firstFighterAge={firstFighterAge}
              secondFighterAge={secondFighterAge}
              secondFighterHeight={secondFighterHeight}
              firstFighterWeight={firstFighterWeight}
              secondFighterWeight={secondFighterWeight}
              firstFighterName={firstFighterName}
              secondFighterName={secondFighterName}
              firstFighterFlag={firstFighterFlag}
              secondFighterFlag={secondFighterFlag}
              firstFighterCountry={firstFighterCountry}
              secondFighterCountry={secondFighterCountry}
              firstFighterRecord={firstFighterRecord}
              secondFighterRecord={secondFighterRecord}
              firstFighterClass={firstFighterClass}
              secondFighterClass={secondFighterClass}
              firstFighterReach={firstFighterReach}
              secondFighterReach={secondFighterReach}
              firstFighterIsWinner={firstFighterWinner}
              secondFighterIsWinner={secondFighterWinner}
              secondFighterIsChampion={secondFighterIsChampion}
              firstFighterIsChampion={firstFighterIsChampion}
              gameStatusDescription={gameStatusDescription}
              isDark={isDark}
            />

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
