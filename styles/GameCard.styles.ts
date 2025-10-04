// GameCard.styles.ts
import { Fonts } from "constants/fonts";
import { StyleSheet } from "react-native";

export const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      backgroundColor: isDark ? "#2e2e2e" : "#eee",
      borderRadius: 8,
      paddingVertical: 14,
      paddingHorizontal: 20,
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
      marginVertical: 4,
      fontFamily: Fonts.OSREGULAR,
      fontSize: 12,
      color: isDark ? "#fff" : "#1d1d1d",
      textAlign: "center",
    },
    teamScore: {
      fontSize: 28,
      fontFamily: Fonts.OSBOLD,
      color: isDark ? "#fff" : "#1d1d1d",
      width: 48,
      textAlign: "center",
      // backgroundColor: "red"
    },
    teamRecord: {
      fontSize: 20,
      fontFamily: Fonts.OSBOLD,
      color: isDark ? "#fff" : "#1d1d1d",
      textAlign: "center",
      width: 40,
    },
    info: {
      alignItems: "center",
      justifyContent: "center",
      width: 120,
    },
    date: {
      fontFamily: Fonts.OSMEDIUM,
      color: isDark ? "#fff" : "#1d1d1d",
      fontSize: 14,
    },
    dateFinal: {
      fontFamily: Fonts.OSREGULAR,
      color: isDark ? "rgba(255,255,255, 1)" : "rgba(0, 0, 0, .5)",
      fontSize: 14,
    },
    time: {
      fontFamily: Fonts.OSREGULAR,
      color: isDark ? "#aaa" : "#555",
      fontSize: 12,
    },
    finalText: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 16,
      color: isDark ? "#ff4444" : "#cc0000",
      textAlign: "center",
    },
    clock: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 14,
      color: isDark ? "#ff4444" : "#cc0000",

      textAlign: "center",
    },

    broadcast: {
      position: "absolute",
      bottom: -14,
      fontFamily: Fonts.OSREGULAR,
      color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, .5)",
      fontSize: 10,
      textAlign: "center",
    },

    seriesStatus: {
      color: isDark ? "#ccc" : "#555",
      fontFamily: Fonts.OSEXTRALIGHT,
      fontSize: 10,
      textAlign: "center",
      maxWidth: 180,
    },

    seriesDivider: {
      height: 10,
      width: 0.5,
      backgroundColor: isDark ? "#ccc" : "#555",
    },

    downDistance: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 12,
      color: isDark ? "#aaa" : "#555",
      textAlign: "center",
    },
  });
