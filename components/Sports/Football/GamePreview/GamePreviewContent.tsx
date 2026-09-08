import {
  GameLocation,
  GameTeamStats,
  HeadCoaches,
  Highlights,
  LastFiveGames,
  LineScore,
  MatchupPredictor,
  Officials,
} from "@/components/Sports/Basketball/GameDetails";
import {
  FootballDrive,
  PlayObject,
  TeamInjury,
  TeamLeaders,
} from "@/hooks/FootballHooks/useFootballGameDetails";
import { Coach } from "@/hooks/useTeams";
import { GamePreviewModalStyles } from "@/styles/ModalsStyles/GamePreviewModalStyles";
import { Highlight } from "@/types/types";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React from "react";
import { View } from "react-native";
import TeamInjuries from "../../Baseball/GameDetails/InjuryReport/TeamInjuries";
import { TeamStatsEntry } from "../../Basketball/GameDetails/GameTeamStats";
import { LastFiveGame } from "../../Basketball/GameDetails/LastFiveGames";
import GameLeaders from "../GameDetails/Leaders";
import PlayByPlay from "../GameDetails/PlayByPlay/PlayByPlay";

type GamePreviewContentProps = {
  homeColor: string;
  homeCode: string;
  homeLogo: any;
  awayColor: string;
  awayCode: string;
  homeId: number;
  awayId: number;
  homeName: string;
  awayName: string;
  awayLogo: any;
  homeHeaderLogo: any;
  awayHeaderLogo: any;
  homeChance: number;
  awayChance: number;
  lineScore?: {
    home: string[];
    away: string[];
  };
  neutralSite: boolean | undefined;
  fieldPlay: PlayObject | null;
  drives: {
    previous: FootballDrive[];
    current: FootballDrive[];
  };
  teamStats?: TeamStatsEntry[];
  leaders: TeamLeaders[];
  injuries: TeamInjury[];
  homeLastGames: LastFiveGame[];
  awayLastGames: LastFiveGame[];
  homeCoach: Coach | undefined | null;
  awayCoach: Coach | undefined | null;
  officials: any[];
  error?: string | null;
  venueImage?: any;
  venueName?: string;
  venueLocation?: string;
  venueSurface?: boolean;
  venueAddress?: string;
  highlights: Highlight[];
  venueCapacity?: number | null;
  venueAttendance?: number | null;
  weather?: any;
  state: string;
  league: string;
  isDark: boolean;
};

export default function GamePreviewContent({
  homeColor,
  homeId,
  homeCode,
  homeLogo,
  homeHeaderLogo,
  awayHeaderLogo,
  awayColor,
  awayId,
  awayCode,
  awayLogo,
  lineScore,
  neutralSite,
  teamStats,
  leaders,
  injuries,
  officials,
  homeName,
  awayName,
  fieldPlay,
  drives,
  homeCoach,
  awayCoach,
  homeLastGames,
  awayLastGames,
  homeChance,
  awayChance,
  venueImage,
  venueName,
  venueLocation,
  venueSurface,
  venueAddress,
  venueCapacity,
  venueAttendance,
  highlights,
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
          state={state}
          league={league}
          isDark={isDark}
        />

        <PlayByPlay
          width={420}
          height={130}
          awayCode={awayCode}
          homeCode={homeCode}
          awayName={awayName}
          homeName={homeName}
          awayLogo={awayLogo}
          homeLogo={homeLogo}
          awayTeamId={awayId}
          homeTeamId={homeId}
          awayColor={awayColor}
          homeColor={homeColor}
          drives={drives}
          play={fieldPlay}
          showPlay={Boolean(fieldPlay)}
          neutralSite={neutralSite}
          isDark={isDark}
          state={state}
          league={league}
        />

        <GameTeamStats
          stats={teamStats}
          awayName={awayCode}
          awayLogo={awayLogo}
          awayColor={awayColor}
          homeName={homeCode}
          homeLogo={homeLogo}
          homeColor={homeColor}
          league={league}
          state={state}
          isDark={isDark}
        />

        <GameLeaders
          leaders={leaders}
          awayId={awayId}
          homeId={homeId}
          awayLogo={awayLogo}
          homeLogo={homeLogo}
          awayCode={awayCode}
          homeCode={homeCode}
          league={league}
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

        <TeamInjuries
          injuries={injuries}
          awayId={awayId}
          homeId={homeId}
          homeCode={homeCode}
          awayCode={awayCode}
          homeLogo={homeLogo}
          awayLogo={awayLogo}
          state={state}
          league={league}
          isDark={isDark}
        />

        <HeadCoaches
          homeCode={homeCode}
          awayCode={awayCode}
          homeCoach={homeCoach}
          awayCoach={awayCoach}
          homeLogo={homeLogo}
          awayLogo={awayLogo}
          state={state}
          isDark={isDark}
        />
        <Officials officials={officials ?? []} state={state} isDark={isDark} />

        <GameLocation
          venueImage={venueImage}
          venueName={venueName}
          location={venueLocation}
          address={venueAddress}
          venueCapacity={venueCapacity}
          venueAttendance={venueAttendance}
          weather={weather}
          grass={venueSurface}
          surface={"football"}
          isDark={isDark}
        />
      </View>
    </BottomSheetScrollView>
  );
}
