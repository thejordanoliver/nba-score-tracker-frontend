import {
  GameLocation,
  GameTeamStats,
  HeadCoaches,
  Highlights,
  LineScore,
  MatchupPredictor,
} from "@/components/Sports/Basketball/GameDetails";
import BoxScore from "@/components/Sports/Basketball/GameDetails/BoxScore";
import LastFiveGames, {
  LastFiveGame,
} from "@/components/Sports/Basketball/GameDetails/LastFiveGames";
import GameLeaders from "@/components/Sports/Basketball/GameDetails/Leaders";
import Officials from "@/components/Sports/Basketball/GameDetails/Officials";
import { Official } from "@/hooks/FootballHooks/useFootballGameDetails";
import { Coach } from "@/hooks/useTeams";
import { GamePreviewModalStyles } from "@/styles/ModalsStyles/GamePreviewModalStyles";
import { Highlight } from "@/types/types";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React from "react";
import { View } from "react-native";

type GamePreviewContentProps = {
  homeId: any;
  homeColor: string;
  homeName: string;
  homeCode: string;
  homeLogo: any;
  homeHeaderLogo: any;
  awayHeaderLogo: any;
  awayId: number;
  awayColor: string;
  awayName: string;
  awayCode: string;
  awayLogo: any;
  homeChance: number;
  awayChance: number;
  lineScore?: {
    home: string[];
    away: string[];
  };
  homeLastGames: LastFiveGame[];
  awayLastGames: LastFiveGame[];
  playerStats: any[];
  teamStats: any[];
  officials: Official[];
  highlights: Highlight[];
  homeCoach: Coach | undefined | null;
  awayCoach: Coach | undefined | null;
  error?: string | null;
  leaders: any;
  venueImage?: any;
  venueName?: string;
  venueLocation?: string;
  venueAddress?: string;
  venueCapacity?: number | null;
  venueAttendance?: number | null;
  weather?: any;
  state: string | null;
  league: string;
  isDark: boolean;
};

export default function GamePreviewContent({
  homeId,
  homeColor,
  homeName,
  homeCode,
  homeLogo,
  homeHeaderLogo,
  awayHeaderLogo,
  awayId,
  awayColor,
  awayName,
  awayCode,
  awayLogo,
  homeChance,
  awayChance,
  lineScore,
  highlights,
  homeCoach,
  awayCoach,
  homeLastGames,
  awayLastGames,
  playerStats,
  teamStats,
  officials,
  leaders,
  venueImage,
  venueName,
  venueLocation,
  venueAddress,
  venueCapacity,
  venueAttendance,
  weather,
  state,
  league,
  isDark,
}: GamePreviewContentProps) {
  const styles = GamePreviewModalStyles({ isDark: isDark });

  return (
    <BottomSheetScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainerStyle}
    >
      <View style={styles.bottomSheetScrollViewWrapper}>
        <LineScore
          linescore={lineScore}
          awayCode={awayCode}
          homeCode={homeCode}
          league={league}
          isDark={isDark}
          state={state}
        />

        <MatchupPredictor
          homeId={homeId}
          homeCode={homeCode}
          homeLogo={homeLogo}
          homeHeaderLogo={homeHeaderLogo}
          homeChance={homeChance}
          homeColor={homeColor}
          awayCode={awayCode}
          awayId={awayId}
          awayLogo={awayLogo}
          awayHeaderLogo={awayHeaderLogo}
          awayChance={awayChance}
          awayColor={awayColor}
          state={state}
          isDark={isDark}
          size={180}
        />

        <GameLeaders
          leaders={leaders}
          homeId={homeId}
          homeLogo={homeLogo}
          awayId={awayId}
          awayLogo={awayLogo}
          state={state}
          isDark={isDark}
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
          league={league}
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
          league={league}
          state={state}
          isDark={isDark}
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
      </View>
    </BottomSheetScrollView>
  );
}
