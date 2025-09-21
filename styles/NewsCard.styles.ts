// GameCard.styles.ts
import { StyleSheet } from "react-native";
import { Fonts } from "constants/fonts";

export const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      backgroundColor: isDark ? "#2e2e2e" : "#eee",
      borderRadius: 8,
      paddingVertical: 14,
      paddingHorizontal: 20,
      marginVertical: 8,
      alignItems: "center",
      justifyContent: "space-between",
    },
    teamSection: {
      alignItems: "center",
      width: 60,
    },
    logo: {
      width: 40,
      height: 40,
      resizeMode: "contain",
    },
    teamName: {
      marginTop: 4,
      fontFamily: Fonts.OSREGULAR,
      fontSize: 12,
      color: isDark ? "#fff" : "#000",
      textAlign: "center",
    },
    teamScore: {
      fontSize: 24,
      fontFamily: Fonts.OSMEDIUM,
      color: isDark ? "#aaa" : "rgba(0, 0, 0, 0.4)",
      width: 40,
      textAlign: "center",
    },
    teamRecord: {
      fontSize: 12,
      fontFamily: Fonts.OSREGULAR,
      color: isDark ? "#ccc" : "#777",
      textAlign: "center",
      width: 40,
    },
    info: {
      alignItems: "center",
      justifyContent: "center",
      width: 70,
    },
    date: {
      fontFamily: Fonts.OSMEDIUM,
      color: isDark ? "#fff" : "#000",
      fontSize: 14,
    },
    dateFinal: {
      fontFamily: Fonts.OSREGULAR,
      color: isDark ? "rgba(255,255,255, 1)" : "rgba(0, 0, 0, .5)",
      fontSize: 14,
    },
    time: {
      fontFamily: Fonts.OSMEDIUM,
      color: isDark ? "#aaa" : "#555",
      fontSize: 12,
      marginTop: 2,
    },
    finalText: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 16,
      color: isDark ? "#ff4444" : "#cc0000",
      fontWeight: "bold",
      textAlign: "center",
    },
  });
