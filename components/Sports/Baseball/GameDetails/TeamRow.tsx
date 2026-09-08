import { Colors } from "constants/styles";
import { useRouter } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import {
  BaseballProps,
  TeamRowStyles,
} from "styles/GameDetailStyles/TeamRow.styles";

export const TeamRow = ({
  id,
  rank,
  logo,
  record,
  name,
  isDark,
  isHome = false,
  score,
  isWinner,
  league,
  gameStatusDescription,
  state,
}: BaseballProps) => {
  const router = useRouter();
  const styles = TeamRowStyles(isDark);

  const inProgress = state === "in";
  const isFinal = gameStatusDescription === "Final";

  const getScoreStyle = () => {
    if (score == null) {
      return { color: Colors.midTone, opacity: 0.5 };
    }

    if (inProgress) {
      return { color: isDark ? Colors.white : Colors.black };
    }

    if (isFinal) {
      return {
        color: isWinner
          ? isDark
            ? Colors.dark.white
            : Colors.light.black
          : Colors.midTone,
      };
    }

    return { color: Colors.midTone };
  };

  const handleTeamPress = () => {
    if (id && league === "mlb") router.push(`/team/mlb/${id}`);
    if (id && league === "cb") router.push(`/team/cb/${id}`);
    if (id && league === "sb") router.push(`/team/mlb/${id}`);
  };

  const showRecordInsteadOfScore = state === "pre";

  return (
    <View style={styles.row}>
      {/* Home Score */}
      {isHome && (
        <Text
          style={
            showRecordInsteadOfScore
              ? styles.preGameRecord
              : [styles.score, getScoreStyle()]
          }
        >
          {showRecordInsteadOfScore ? record : score}
        </Text>
      )}

      {/* Team Info */}
      <View style={styles.teamInfoContainer}>
        <Pressable onPress={handleTeamPress}>
          <Image source={logo} style={styles.logo} />
        </Pressable>

        <View style={styles.teamInfo}>
          <Text
            style={styles.teamName}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.5}
          >
            <Text style={styles.rank}>{rank} </Text>
            {name}
          </Text>

          {!showRecordInsteadOfScore && !inProgress && (
            <Text style={styles.record}>{record}</Text>
          )}
        </View>
      </View>

      {/* Away Score */}
      {!isHome && (
        <View style={styles.scoreWrapper}>
          <Text
            style={
              showRecordInsteadOfScore
                ? [styles.preGameRecord]
                : [styles.score, getScoreStyle()]
            }
          >
            {showRecordInsteadOfScore ? record : (score ?? "")}
          </Text>
        </View>
      )}
    </View>
  );
};
