import { Text, View } from "react-native";
import { gameHeaderStyles } from "styles/GameDetailStyles/GameHeaderStyles";
import { FighterRow } from "./CompetitorRow";
import { GameInfo } from "./GameInfo";

type Props = {
  headline?: string | null;
  firstFighterId?: number;
  secondFighterId?: number;
  firstFighterHeadshot: string;
  secondFighterHeadshot: string;
  firstFighterName: string;
  secondFighterName: string;
  firstFighterIsWinner: boolean;
  secondFighterIsWinner: boolean;
  firstFighterRecord?: string;
  secondFighterRecord?: string;
  firstFighterFlag?: string;
  secondFighterFlag?: string;
  period?: string;
  clock: string | undefined;
  isDark: boolean;
  date?: string;
  time?: string;
  broadcast?: string;
  gameStatusDescription: string | undefined;
  results: string | null | undefined;
};

export default function GameHeader({
  headline,
  firstFighterId,
  secondFighterId,
  firstFighterHeadshot,
  firstFighterName,
  secondFighterHeadshot,
  secondFighterName,
  firstFighterRecord,
  firstFighterFlag,
  secondFighterFlag,
  secondFighterRecord,
  results,
  gameStatusDescription,
  period,
  clock,
  isDark,
  date = "",
  time = "",
  broadcast = "",
  firstFighterIsWinner,
  secondFighterIsWinner,
}: Props) {
  const styles = gameHeaderStyles(isDark);

  return (
    <View style={styles.container}>
      <Text style={styles.headlineText}>{headline}</Text>

      <View style={styles.teamsContainer}>
        <FighterRow
          id={secondFighterId}
          headshot={secondFighterHeadshot}
          name={secondFighterName}
          record={secondFighterRecord}
          flag={secondFighterFlag}
          isWinner={secondFighterIsWinner}
          gameStatusDescription={gameStatusDescription}
          isFirstFighter={false}
          isDark={isDark}
        />

        <GameInfo
          date={date}
          time={time}
          period={period}
          clock={clock}
          broadcast={broadcast}
          gameStatusDescription={gameStatusDescription}
          results={results}
          isDark={isDark}
        />

        <FighterRow
          id={firstFighterId}
          headshot={firstFighterHeadshot}
          name={firstFighterName}
          record={firstFighterRecord}
          flag={firstFighterFlag}
          isWinner={firstFighterIsWinner}
          gameStatusDescription={gameStatusDescription}
          isFirstFighter={true}
          isDark={isDark}
        />
      </View>
    </View>
  );
}
