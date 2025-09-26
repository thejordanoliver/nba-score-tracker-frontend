import { Fonts } from "constants/fonts";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Football from "../../../assets/icons8/Football.png";
import FootballLight from "../../../assets/icons8/FootballLight.png";

type Props = {
  team: {
    id: string;
    name: string;
    logo: any;
    record?: string;
  };
  isDark: boolean;
  isHome?: boolean;
  score?: number | null;
  isWinner?: boolean;
  status?: string; // "Scheduled", "In Progress", "Final", etc.
  colors: {
    text: string;
    record: string;
    score: string;
    winnerScore: string;
  };
  possessionTeamId?: string;
  size?: number;
  timeouts: number;
};

export const NFLTeamRow = ({
  team,
  isDark,
  isHome = false,
  score,
  isWinner,
  status,
  colors,
  possessionTeamId,
  size = 50,
  timeouts,
}: Props) => {
  const router = useRouter();

  const handleTeamPress = () => {
    if (!team.id) return;
    router.push(`/team/nfl/${team.id}`);
  };

  const isScheduled = status === "Scheduled";
  const isLive =
    status &&
    status !== "Scheduled" &&
    status !== "Final" &&
    status !== undefined;
  const isFinal = status === "Final";

  const hasPossession = isLive && String(possessionTeamId) === String(team.id);

  const getScoreStyle = () => {
    if (score == null) return { color: colors.score, opacity: 0.5 };

    if (isLive) {
      return { color: isDark ? "#fff" : "#000", opacity: 1 };
    }

    if (isFinal) {
      return {
        color: isWinner ? colors.winnerScore : colors.score,
        opacity: isWinner ? 1 : 0.5,
      };
    }

    return { color: colors.score, opacity: 1 };
  };

  const renderTimeouts = (remaining: number) => {
    const totalTimeouts = 3;
    const dots = [];
    for (let i = 0; i < totalTimeouts; i++) {
      dots.push(
        <View
          key={i}
          style={{
            width: 8,
            height: 2,
            borderRadius: 4,
            backgroundColor: isDark ? "#fff" : "#000",
            opacity: i < remaining ? 1 : 0.3,
            marginHorizontal: 2,
          }}
        />
      );
    }
    return <View style={{ flexDirection: "row", marginTop: 2 }}>{dots}</View>;
  };

  // Determine what to display in the score box
  const displayScore = isScheduled
    ? team.record ?? "0-0"
    : score != null
    ? score
    : isLive
    ? "..."
    : team.record ?? "0-0";

  return (
    <View style={styles.row}>
      {/* Home Score */}
      {isHome && (
        <View style={styles.scoreWrapper}>
          <Text
            style={[
              isScheduled
                ? [
                    styles.preGameRecord,
                    { color: colors.record, fontSize: size * 0.5, width: size + 10 },
                  ]
                : [
                    styles.score,
                    { ...getScoreStyle(), fontSize: size * 0.7, width: size + 10 },
                  ],
            ]}
          >
            {displayScore}
          </Text>

          {hasPossession && (
            <Image
              source={isDark ? FootballLight : Football}
              style={{
                width: size * 0.5,
                height: size * 0.8,
                resizeMode: "contain",
                position: "absolute",
                top: "54%",
                alignSelf: "center",
              }}
            />
          )}
        </View>
      )}

      {/* Team Info */}
      <View style={styles.teamInfoContainer}>
        <Pressable onPress={handleTeamPress}>
          <Image
            source={team.logo}
            style={{ width: size, height: size, resizeMode: "contain" }}
          />
        </Pressable>

        <View style={styles.teamInfo}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.teamName,
                { color: colors.text, fontSize: size * 0.25 },
              ]}
            >
              {team.name}
            </Text>
          </View>

          {/* Timeouts */}
          {timeouts > 0 && (
            <View style={{ alignItems: "center", marginTop: 2 }}>
              {renderTimeouts(timeouts)}
            </View>
          )}

          {/* Record (only show final record if game finished) */}
          {isFinal && (
            <Text
              style={[
                styles.record,
                { color: colors.record, fontSize: size * 0.24 },
              ]}
            >
              {team.record ?? "0-0"}
            </Text>
          )}
        </View>
      </View>

      {/* Away Score */}
      {!isHome && (
        <View style={styles.scoreWrapper}>
          <Text
            style={[
              isScheduled
                ? [
                    styles.preGameRecord,
                    { color: colors.record, fontSize: size * 0.5, width: size + 10 },
                  ]
                : [
                    styles.score,
                    { ...getScoreStyle(), fontSize: size * 0.7, width: size + 10 },
                  ],
            ]}
          >
            {displayScore}
          </Text>

          {hasPossession && (
            <Image
              source={isDark ? FootballLight : Football}
              style={{
                width: size * 0.5,
                height: size * 0.8,
                resizeMode: "contain",
                position: "absolute",
                top: "54%",
                alignSelf: "center",
              }}
            />
          )}
        </View>
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
