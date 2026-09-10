import { Colors, Fonts } from "constants/styles";
import { StyleSheet } from "react-native";

const PLAYER_NAME_WIDTH = 140;
const STAT_CELL_WIDTH = 80;

export const rosterStatsStyles = (isDark: boolean) =>
  StyleSheet.create({
    center: {
      alignItems: "center",
      justifyContent: "center",
    },
    container: {
      alignItems: "center",
      justifyContent: "center",
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 12,
      paddingBottom: 100,
      borderRadius: 4,
      overflow: "hidden",
    },
    fixedColumnContainer: {
      zIndex: 2,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    table: {
      width: "100%",
      borderWidth: 1,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 8,
      overflow: "hidden",
    },
    tableWrapper: {
      flexDirection: "row",
      width: "100%",
      borderWidth: 1,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 8,
      overflow: "hidden",
    },
    tableContent: {
      flex: 1,
      flexDirection: "row",
    },
    scrollSection: {
      flex: 1,
    },
    scrollContentContainer: {
      flexGrow: 1,
    },
    statScrollContent: {
      flexGrow: 1,
      minWidth: "100%",
      alignSelf: "stretch",
    },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      minHeight: 40,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    teamTableContainer: {
      flex: 1,
      gap: 20,
    },
    playerStatSelector: {
      marginBottom: 16,
    },

    teamTableRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      minHeight: 40,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },

    tableCell: {
      padding: 8,
    },

    nameColumn: {
      zIndex: 10,
      width: PLAYER_NAME_WIDTH,
      backgroundColor: isDark
        ? Colors.dark.background
        : Colors.light.background,
      elevation: 10,
    },

    playerName: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
      color: isDark ? Colors.white : Colors.black,
    },

    statValue: {
      width: STAT_CELL_WIDTH,
      fontFamily: Fonts.MEDIUM,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textAlign: "center",
    },
    teamStatValue: {
      fontFamily: Fonts.MEDIUM,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textAlign: "center",
    },
    cardWrapper: {
      flexDirection: "row",
      alignItems: "flex-end",
    },
    cardContainer: {
      alignItems: "flex-start",
      justifyContent: "center",
    },
    statCard: {
      flexDirection: "row",
      alignItems: "center",
      width: 260,
      padding: 12,
      borderRadius: 10,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },
    cardLabel: {
      marginBottom: 4,
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 20,
      color: isDark ? Colors.white : Colors.black,
    },
    cardName: {
      marginTop: 4,
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 14,
      color: isDark ? Colors.white : Colors.black,
    },
    cardValue: {
      fontFamily: Fonts.BOLD,
      fontSize: 24,
      color: isDark ? Colors.white : Colors.black,
    },
    nameValue: {
      flexDirection: "column",
      marginLeft: 12,
    },
    avatar: {
      width: 60,
      height: 60,
      marginVertical: 4,
      paddingTop: 8,
      borderWidth: 1,
      borderColor: Colors.midTone,
      borderRadius: 30,
    },
    divider: {
      width: 1,
      height: "72%",
      marginHorizontal: 16,
      backgroundColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    number: {
      fontSize: 10,
      lineHeight: 14,
      color: Colors.midTone,
      transform: [{ translateY: 3 }],
    },
    headerText: {
      fontFamily: Fonts.BOLD,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    nameHeaderText: {
      width: PLAYER_NAME_WIDTH,
      fontFamily: Fonts.BOLD,
      color: isDark ? Colors.white : Colors.black,
    },
    categoryTitle: {
      marginBottom: 4,
      fontFamily: Fonts.SEMIBOLD,
      fontSize: 20,
      color: isDark ? Colors.white : Colors.black,
    },

    tabScene: {
      flex: 1,
    },
    hiddenTabScene: {
      display: "none",
    },
  });
