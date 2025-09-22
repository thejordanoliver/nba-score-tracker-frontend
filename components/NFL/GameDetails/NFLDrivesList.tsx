import { Fonts } from "constants/fonts";
import { getNFLTeamsLogo } from "constants/teamsNFL";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
export type Drive = {
  id: string;
  description: string;
  result: string;
  shortDisplayResult: string;
  offensivePlays: number;
  yards: number;
  team: {
    displayName: string;
    shortDisplayName: string;
    abbreviation: string;
  };
};

type Props = {
  previousDrives?: Drive[] | null;
  currentDrives?: Drive[] | null;
  loading?: boolean;
  error?: string | null;
  lighter?: boolean;
};

export default function NFLDrivesList({
  previousDrives,
  currentDrives,
  loading,
  error,
  lighter = false,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getStyles(isDark);

  // Always coerce to arrays so spread/map never break
  const safePrevious = Array.isArray(previousDrives) ? previousDrives : [];
  const safeCurrent = Array.isArray(currentDrives) ? currentDrives : [];
  const drives = [...safeCurrent, ...safePrevious]; // current first, then history

  if (loading) return <Text style={styles.emptyText}>Loading drives...</Text>;
  if (error) return <Text style={styles.emptyText}>{error}</Text>;
  if (drives.length === 0)
    return <Text style={styles.emptyText}>No drives available</Text>;
  const textColor = lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d";
  const subTextColor = lighter ? "#ccc" : isDark ? "#888" : "#555";
  const borderColor = lighter ? "#aaa" : isDark ? "#888" : "#ccc";

  return (
    <View>
     <ScrollView style={{ maxHeight: 400 }}>

        <FlatList
          data={drives}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const teamLogo = getNFLTeamsLogo(item.team.abbreviation, isDark);

            const resultUpper = (item.result ?? "").toUpperCase();

            let resultColor = isDark ? "#aaa" : "#444";
            if (resultUpper.includes("PUNT"))
              resultColor = lighter
                ? "#ff9100ff"
                : isDark
                  ? "#ff9100ff"
                  : "#de7e00ff";
            else if (
              resultUpper.includes("INT") ||
              resultUpper.includes("FUMBLE") ||
              resultUpper.includes("MISSED FG") ||
              resultUpper.includes("DOWNS")
            )
              resultColor = lighter
                ? "#ff4444"
                : isDark
                  ? "#ff4444"
                  : "#cc0000";
            else if (resultUpper.includes("TD") || resultUpper.includes("FG"))
              resultColor = lighter
                ? "#00ff00"
                : isDark
                  ? "#00ff00"
                  : "#008800";

            return (
              <View
                style={[styles.driveCard, { borderBottomColor: borderColor }]}
              >
                <View style={styles.headerRow}>
                  <Image style={styles.teamLogo} source={teamLogo} />
                  <Text style={[styles.driveTeam, { color: textColor }]}>
                    {item.team.shortDisplayName}
                  </Text>
                </View>
                <Text
                  style={[styles.driveDescription, { color: subTextColor }]}
                >
                  {item.description}
                </Text>
                <Text style={[styles.driveDetail, { color: resultColor }]}>
                  Result: {item.result ?? "N/A"}
                </Text>
              </View>
            );
          }}
        />
      </ScrollView>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    listContainer: {
      gap: 8,
      marginTop: 8,
    },
    driveCard: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomColor: isDark ? "#444" : "#ccc",
      borderBottomWidth: 1,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    teamLogo: {
      width: 28,
      height: 28,
      marginRight: 8,
    },
    driveDescription: {
      fontSize: 12,
      fontFamily: Fonts.OSREGULAR,
      color: isDark ? "#fff" : "#1d1d1d",
    },
    driveDetail: {
      fontSize: 12,
      color: isDark ? "#aaa" : "#444",
      marginTop: 2,
      fontFamily: Fonts.OSREGULAR,
    },
    driveTeam: {
      fontSize: 15,
      fontFamily: Fonts.OSBOLD,
      color: isDark ? "#fff" : "#1d1d1d",
    },
    emptyText: {
      fontSize: 16,
      color: "#888",
      textAlign: "center",
      marginTop: 20,
      fontFamily: Fonts.OSBOLD,
    },
  });
