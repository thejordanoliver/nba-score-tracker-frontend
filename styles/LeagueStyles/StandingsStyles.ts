import { Colors, Fonts } from "constants/styles";
import { StyleSheet } from "react-native";

const ROW_HEIGHT = 60; // or whatever fits your design
const RANK_WIDTH = 40;
const TEAM_COL_WIDTH = 60; // Increased to fit badge
const STAT_COL_WIDTH = 70;

export const StandingsStyles = (isDark: boolean) =>
  StyleSheet.create({
    contentContainer: {
      paddingBottom: 100,
      paddingHorizontal: 12,
    },
    wrapper: {
      borderWidth: 1,
      borderColor: Colors.midTone,
      borderRadius: 8,
      overflow: "hidden",
    },
    center: {
      flex: 1,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    heading: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 20,
      color: isDark ? Colors.dark.white : Colors.light.black,
    },
    droppedHeading: {
      marginBottom: 4,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
      fontFamily: Fonts.MEDIUM,
      fontSize: 20,
      color: isDark ? Colors.dark.white : Colors.light.black,
    },
    dropdownRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 12,
      marginBottom: 12,
    },
    statsHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      height: ROW_HEIGHT,
      minHeight: ROW_HEIGHT,
      maxHeight: ROW_HEIGHT,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      height: ROW_HEIGHT,
      minHeight: ROW_HEIGHT,
      maxHeight: ROW_HEIGHT,
      paddingVertical: 10,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    rankContainer: {
      alignItems: "center",
      justifyContent: "center",
      width: RANK_WIDTH,
    },
    rankText: {
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 16,
      color: isDark ? Colors.white : Colors.black,
    },
    text: {
      marginVertical: 4,
      fontSize: 16,
      color: isDark ? Colors.white : Colors.black,
    },
    subText: {
      fontSize: 12,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
    teamInfo: {
      flexDirection: "row",
      alignItems: "center",
      width: TEAM_COL_WIDTH,
    },
    teamInfoWrapper: {
      flexDirection: "row",
      alignItems: "center",
    },
    logo: {
      width: 28,
      height: 28,
      marginRight: 4,
      resizeMode: "contain",
    },
    teamName: {
      width: 32,
      marginRight: 8,
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 14,
      color: isDark ? Colors.white : Colors.black,
    },
    collegeTeamName: {
      width: 40,
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 14,
      color: isDark ? Colors.white : Colors.black,
    },
    collegeTeamTrend: {
      width: 40,
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 10,
      color: isDark ? Colors.white : Colors.black,
    },
    collegeDivisionHeader: {
      marginTop: 4,
      paddingHorizontal: 12,
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 16,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
    teamHeaderText: {
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 16,
      color: isDark ? Colors.white : Colors.black,
    },
    statCell: {
      alignItems: "center",
      justifyContent: "center",
      width: STAT_COL_WIDTH,
      paddingHorizontal: 5,
    },
    headerText: {
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 12,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    statText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    statusBadge: {
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 2,
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 4,
    },
    statusBadgeText: {
      fontFamily: Fonts.BOLD,
      fontSize: 10,
      color: Colors.white,
    },
    statusText: {
      flexWrap: "wrap",
      marginLeft: 4,
      fontFamily: Fonts.BOLD,
      fontSize: 10,
      color: isDark ? Colors.dark.white : Colors.light.black,
    },
    legendContainer: {
      marginTop: 10,
      paddingTop: 10,
    },

    legendItemsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      paddingRight: 10,
    },

    legendItem: {
      width: "40%", // 2-column grid
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    legendLabel: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: isDark ? Colors.white : Colors.black,
    },

    droppedoutContainer: {
      marginTop: 24,
    },

    droppedoutWrapper: {
      flexDirection: "row",
      flexWrap: "wrap",
    },

    droppedoutRow: {
      gap: 4,
      padding: 8,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderCurve: "continuous",
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },
    droppedoutLogo: {
      width: 22,
      height: 22,
      marginRight: 4,
      resizeMode: "contain",
    },
    droppedoutName: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
  });

export const getStyles = StandingsStyles;
