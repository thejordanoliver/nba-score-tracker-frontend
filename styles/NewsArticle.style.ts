// app/news/NewsArticle.styles.ts
import { StyleSheet } from "react-native";
import { Fonts } from "constants/fonts";

export const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark ? "#1d1d1d" : "#fff",
      paddingHorizontal: 12,
        paddingBottom: 60,
    },
    title: {
      fontSize: 24,
      fontFamily: Fonts.OSBOLD,
      marginBottom: 12,
      color: isDark ? "#fff" : "#000",
    },
    image: {
      width: "100%",
      height: 240,
      borderRadius: 12,
      marginBottom: 12,
    },
    source: {
      fontStyle: "italic",
      fontFamily: Fonts.OSMEDIUM,
      color: isDark ? "#bbb" : "#444",
      marginBottom: 8,
    },
    content: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: Fonts.OSREGULAR,
      color: isDark ? "#ddd" : "#222",
    flex: 1
    },
  });
