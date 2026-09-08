import { Colors, Fonts } from "constants/styles";
import { StyleSheet } from "react-native";

export const FAVORITES_RAIL_CELL_WIDTH = 92;
export const FAVORITES_RAIL_HORIZONTAL_PADDING = 10;
const FAVORITES_RAIL_ITEM_SIZE = 80;

export const FavoritesScrollStyles = (isDark: boolean) =>
  StyleSheet.create({
    railContainer: {
      position: "relative",
    },
    container: {
      flexDirection: "row",
      marginBottom: 20,
      paddingTop: 24,
      paddingHorizontal: FAVORITES_RAIL_HORIZONTAL_PADDING,
    },
    cell: {
      alignItems: "center",
      width: FAVORITES_RAIL_CELL_WIDTH,
    },
    tabContainer: {
      alignItems: "center",
      width: FAVORITES_RAIL_ITEM_SIZE,
    },
    activeTabContainer: {
      zIndex: 10,
    },
    pressed: {
      opacity: 0.6,
    },
    logoWrapper: {
      alignItems: "center",
      justifyContent: "center",
      width: FAVORITES_RAIL_ITEM_SIZE,
      height: FAVORITES_RAIL_ITEM_SIZE,
      borderWidth: 0.5,
      borderColor: isDark ? Colors.light.background : Colors.dark.background,
      borderRadius: 40,
      overflow: "hidden",
    },
    logo: {
      width: 50,
      height: 50,
    },
    editIcon: {
      alignItems: "center",
      justifyContent: "center",
      width: FAVORITES_RAIL_ITEM_SIZE,
      height: FAVORITES_RAIL_ITEM_SIZE,
      borderWidth: 0.5,
      borderColor: isDark ? Colors.light.background : Colors.dark.background,
      borderRadius: 40,
      backgroundColor: isDark
        ? Colors.light.background
        : Colors.dark.background,
      overflow: "hidden",
    },
    labelContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      height: 30,
      marginTop: 4,
    },
    tabLabel: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: isDark ? Colors.dark.text : Colors.light.text,
      textAlign: "center",
    },
    divider: {
      width: 1,
      height: 12,
      marginHorizontal: 4,
      backgroundColor: Colors.lightGray,
    },
    sectionDivider: {
      position: "absolute",
      top: 24,
      zIndex: 20,
      width: StyleSheet.hairlineWidth,
      height: FAVORITES_RAIL_ITEM_SIZE,
      backgroundColor: isDark ? Colors.lightGray : Colors.darkGray,
    },

    dragPlaceholder: {
      alignItems: "center",
      width: FAVORITES_RAIL_CELL_WIDTH,
    },
    dragPlaceholderCircle: {
      width: FAVORITES_RAIL_ITEM_SIZE,
      height: FAVORITES_RAIL_ITEM_SIZE,
      borderWidth: 1.5,
      borderColor: isDark ? Colors.lightGray : Colors.darkGray,
      borderStyle: "dashed",
      borderRadius: 40,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },
  });
