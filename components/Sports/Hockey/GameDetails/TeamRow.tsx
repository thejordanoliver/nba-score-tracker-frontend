import { Colors } from "constants/styles";
import { useRouter } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import {
  NHLProps,
  TeamRowStyles,
} from "styles/GameDetailStyles/TeamRow.styles";

/* -----------------------------------------------------
 * Helpers
 * --------------------------------------------------- */

export const TeamRow = ({
  id,
  name,
  rank,
  logo,
  record,
  isDark,
  isHome = false,
  score,
  isWinner,

  gameStatusDescription,
  timeouts,
  league,
}: NHLProps) => {
  const router = useRouter();
  const styles = TeamRowStyles(isDark);

  /* -----------------------------------------------------
   * Game State
   * --------------------------------------------------- */
  const isFinal = gameStatusDescription === "Final";
  const isScheduled =
    gameStatusDescription === "Scheduled" ||
    gameStatusDescription === "Delayed" ||
    gameStatusDescription === "Postponed";

  const inProgress = ["In Progress", "Halftime", "End of Period"].includes(
    gameStatusDescription ?? "",
  );

  const showRecordInsteadOfScore = isScheduled || score == null;

  /* -----------------------------------------------------
   * Routing
   * --------------------------------------------------- */
  const handleTeamPress = () => {
    if (league === "NHL") {
      router.push(`/team/nhl/${id}`);
    }
  };

  /* -----------------------------------------------------
   * Styles
   * --------------------------------------------------- */
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

  /* -----------------------------------------------------
   * Render Helpers
   * --------------------------------------------------- */
  const renderTimeouts = (remaining: number) => {
    const total = 7;

    return (
      <View style={{ flexDirection: "row", marginTop: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={{
              width: 4,
              height: 2,
              borderRadius: 4,
              backgroundColor: isDark ? Colors.white : Colors.black,
              opacity: i < remaining ? 1 : 0.5,
              marginHorizontal: 2,
            }}
          />
        ))}
      </View>
    );
  };

  /* -----------------------------------------------------
   * Render
   * --------------------------------------------------- */
  return (
    <View style={styles.row}>
      {/* Home Score */}
      {isHome && (
        <View style={styles.scoreWrapper}>
          <Text
            style={
              showRecordInsteadOfScore
                ? [styles.preGameRecord, styles.preGameRecord]
                : [styles.score, styles.score, getScoreStyle()]
            }
          >
            {showRecordInsteadOfScore ? record : (score ?? "")}
          </Text>
        </View>
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
            {rank && <Text style={styles.rank}>{rank} </Text>}
            {name}
          </Text>

          {!showRecordInsteadOfScore && !inProgress && (
            <Text style={styles.record}>{record}</Text>
          )}

          {inProgress && timeouts != null && (
            <View style={styles.timeoutsContainer}>
              {renderTimeouts(timeouts)}
            </View>
          )}
        </View>
      </View>

      {/* Away Score */}
      {!isHome && (
        <View style={styles.scoreWrapper}>
          <Text
            style={
              showRecordInsteadOfScore
                ? [styles.preGameRecord, styles.preGameRecord]
                : [styles.score, styles.score, getScoreStyle()]
            }
          >
            {showRecordInsteadOfScore ? record : (score ?? "")}
          </Text>
        </View>
      )}
    </View>
  );
};
