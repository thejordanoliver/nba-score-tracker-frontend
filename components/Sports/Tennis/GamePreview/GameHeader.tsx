import { View } from "react-native";
import { gameHeaderStyles } from "styles/GameDetailStyles/GameHeaderStyles";
import { CompetitorRow } from "./CompetitorRow";
import { GameInfo } from "./GameInfo";

type Props = {
  headline?: string | null;
  leftCompetitorId: string;
  leftCompetitorName: string;
  leftCompetitorCountry: string;
  leftCompetitorFlag: string;
  leftCompetitorFlags: string[];
  leftCompetitorRank: number | null;
  leftCompetitorScore: number | null;
  leftCompetitorWins: boolean;
  leftCompetitorServing: boolean;
  rightCompetitorId: string;
  rightCompetitorName: string;
  rightCompetitorCountry: string;
  rightCompetitorFlag: string;
  rightCompetitorFlags: string[];
  rightCompetitorRank: number | null;
  rightCompetitorScore: number | null;
  rightCompetitorWins: boolean;
  rightCompetitorServing: boolean;
  isDark: boolean;
  date?: string;
  time?: string;
  broadcast?: string;
  state: string | null | undefined;
  gameStatusDescription: string | undefined;
  gameStatusDetail: string | undefined;
};

export default function GameHeader({
  headline,
  leftCompetitorId,
  leftCompetitorName,
  leftCompetitorCountry,
  leftCompetitorFlag,
  leftCompetitorFlags,
  leftCompetitorRank,
  leftCompetitorScore,
  leftCompetitorWins,
  leftCompetitorServing,
  rightCompetitorId,
  rightCompetitorName,
  rightCompetitorCountry,
  rightCompetitorFlag,
  rightCompetitorFlags,
  rightCompetitorRank,
  rightCompetitorScore,
  rightCompetitorWins,
  rightCompetitorServing,
  state,
  gameStatusDetail,
  gameStatusDescription,
  isDark,
  date = "",
  time = "",
  broadcast = "",
}: Props) {
  const styles = gameHeaderStyles(isDark);

  return (
    <View style={styles.container}>
      <View style={styles.teamsContainer}>
        <CompetitorRow
          id={leftCompetitorId}
          name={leftCompetitorName}
          country={leftCompetitorCountry}
          flag={leftCompetitorFlag}
          flags={leftCompetitorFlags}
          rank={leftCompetitorRank}
          score={leftCompetitorScore}
          isWinner={leftCompetitorWins}
          serving={leftCompetitorServing}
          state={state}
          isDark={isDark}
          isHome={false}
        />

        <GameInfo
          date={date}
          time={time}
          broadcast={broadcast}
          gameStatusDetail={gameStatusDetail}
          gameStatusDescription={gameStatusDescription}
          isDark={isDark}
        />

        <CompetitorRow
          id={rightCompetitorId}
          name={rightCompetitorName}
          country={rightCompetitorCountry}
          flag={rightCompetitorFlag}
          flags={rightCompetitorFlags}
          rank={rightCompetitorRank}
          score={rightCompetitorScore}
          isWinner={rightCompetitorWins}
          serving={rightCompetitorServing}
          state={state}
          isDark={isDark}
          isHome={true}
        />
      </View>
    </View>
  );
}
