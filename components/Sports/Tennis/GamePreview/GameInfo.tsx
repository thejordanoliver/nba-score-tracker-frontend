import { Text, View } from "react-native";
import { gameInfoStyles } from "styles/GameDetailStyles/GameInfoStyles";

type GameInfoProps = {
  date: string;
  time: string;
  isDark: boolean;
  state: string | undefined;
  gameStatusDescription: string | undefined;
  gameStatusDetail: string | undefined;
  broadcast?: string;
};

export function GameInfo({
  date,
  time,
  isDark,
  gameStatusDescription,
  state,
  gameStatusDetail,
  broadcast,
}: GameInfoProps) {
  const styles = gameInfoStyles(isDark);

  const isScheduled = state === "pre";
  const isFinal = state === "post";
  const isCanceled = gameStatusDescription === "Canceled";
  const isPostponed = gameStatusDescription === "Postponed";
  const isDelayed = gameStatusDescription === "Delayed";
  const isForfeited = gameStatusDescription === "Forfeited";
  const inProgress = gameStatusDescription === "In Progress";

  return (
    <View style={styles.container}>
      {isScheduled && (
        <View style={styles.infoWrapper}>
          <Text style={styles.date}>{date}</Text>
          <View style={styles.statusDivider} />
          <Text style={styles.date}>{time}</Text>
        </View>
      )}

      {(isDelayed || isCanceled || isPostponed || isForfeited) && (
        <View style={styles.infoWrapper}>
          <Text style={styles.finalText}>{gameStatusDescription}</Text>
        </View>
      )}
      {inProgress && (
        <View>
          <View style={styles.infoWrapper}>
            <Text style={styles.clock}>{gameStatusDetail}</Text>
          </View>
        </View>
      )}

      {isFinal && (
        <View style={styles.infoWrapper}>
          <Text style={styles.finalText}>{date}</Text>
          <View style={styles.finalStatusDivider} />
          <Text style={styles.finalText}>{gameStatusDetail}</Text>
        </View>
      )}

      {broadcast && <Text style={styles.broadcasts}>{broadcast}</Text>}
    </View>
  );
}
