//./CFB/GamePreview/CFBGamePreviewModal.tsx
import { Colors } from "@/constants/styles";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useVenue } from "@/hooks/useVenue";
import { useWeather } from "@/hooks/useWeather";
import {
  formatDate,
  formatTime,
  getHolidayLabel,
  safeDate,
} from "@/utils/dateUtils";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import { GamePreviewModalStyles } from "styles/ModalsStyles/GamePreviewModalStyles";
import { MMAFight } from "types/mma/mma";
import {
  formatPeriod,
  formatVenueAddress,
  getBroadcastDisplay,
} from "utils/games";
import { snapPoints } from "utils/modalUtils";
import { FighterRow } from "../GameDetails/FighterRow";
import { GameInfo } from "../GameDetails/GameInfo";
import GamePreviewContent from "./GamePreviewContent";

const leftStancePlaceholder =
  "https://res.cloudinary.com/dm3qtdhag/image/upload/v1781892206/leftStancePlaceholder_bplhud.png";
const rightStancePlaceholder =
  "https://res.cloudinary.com/dm3qtdhag/image/upload/v1781892222/rightStancePlaceholder_igoaxo.png";
const headshotPlaceholder =
  "https://res.cloudinary.com/dm3qtdhag/image/upload/v1781892365/playerPlaceholder_vi9zk3.png";

type Props = {
  game: MMAFight;
  visible: boolean;
  onClose: () => void;
};

export default function MMAGamePreviewModal({ game, visible, onClose }: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const sheetRef = useRef<BottomSheetModal>(null);

  // Modal open/close
  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const gameDate = safeDate(game?.date);
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);
  const holidayLabel = getHolidayLabel(gameDate);
  const headline = game.headline || holidayLabel;

  const firstFighter = game?.competitors?.[0];
  const secondFighter = game?.competitors?.[1];
  const firstFighterId = Number(firstFighter?.id);
  const secondFighterId = Number(secondFighter?.id);
  const firstFighterLastName = firstFighter?.lastName ?? "TBD";
  const secondFighterLastName = secondFighter?.lastName ?? "TBD";
  const firstFighterName = firstFighter?.shortName ?? "TBD";
  const secondFighterName = secondFighter?.shortName ?? "TBD";
  const firstFighterColor = firstFighter?.color ?? Colors.midTone;
  const secondFighterColor = secondFighter?.color ?? Colors.midTone;
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

  const gameStatusDescription = game.status.description;
  const gameStatusDetail = game.status.shortDetail ?? "";
  const tbd = gameStatusDetail.includes("TBD") ? "TBD" : null;
  const state = game.status.state;

  const styles = GamePreviewModalStyles({
    isDark: isDark,
    homeColor: firstFighterColor,
    awayColor: secondFighterColor,
  });

  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isSuspended = gameStatusDescription === "Suspended";
  const isForfeited = gameStatusDescription === "Forfeit";
  const dontShowDetails =
    isDelayed || isCanceled || isPostponed || isSuspended || isForfeited;

  const resultText = game.method;
  const results =
    resultText?.toLowerCase() === "submission"
      ? "SUB"
      : resultText?.toLowerCase() === "decision"
        ? "DEC"
        : resultText;
  const broadcasts = game?.broadcasts;
  const broadcast = getBroadcastDisplay(broadcasts);
  const period = formatPeriod({ period: game?.status?.period, isMMA: true });
  const clock = game?.status?.displayClock;

  const venueId = Number(game?.venue?.id);
  const { venue } = useVenue({ sport: "mma", id: venueId });
  const { weather } = useWeather({
    lat: Number(venue?.latitude),
    lon: Number(venue?.longitude),
    location: venue?.city,
    date: formattedDate,
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
          {headline && <Text style={styles.headlineText}>{headline}</Text>}

          <View style={styles.gameHeaderContainer}>
            <FighterRow
              id={secondFighterId}
              headshot={secondFighterPhoto}
              name={secondFighterName}
              record={secondFighterRecord}
              flag={secondFighterFlag}
              isWinner={secondFighterWinner}
              gameStatusDescription={gameStatusDescription}
              isFirstFighter={false}
              isDark={isDark}
            />

            <GameInfo
              date={formattedDate}
              time={tbd || formattedTime}
              period={period}
              clock={clock}
              broadcast={broadcast}
              gameStatusDescription={gameStatusDescription}
              results={results}
              isDark={isDark}
            />

            <FighterRow
              id={firstFighterId}
              headshot={firstFighterPhoto}
              name={firstFighterName}
              record={firstFighterRecord}
              flag={firstFighterFlag}
              isWinner={firstFighterWinner}
              gameStatusDescription={gameStatusDescription}
              isFirstFighter={true}
              isDark={isDark}
            />
          </View>

          {/* --- Scrollable Content --- */}
          {!dontShowDetails && (
            <GamePreviewContent
              state={state}
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
              firstFighterName={firstFighterLastName}
              secondFighterName={secondFighterLastName}
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
              venueImage={venueImage}
              venueLocation={venueLocation}
              venueName={venueName}
              venueAddress={venueAddress}
              venueCapacity={venueCapacity}
              venueAttendance={venueAttendance}
              weather={weather}
              isDark={isDark}
            />
          )}
        </BlurView>
      </View>
    </BottomSheetModal>
  );
}
