import { Colors, Fonts } from "constants/styles";
import { StyleSheet } from "react-native";

export const statsTableStyles = (isDark: boolean) => {
  const borderColor = isDark ? Colors.darkGray : Colors.lightGray;
  const textColor = isDark ? Colors.white : Colors.black;
  const altRowColor = isDark
    ? Colors.dark.itemBackground
    : Colors.light.itemBackground;

  const rowHeight = 38;
  const statCellWidth = 80;
  const seasonColumnWidth = 80;
  const teamColumnWidth = 64;

  return StyleSheet.create({
    container: {
      paddingTop: 24,
    },

    statsHeader: {
      minHeight: 44,
    },

    dropdown: {
      position: "absolute",
      top: -12,
      right: 0,
    },

    filtersRow: {
      position: "absolute",
      top: -12,
      right: 0,
      zIndex: 20,
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
    },

    filterDropdown: { marginBottom: 4 },

    compColumn: {
      width: 96,
    },

    compCell: {
      width: 96,
    },

    emptyText: {
      marginTop: 8,
      fontFamily: Fonts.MEDIUM,
      color: Colors.midTone,
    },

    tableWrapper: {
      flexDirection: "row",
      width: "100%",
      borderWidth: 1,
      borderColor,
      borderRadius: 8,
      overflow: "hidden",
    },

    fixedSection: {
      flexShrink: 0,
      flexDirection: "row",
    },

    scrollSection: {
      flex: 1,
    },

    scrollContentContainer: {
      flexGrow: 1,
    },

    headerRow: {
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },

    tableHeaderRow: {
      height: rowHeight,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      height: rowHeight,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },

    lastRow: {
      borderBottomWidth: 0,
    },

    rowAlt: {
      backgroundColor: altRowColor,
    },

    rowAltLight: {
      backgroundColor: Colors.light.itemBackground,
    },

    rowAltDark: {
      backgroundColor: Colors.dark.itemBackground,
    },

    best: {
      backgroundColor: isDark ? "#5c4300" : "#ffd700",
    },

    careerRow: {
      backgroundColor: isDark ? Colors.dark.leafGreen : Colors.light.green,
    },

    careerCell: {
      alignItems: "center",
      width: statCellWidth,
      paddingHorizontal: 4,
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
      color: Colors.white,
      textAlign: "center",
      includeFontPadding: false,
    },

    cell: {
      width: statCellWidth,
      paddingHorizontal: 4,
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textAlign: "center",
      textAlignVertical: "center",
    },

    fixedColumn: {
      width: seasonColumnWidth,
    },

    seasonColumn: {
      width: seasonColumnWidth,
    },

    teamColumn: {
      width: teamColumnWidth,
    },

    statScrollContent: {
      flexGrow: 1,
      flexShrink: 0,
      minWidth: "100%",
      alignSelf: "stretch",
    },

    fixedCell: {
      alignItems: "center",
      width: seasonColumnWidth,
      paddingHorizontal: 4,
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
      color: textColor,
      textAlign: "center",
      includeFontPadding: false,
    },

    fixedTeamCell: {
      width: teamColumnWidth,
      paddingHorizontal: 4,
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
      color: textColor,
      textAlign: "center",
      includeFontPadding: false,
    },

    fixedHeaderCell: {
      fontFamily: Fonts.BOLD,
      color: textColor,
      textTransform: "uppercase",
    },

    fixedCareerHeaderCell: {
      color: Colors.white,
    },

    fixedCareerCell: {
      alignItems: "center",
      width: teamColumnWidth,
      paddingHorizontal: 4,
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
      color: Colors.white,
      textAlign: "center",
      includeFontPadding: false,
    },

    headerCell: {
      paddingHorizontal: 8,
      fontFamily: Fonts.BOLD,
      color: textColor,
      textTransform: "uppercase",
    },

    seasonTabsPill: {
      flexDirection: "row",
      marginTop: 4,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark
        ? Colors.transparentDarkGray
        : Colors.transparentLightGray,
      borderRadius: 999,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },

    tabContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: "transparent",
    },

    tabContainerActive: {
      borderRadius: 999,
      backgroundColor: isDark ? Colors.white : Colors.black,
    },

    tabLabel: {
      fontFamily: Fonts.BOLD,
      color: isDark ? Colors.white : Colors.black,
    },

    tabLabelActive: {
      color: isDark ? Colors.black : Colors.white,
    },

    legendText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
    },

    glossaryContainer: {
      marginTop: 12,
      borderWidth: 1,
      borderColor,
      borderRadius: 8,
      overflow: "hidden",
    },

    headerName: {
      padding: 10,
      borderBottomWidth: 1,
      borderColor,
      fontFamily: Fonts.BOLD,
      fontSize: 20,
      color: textColor,
    },

    glossaryRow: {
      flexDirection: "row",
    },

    glossaryCell: {
      flex: 1,
      flexDirection: "row",
      padding: 12,
      backgroundColor: "transparent",
    },

    glossaryCellAlt: {
      backgroundColor: altRowColor,
    },

    glossaryCellWithRightBorder: {
      borderRightWidth: 1,
      borderRightColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
    },

    glossaryAbbr: {
      fontFamily: Fonts.BOLD,
      fontSize: 10,
      color: textColor,
    },

    glossaryDisplayName: {
      fontFamily: Fonts.REGULAR,
      fontSize: 10,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
  });
};
