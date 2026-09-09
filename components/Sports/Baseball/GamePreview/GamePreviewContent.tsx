import {
  GameLocation,
  GameTeamStats,
  HeadCoaches,
  LastFiveGames,
  LineScore,
  MatchupPredictor,
  Officials,
} from "@/components/Sports/Basketball/GameDetails";
import {
  PlayerStatsByTeam,
  TeamStat,
} from "@/hooks/BaseballHooks/useBaseballGameDetails";
import { Coach } from "@/hooks/useTeams";
import { GamePreviewModalStyles } from "@/styles/ModalsStyles/GamePreviewModalStyles";
import { Highlight } from "@/types/types";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React from "react";
import { View } from "react-native";
import { LastFiveGame } from "../../Basketball/GameDetails/LastFiveGames";
import BoxScore from "../GameDetails/BoxScore";
import TeamInjuries from "../GameDetails/InjuryReport/TeamInjuries";

type GamePreviewContentProps = {
  homeId: number;
  homeColor: string;
  homeCode: string;
  homeName: string;
  homeLogo: any;
  homeHeaderLogo: any;
  awayHeaderLogo: any;
  awayId: number;
  awayColor: string;
  awayCode: string;
  awayName: string;
  awayLogo: any;
  homeChance: number;
  awayChance: number;
  lineScore?: {
    home: string[];
    away: string[];
  };
  homeLastGames: LastFiveGame[];
  awayLastGames: LastFiveGame[];
  homeCoach: Coach | undefined | null;
  awayCoach: Coach | undefined | null;
  homeHits: number | null;
  awayHits: number | null;
  homeRuns: number | null;
  awayRuns: number | null;
  awayErrors: number;
  homeErrors: number;
  teamStats: {
    team: any;
    stats: TeamStat[];
  }[];
  playerStats: PlayerStatsByTeam[];

  officials: any[];
  injuries: any[];

  error?: string | null;
  venueImage?: any;
  venueName?: string;
  venueLocation?: string;
  venueAddress?: string;
  venueCapacity?: number | null;
  venueAttendance?: number | null;
  weather?: any;
  gameStatusDescription: string;
  league: string;
  state: string | null;
  isChampionship: boolean;
  highlights: Highlight[];
  isMLB: boolean;
  isDark: boolean;
};

export default function GamePreviewContent({
  homeId,
  homeColor,
  homeCode,
  homeName,
  homeLogo,
  homeHeaderLogo,
  awayId,
  awayColor,
  awayCode,
  awayName,
  awayLogo,
  awayHeaderLogo,
  homeLastGames,
  awayLastGames,
  lineScore,
  homeHits,
  awayHits,
  homeRuns,
  awayRuns,
  awayErrors,
  homeErrors,
  teamStats,
  playerStats,
  homeCoach,
  awayCoach,
  officials,
  injuries,
  homeChance,
  awayChance,
  venueImage,
  venueName,
  venueLocation,
  venueAddress,
  venueCapacity,
  venueAttendance,
  weather,
  isChampionship,
  state,
  league,
  isMLB,
  isDark,
}: GamePreviewContentProps) {
  const styles = GamePreviewModalStyles({ isDark: isDark });

  return (
    <BottomSheetScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainerStyle}
    >
      <View style={styles.bottomSheetScrollViewWrapper}>
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
        <LineScore
          linescore={lineScore}
          homeCode={homeCode}
          awayCode={awayCode}
          homeHits={homeHits}
          awayHits={awayHits}
          homeRuns={homeRuns}
          awayRuns={awayRuns}
          awayErrors={awayErrors}
          homeErrors={homeErrors}
          isDark={isDark}
          state={state}
          league={league}
        />

        <GameTeamStats
          stats={teamStats}
          homeLogo={homeLogo}
          awayLogo={awayLogo}
          homeCode={homeCode}
          awayCode={awayCode}
          awayColor={awayColor}
          homeColor={homeColor}
          isDark={isDark}
          state={state}
          league={league}
        />

        <BoxScore
          awayTeamId={awayId}
          homeTeamId={homeId}
          awayName={awayName}
          homeName={homeName}
          awayLogo={awayLogo}
          homeLogo={homeLogo}
          playerStats={playerStats}
          state={state}
          isDark={isDark}
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

        <Officials officials={officials ?? []} isDark={isDark} state={state} />

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

        <TeamInjuries
          injuries={injuries}
          homeId={homeId}
          awayId={awayId}
          homeCode={homeCode}
          awayCode={awayCode}
          homeLogo={homeLogo}
          awayLogo={awayLogo}
          state={state}
          league={league}
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
    </BottomSheetScrollView>
  );
}
