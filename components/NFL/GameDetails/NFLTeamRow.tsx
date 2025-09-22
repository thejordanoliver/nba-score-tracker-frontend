import { Fonts } from "constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Football from "../../../assets/icons8/Football.png";
import FootballLight from "../../../assets/icons8/FootballLight.png";
import { useEffect, useState } from "react";

type Props = {
  team: {
    id: string;
    name: string;
    logo: any;
    record?: string;
  };
  isDark: boolean;
  isHome?: boolean;
  score?: number;
  isWinner?: boolean;
  status?: string; // "Live", "Final", etc.
  colors: {
    text: string;
    record: string;
    score: string;
    winnerScore: string;
  };
  possessionTeamId?: string;
  size?: number;
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
}: Props) => {
  const router = useRouter();



  const handleTeamPress = () => {
    if (!team.id) return;
    router.push(`/team/nfl/${team.id}`);
  };

  const isLive = status && status !== "Scheduled" && status !== "Final";
  const isFinal = status === "Final";
  const isNotStarted = status === "Scheduled";

  const hasPossession = isLive && String(possessionTeamId) === String(team.id);

  const getScoreStyle = () => {
    if (score == null) return { color: colors.score };

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

  return (
    <View style={styles.row}>
      {/* Home Score */}
      {isHome && (
        <View style={styles.scoreWrapper}>
          <Text
            style={[
              isNotStarted
                ? [
                    styles.preGameRecord,
                    {
                      color: colors.record,
                      fontSize: size * 0.5,
                      width: size + 10,
                    },
                  ]
                : [
                    styles.score,
                    {
                      ...getScoreStyle(),
                      fontSize: size * 0.7,
                      width: size + 10,
                    },
                  ],
            ]}
          >
            {isNotStarted ? (team.record ?? "0-0") : (score ?? "0-0")}
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
              isNotStarted
                ? [
                    styles.preGameRecord,
                    {
                      color: colors.record,
                      fontSize: size * 0.5,
                      width: size + 10,
                    },
                  ]
                : [
                    styles.score,
                    {
                      ...getScoreStyle(),
                      fontSize: size * 0.7,
                      width: size + 10,
                    },
                  ],
            ]}
          >
            {isNotStarted ? (team.record ?? "0-0") : (score ?? "0-0")}
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
  possessionIconAbsolute: {
    position: "absolute",
    top: "75%",
    alignSelf: "center",
  },
});
