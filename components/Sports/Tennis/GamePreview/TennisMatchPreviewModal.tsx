import { usePreferences } from "@/contexts/PreferencesContext";
import { GamePreviewModalStyles } from "@/styles/ModalsStyles/GamePreviewModalStyles";
import { TennisMatch } from "@/types/tennis/tennis";
import { getBroadcastDisplay } from "@/utils/games";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import { BlurView } from "expo-blur";
import React, { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import { formatDate, formatTime, safeDate } from "utils/dateUtils";
import { snapPoints } from "utils/modalUtils";
import { CompetitorRow } from "./CompetitorRow";
import { GameInfo } from "./GameInfo";

type Props = {
  visible: boolean;
  match: TennisMatch;
  onClose: () => void;
};

export default function GamePreviewModal({ visible, match, onClose }: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const sheetRef = useRef<BottomSheetModal>(null);
  const styles = GamePreviewModalStyles({ isDark: isDark });

  useEffect(() => {
    if (!sheetRef.current) return;
    if (visible) {
      requestAnimationFrame(() => sheetRef.current?.present());
    } else {
      requestAnimationFrame(() => sheetRef.current?.dismiss());
    }
  }, [visible]);

  const gameDate = safeDate(match.date);
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);
  const broadcast = getBroadcastDisplay(match.broadcasts);

  const gameStatusDescription = match?.status.description ?? "";
  const gameStatusDetail = match?.status.detail ?? "";
  const tbd = gameStatusDetail.includes("TBD") ? "TBD" : null;

  const competitors = match.competitors.slice(0, 2);
  const leftCompetitor = competitors[0];
  const rightCompetitor = competitors[1];

  const leftCompetitorId = leftCompetitor.id;
  const rightCompetitorId = rightCompetitor.id;

  const leftCompetitorName = leftCompetitor.shortName;
  const rightCompetitorName = rightCompetitor.shortName;
  const leftScore = leftCompetitor.score;
  const rightScore = rightCompetitor.score;
  const leftServing = leftCompetitor.serving;
  const rightServing = rightCompetitor.serving;
  const leftFlag = leftCompetitor.flag;
  const leftFlags = leftCompetitor.flags;
  const rightFlag = rightCompetitor.flag;
  const rightFlags = rightCompetitor.flags;
  const leftCompetitorCountry = leftCompetitor.country;
  const rightCompetitorCountry = rightCompetitor.country;
  const leftWins = leftCompetitor.winner ?? false;
  const rightWins = rightCompetitor.winner ?? false;
  const leftRank = leftCompetitor.rank;
  const rightRank = rightCompetitor.rank;

  const headline = match.tournamentShortName;

  const isLoading = !match;

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
                <CompetitorRow
                  id={leftCompetitorId}
                  name={leftCompetitorName}
                  country={leftCompetitorCountry}
                  flag={leftFlag}
                  flags={leftFlags}
                  rank={leftRank}
                  score={leftScore}
                  isWinner={leftWins}
                  serving={leftServing}
                  gameStatusDescription={gameStatusDescription}
                  isDark={isDark}
                  isHome={false}
                />

                {/* Game Info */}
                <GameInfo
                  date={formattedDate}
                  time={tbd || formattedTime}
                  broadcast={broadcast}
                  gameStatusDetail={gameStatusDetail}
                  gameStatusDescription={gameStatusDescription}
                  isDark={isDark}
                />

                {/* Home Team Row */}
                <CompetitorRow
                  id={rightCompetitorId}
                  name={rightCompetitorName}
                  country={rightCompetitorCountry}
                  flag={rightFlag}
                  flags={rightFlags}
                  rank={rightRank}
                  score={rightScore}
                  isWinner={rightWins}
                  serving={rightServing}
                  gameStatusDescription={gameStatusDescription}
                  isDark={isDark}
                  isHome={true}
                />
              </View>
            </>
          )}
        </BlurView>
      </View>
    </BottomSheetModal>
  );
}
