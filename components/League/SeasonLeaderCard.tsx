import { Fonts } from "constants/fonts";
import { Image } from "expo-image";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
interface PlayerStatRowProps {
  headshotUrl: string;
  fullName: string;
  statNumber: number | string;
  isDark?: boolean;
  teeam_id?: number;
}

export default function PlayerStatRow({
  headshotUrl,
  fullName,
  teeam_id,
  statNumber,
  isDark,
}: PlayerStatRowProps) {
  const colorScheme = useColorScheme();
  const dark = isDark ?? colorScheme === "dark";
  const styles = getStyles(dark);
  return (
    <View style={styles.container}>
      <View style={styles.playerInfo}>
        <View style={styles.headshot}>
        <Image source={{ uri: headshotUrl }} style={styles.headshot} />
        </View>
        <Text style={styles.name}>{fullName}</Text>
      </View>
      <Text style={styles.stat}>{statNumber}</Text>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#2e2e2e" : "#eee",
      justifyContent: "space-between",
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    playerInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    headshot: {
      width: 50,
      height: 50,
      borderRadius: 100,
      marginRight: 12,
      backgroundColor: isDark ? "#444" : "#888",
      paddingTop: 4,
    },
    name: {
      fontSize: 16,
      fontFamily: Fonts.OSBOLD,
      color: isDark ? "#fff" : "#1d1d1d",
    },
    stat: {
      fontSize: 16,
      fontFamily: Fonts.OSBOLD,
      textAlign: "right",
      color: isDark ? "#fff" : "#1d1d1d",
    },
  });
