import { Fonts } from "constants/fonts";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import HeadingTwo from "components/Headings/HeadingTwo";

type Official = {
  fullName: string;
  displayName: string;
  position: { name: string; displayName: string; id: string };
  order: number;
};

type Props = {
  officials: Official[];
  lighter?: boolean;
};

export default function GameOfficials({ officials, lighter }: Props) {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark, lighter ?? false);

  if (!officials?.length) return null;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <View style={styles.container}>
      <HeadingTwo lighter={lighter}>Game Officials</HeadingTwo>
      <View style={styles.row}>
        {officials.map((official) => {
          const initials = getInitials(official.fullName);
          return (
            <View key={official.order} style={styles.card}>
              <View style={styles.placeholder}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
              <Text style={styles.position}>
                {official.position?.displayName ?? "Official"}
              </Text>
              <Text style={styles.name}>{official.displayName}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean, lighter: boolean) =>
  StyleSheet.create({
    container: {
      marginTop: 20,
      borderRadius: 8,
    },
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginTop: 10,
    },
    card: {
      width: "48%",
      padding: 12,
      borderRadius: 8,
      backgroundColor: lighter
        ? "rgba(255,255,255,0.1)"
        : isDark
        ? "#2e2e2e"
        : "#eee",
      elevation: 2,
      alignItems: "center",
      marginBottom: 12,
    },
    placeholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: lighter
        ? "rgba(255,255,255,0.3)"
        : isDark
        ? "#555"
        : "#aaa",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    initials: {
      color: "#fff",
      fontSize: 18,
      fontFamily: Fonts.OSBOLD,
    },
    position: {
      fontSize: 14,
      fontFamily: Fonts.OSSEMIBOLD,
      color: lighter ? "#ccc" : "#888",
      marginBottom: 4,
      textAlign: "center",
    },
    name: {
      fontSize: 16,
      fontFamily: Fonts.OSMEDIUM,
      color: lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d",
      textAlign: "center",
    },
  });
