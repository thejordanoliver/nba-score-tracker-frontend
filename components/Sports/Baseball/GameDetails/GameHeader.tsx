import { Text, View } from "react-native";
import { gameHeaderStyles } from "styles/GameDetailStyles/GameHeaderStyles";
import { CenterInfo } from "./CenterInfo";
import { TeamRow } from "./TeamRow";

type Props = {
  state: string | null;
  homeRank: number | undefined | null;
  awayRank: number | undefined | null;
  homeName: string;
  awayName: string;
  homeId: number;
  awayId: number;
  homeLogo: any;
  awayLogo: any;
  homeScore: number;
  awayScore: number;
  isDark: boolean;
  isTopInning: boolean;
  isBottomInning: boolean;
  homeWins: boolean;
  awayWins: boolean;
  date: string;
  headline: string | null;
  outs?: number;
  time: string;
  broadcast?: string;
  homeRecord: string;
  awayRecord: string;
  gameStatusDescription: string;
  gameStatusDetail: string;
  league: string;
  bases: {
    onFirst: boolean;
    onSecond: boolean;
    onThird: boolean;
  };
};

export default function GameHeader({
  state,
  isTopInning,
  isBottomInning,
  headline,
  homeId,
  awayId,
  homeName,
  awayName,
  homeRank,
  awayRank,
  homeLogo,
  awayLogo,
  homeScore,
  awayScore,
  homeWins,
  awayWins,
  homeRecord,
  awayRecord,
  gameStatusDetail,
  gameStatusDescription,
  isDark,
  date,
  time,
  broadcast,
  outs = 0,
  bases,
  league,
}: Props) {
  const styles = gameHeaderStyles(isDark);

  return (
    <View style={styles.container}>
      <View style={styles.headlineContainer}>
        <Text style={styles.headlineText}>{headline}</Text>
      </View>

      <View style={styles.teamsContainer}>
        {/* Away Team Row */}
        <TeamRow
          state={state}
          id={awayId}
          logo={awayLogo}
          name={awayName}
          score={awayScore}
          rank={awayRank}
          isWinner={awayWins}
          record={awayRecord}
          gameStatusDescription={gameStatusDescription}
          isHome={false}
          isDark={isDark}
          league={league}
        />

        <CenterInfo
          state={state}
          gameStatusDescription={gameStatusDescription}
          gameStatusDetail={gameStatusDetail}
          date={date}
          time={time}
          isDark={isDark}
          broadcast={broadcast}
          isTopInning={isTopInning}
          isBottomInning={isBottomInning}
          outs={outs}
          bases={bases}
        />

        <TeamRow
          state={state}
          id={homeId}
          logo={homeLogo}
          name={homeName}
          rank={homeRank}
          score={homeScore}
          isWinner={homeWins}
          record={homeRecord}
          gameStatusDescription={gameStatusDescription}
          isHome={true}
          isDark={isDark}
          league={league}
        />
      </View>
    </View>
  );
}
