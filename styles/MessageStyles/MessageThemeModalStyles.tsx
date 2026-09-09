import { Colors, Fonts } from "@/constants/styles";
import { StyleSheet } from "react-native";

export const MessageThemeModalStyles = (isDark: boolean) =>
  StyleSheet.create({
    handleStyle: {
      position: "absolute",
      top: 0,
      right: 8,
      left: 8,
      alignItems: "center",
      justifyContent: "center",
      height: 40,
      backgroundColor: "transparent",
    },
    handleIndicatorStyle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: Colors.midTone,
    },
    backgroundStyle: { backgroundColor: isDark ? Colors.black : Colors.white },
    container: {
      flex: 1,
      padding: 12,
      paddingTop: 40,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    blurViewContainer: {
      flex: 1,
      padding: 12,
      paddingTop: 40,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    contentContainerStyle: {
      paddingBottom: 100,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      marginBottom: 14,
    },

    title: {
      textAlign: "center",
      fontFamily: Fonts.BOLD,
      fontSize: 20,
      color: isDark ? Colors.white : Colors.black,
    },

    subtitle: {
      marginTop: 2,
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textTransform: "uppercase",
    },

    scrollContent: {
      gap: 8,
      paddingBottom: 8,
    },

    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 66,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 8,
    },

    optionSelected: {
      borderColor: isDark ? Colors.white : Colors.black,
    },

    optionPressed: {
      opacity: 0.78,
    },

    optionBody: {
      flex: 1,
      minWidth: 0,
    },

    optionTitle: {
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      lineHeight: 19,
      color: isDark ? Colors.white : Colors.black,
    },

    optionMeta: {
      marginTop: 2,
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textTransform: "uppercase",
    },

    defaultIcon: {
      flexDirection: "row",
      width: 42,
      height: 42,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 21,
      overflow: "hidden",
    },

    defaultSwatch: {
      flex: 1,
    },

    defaultSwatchDark: {
      backgroundColor: Colors.black,
    },

    defaultSwatchLight: {
      backgroundColor: Colors.white,
    },

    sectionHeader: {
      paddingTop: 8,
      paddingHorizontal: 2,
    },

    sectionTitle: {
      fontFamily: Fonts.BOLD,
      fontSize: 12,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textTransform: "uppercase",
    },

    loadingRow: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 72,
    },

    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 72,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 8,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },

    emptyTitle: {
      fontFamily: Fonts.REGULAR,
      fontSize: 13,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },

    logoWrap: {
      alignItems: "center",
      justifyContent: "center",
      width: 42,
      height: 42,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 21,
    },

    logo: {
      width: 30,
      height: 30,
    },

    swatchRow: {
      flexDirection: "row",
      gap: 4,
    },

    colorSwatch: {
      width: 18,
      height: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.lightGray : Colors.darkGray,
      borderRadius: 9,
    },

    errorText: {
      marginTop: 10,
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      lineHeight: 17,
      color: isDark ? Colors.dark.lightRed : Colors.light.red,
    },

    buttonContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginVertical: 12,
      paddingHorizontal: 12,
    },

    button: {
      flex: 1,
    },

    actionButtonDisabled: {
      opacity: 0.4,
    },

    cancelText: {
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      color: isDark ? Colors.white : Colors.black,
    },

    saveText: {
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      color: isDark ? Colors.black : Colors.white,
    },
  });
