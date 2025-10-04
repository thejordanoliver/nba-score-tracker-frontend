import { Fonts } from "constants/fonts";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useTeamInfo } from "../../hooks/useTeamInfo"; // adjust path

type Props = {
  team: {
    name: string;
    record?: string; // passed from parent (may be "0-0", "-", null)
    logo: any;
    code?: string;
    id?: string;
  };
  size?: number;
  isDark: boolean;
  isHome?: boolean;
  score?: number;
  isWinner?: boolean;
  colors: any;
};

export const TeamRow = ({
  team,
  isDark,
  isHome = false,
  score,
  size = 50,
  isWinner,
  colors,
}: Props) => {
  const router = useRouter();

  // Fetch full team info to get current_season_record fallback
  const { team: detailedTeam } = useTeamInfo(team.id);

  // Determine what record to show
  const isInvalidRecord =
    !team.record || team.record === "0-0" || team.record === "-";

  const displayRecord = isInvalidRecord
    ? detailedTeam?.current_season_record ?? ""
    : team.record;

  const handleTeamPress = () => {
    const teamParam = team.id?.toString();

    if (!teamParam) {
      console.error("No valid team code or ID to navigate to team screen");
      return;
    }
    router.push(`/team/${teamParam}`);
  };

  // If game hasn’t started → show record instead of score
  const showRecordInsteadOfScore = score == null;

  return (
    <View style={styles.row}>
      {isHome && (
        <Text
          style={[
            styles.score,
            showRecordInsteadOfScore
              ? { color: colors.record } // record color
              : { color: isWinner ? colors.winnerScore : colors.score }, // score color
            { fontSize: size * 0.5, width: size + 10 },
          ]}
        >
          {showRecordInsteadOfScore ? displayRecord : score ?? ""}
        </Text>
      )}

      <View style={styles.teamInfoContainer}>
        <Pressable onPress={handleTeamPress}>
          <Image
            source={team.logo}
            style={{ width: size, height: size, resizeMode: "contain" }}
          />
        </Pressable>
        <View style={styles.teamInfo}>
          <Text
            style={[
              styles.teamName,
              { color: colors.text, fontSize: size * 0.25 },
            ]}
          >
            {team.name}
          </Text>
          {/* Only show record under team name if scores are visible */}
          {!showRecordInsteadOfScore && (
            <Text style={[styles.record, { color: colors.record }]}>
              {displayRecord}
            </Text>
          )}
        </View>
      </View>

      {!isHome && (
        <Text
          style={[
            styles.score,
            showRecordInsteadOfScore
              ? { color: colors.record } // record color
              : { color: isWinner ? colors.winnerScore : colors.score }, // score color
            { fontSize: size * 0.5, width: size + 10 },
          ]}
        >
          {showRecordInsteadOfScore ? displayRecord : score ?? ""}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  teamInfoContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  teamInfo: {
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  teamName: {
    fontFamily: Fonts.OSREGULAR,
    textAlign: "center",
  },
  record: {
    fontFamily: Fonts.OSREGULAR,
    textAlign: "center",
  },
  score: {
    fontFamily: Fonts.OSBOLD,
    textAlign: "center",
    marginHorizontal: 16,
  },
  preGameRecord: {
    fontFamily: Fonts.OSBOLD,
    textAlign: "center",
    marginHorizontal: 16,
  },
  scoreWrapper: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
});
