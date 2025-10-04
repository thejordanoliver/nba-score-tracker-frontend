import { StyleSheet } from "react-native";
import { Fonts } from "constants/fonts";


const ROW_HEIGHT = 60; // or whatever fits your design
const RANK_WIDTH = 40;
const TEAM_COL_WIDTH = 80; // Increased to fit badge
const STAT_COL_WIDTH = 70;

export const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    header: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#444" : "#ccc",
    },
    heading: {
      fontSize: 22,
      fontFamily: Fonts.OSBOLD,
      color: isDark ? "#fff" : "#1d1d1d",
    },
    row: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#333" : "#ccc",
      paddingVertical: 10,
      height: ROW_HEIGHT,
      minHeight: ROW_HEIGHT,
      maxHeight: ROW_HEIGHT,
      
      
    },
    rankContainer: {
      width: RANK_WIDTH,
      justifyContent: "center",
      alignItems: "center",
      
      
    },
    rankText: {
      fontFamily: Fonts.OSSEMIBOLD,
      fontSize: 16,
      color: isDark ? "#fff" : "#1d1d1d",
    },
    teamInfo: {
      width: TEAM_COL_WIDTH,
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: 10,
    },
    logo: {
      width: 28,
      height: 28,
      marginRight: 6,
    },
    teamName: {
      fontSize: 16,
      fontFamily: Fonts.OSSEMIBOLD,
      color: isDark ? "#fff" : "#1d1d1d",
      width: 32,
    },
    teamHeaderText: {
      fontFamily: Fonts.OSSEMIBOLD,
      fontSize: 16,
      color: isDark ? "#fff" : "#1d1d1d",
    },
    statCell: {
      width: STAT_COL_WIDTH,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 5,
      
    },
    statText: {
      fontFamily: Fonts.OSREGULAR,
      fontSize: 12,
      color: isDark ? "#fff" : "#1d1d1d",
    },
    statTextSecondary: {
      fontFamily: Fonts.OSREGULAR,
      fontSize: 12,
      color: isDark ? "#aaa" : "#555",
    },
    statTextPositive: {
      fontFamily: Fonts.OSREGULAR,
      fontSize: 12,
      color: "limegreen",
    },
    statTextNegative: {
      fontFamily: Fonts.OSREGULAR,
      fontSize: 12,
      color: "tomato",
    },
    statusBadge: {
      marginLeft: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      minWidth: 22,
      justifyContent: "center",
      alignItems: "center",
    },
    statusBadgeText: {
      fontFamily: Fonts.OSBOLD,
      fontSize: 10,
      color: "#fff",
    },
    legendContainer: {
      marginTop: 20,
      paddingTop: 10,
    },
    legendItemsContainer: {
      flexWrap: "wrap",
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 12,
      marginTop: 8,
    },
    legendLabel: {
      fontFamily: Fonts.OSREGULAR,
      color: isDark ? "#fff" : "#1d1d1d",
    },
  });
