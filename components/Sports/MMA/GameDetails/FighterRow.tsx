import { Colors } from "constants/styles";
import { useRouter } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import {
  MMAProps,
  TeamRowStyles,
} from "styles/GameDetailStyles/TeamRow.styles";

export const FighterRow = ({
  id,
  headshot,
  name,
  flag,
  record = "0-0",
  isDark,
  isFirstFighter = false,
  isWinner,

  gameStatusDescription,
}: MMAProps) => {
  const router = useRouter();
  const styles = TeamRowStyles(isDark);

  const inProgress = gameStatusDescription === "In Progress";
  const isFinal = gameStatusDescription === "Final";

  const route = "/player/mma/[id]";

  const handleTeamPress = () => {
    if (id)
      router.push({
        pathname: route,
        params: {
          id: id,
        },
      });
  };

  /* -----------------------------------------------------
   * Styles
   * --------------------------------------------------- */
  const getScoreStyle = () => {
    if (isWinner === false && isFinal) {
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

    return { color: isDark ? Colors.white : Colors.black };
  };

  // -----------------------------------------------------
  // RENDER
  // -----------------------------------------------------
  return (
    <View style={styles.row}>
      {/* First Fighter */}
      {isFirstFighter && (
        <Text style={[styles.preGameRecord, getScoreStyle()]}>{record}</Text>
      )}

      {/* Team Info */}
      <View style={styles.teamInfoContainer}>
        <Pressable onPress={handleTeamPress}>
          <View style={styles.headshotContainer}>
            <Image source={{ uri: headshot }} style={styles.headshot} />
          </View>
        </Pressable>

        <View style={styles.teamInfo}>
          <Text
            style={styles.teamName}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.5}
          >
            {name}
          </Text>
        </View>
      </View>

      {/* Second Fighter */}
      {!isFirstFighter && (
        <Text style={[styles.preGameRecord, getScoreStyle()]}>{record}</Text>
      )}
    </View>
  );
};
