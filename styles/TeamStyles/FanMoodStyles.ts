import { Colors, Fonts } from "@/constants/styles";
import { StyleSheet } from "react-native";

export const FanMoodStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
      borderRadius: 14,
      gap: 8,
      padding: 16,
    },

    fanMoodTrendContainer: {
      alignItems: "center",
      flexDirection: "row",
      gap: 3,
    },

    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },

    title: {
      color: isDark ? Colors.dark.text : Colors.light.text,
      fontFamily: Fonts.BOLD,
      fontSize: 16,
    },

    sampleSize: {
      color: isDark ? Colors.lightGray : Colors.darkGray,
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
    },
    changeText: {
      color: isDark ? Colors.lightGray : Colors.darkGray,
      fontFamily: Fonts.MEDIUM,
      fontSize: 12,
    },
    score: {
      color: isDark ? Colors.dark.text : Colors.light.text,
      fontFamily: Fonts.BOLD,
      fontSize: 30,
    },
    levelText: {
      color: isDark ? Colors.dark.text : Colors.light.text,
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
    },
  });
