import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { teams } from "../../constants/teams";
import { useSummerLeagueStandings } from "../../hooks/useSummerLeagueStandings";

const OSREGULAR = "Oswald_400Regular";
const OSBOLD = "Oswald_700Bold";

type Props = {
  team: {
    name: string;
    record?: string;
    logo: any;
    code?: string;
    id?: string;
  };
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
  isWinner,
  colors,
}: Props) => {
  const router = useRouter();
  const { standings } = useSummerLeagueStandings();

  // Determine if passed record is valid
  const isInvalidRecord =
    !team.record || team.record === "0-0" || team.record === "-";

  function getFullTeamNameFromCodeOrId(codeOrId?: string) {
    if (!codeOrId) return "";
    const match = teams.find(
      (t) =>
        t.code?.toLowerCase() === codeOrId.toLowerCase() ||
        t.id?.toString() === codeOrId.toString()
    );
    return match?.fullName || match?.name || "";
  }

  function normalizeTeamName(name: string) {
    return name.toLowerCase().replace(/[^a-z]/g, "");
  }

  const fullName = getFullTeamNameFromCodeOrId(team.code || team.id);
  const normalizedTeamName = normalizeTeamName(fullName);
  const standingsRecord = standings?.get(normalizedTeamName);

  const displayRecord = isInvalidRecord ? standingsRecord || "" : team.record;

  const handleTeamPress = () => {
    const teamParam = team.id?.toString();
    if (!teamParam) {
      console.error("No valid team code or ID to navigate to team screen");
      return;
    }
    router.push(`/team/${teamParam}`);
  };

  return (
    <View style={styles.row}>
      {isHome && (
        <Text
          style={[
            styles.score,
            { color: isWinner ? colors.winnerScore : colors.score },
          ]}
        >
          {score ?? ""}
        </Text>
      )}

      <View style={styles.teamInfoContainer}>
        <Pressable onPress={handleTeamPress}>
          <Image source={team.logo} style={styles.logo} />
        </Pressable>
        <View style={styles.teamInfo}>
          <Text style={[styles.teamName, { color: colors.text }]}>
            {team.name}
          </Text>
          <Text style={[styles.record, { color: colors.record }]}>
            {displayRecord}
          </Text>
        </View>
      </View>

      {!isHome && (
        <Text
          style={[
            styles.score,
            { color: isWinner ? colors.winnerScore : colors.score },
          ]}
        >
          {score ?? ""}
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
  },
  teamInfoContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  teamInfo: {
    justifyContent: "center",
  },
  teamName: {
    fontSize: 12,
    fontFamily: OSREGULAR,
    textAlign: "center",
  },
  record: {
    fontSize: 12,
    fontFamily: OSREGULAR,
    textAlign: "center",
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  score: {
    fontSize: 24,
    fontFamily: OSBOLD,
    width: 60,
    textAlign: "center",
    marginHorizontal: 16,
  },
});
