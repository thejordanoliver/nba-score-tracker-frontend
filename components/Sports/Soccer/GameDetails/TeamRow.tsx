import { Colors } from "constants/styles";
import { useRouter } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import {
  SoccerProps,
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
  isTie,
  isAllStar,
  isNational,
  state,
  gameStatusDescription,
  league,
}: SoccerProps) => {
  const router = useRouter();
  const styles = TeamRowStyles(isDark);

  const isScheduled = gameStatusDescription === "Scheduled";
  const isSuspended = gameStatusDescription === "Suspended";
  const isCanceled = gameStatusDescription === "Canceled";
  const isPostponed = gameStatusDescription === "Postponed";
  const isForfeited = gameStatusDescription === "Forfeited";
  const isFinal = state === "post";
  const inProgress = state === "in";

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
          : isTie
            ? isDark
              ? Colors.dark.white
              : Colors.light.black
            : Colors.midTone,
      };
    }

    return { color: Colors.midTone };
  };

  const handleTeamPress = () => {
    if (!id || isNational || isAllStar) return;

    router.push({
      pathname: "/team/soccer/[teamId]",
      params: {
        teamId: id,
        league,
      },
    });
  };
  const showRecordInsteadOfScore =
    isScheduled ||
    isPostponed ||
    isForfeited ||
    isSuspended ||
    isCanceled ||
    score == null;

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
                ? styles.preGameRecord
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
