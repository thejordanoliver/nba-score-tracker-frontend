import { activeOpacity, Colors, Fonts } from "constants/styles";
import { StyleSheet } from "react-native";

export const ConferenceListModalStyles = (isDark: boolean) =>
  StyleSheet.create({
    backgroundStyle: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: "hidden",
      backgroundColor: isDark ? Colors.black : Colors.white,
    },
    blurViewContainer: {
      flex: 1,
      padding: 12,
      paddingTop: 40,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
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
      zIndex: 9999,
      width: 36,
      height: 4,
      marginBottom: 4,
      borderRadius: 2,
      backgroundColor: Colors.midTone,
    },
    header: {
      position: "absolute",
      top: 0,
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      paddingVertical: 12,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.black : Colors.white,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },
    headerText: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      fontFamily: Fonts.REGULAR,
      fontSize: 18,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    container: {
      flex: 1,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: "hidden",
    },
    contentContainerStyle: {
      paddingHorizontal: 12,
      paddingVertical: 60,
    },
    row: {
      flex: 1,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.darkGray : Colors.midTone,
      backgroundColor: "transparent",
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      paddingVertical: 14,
    },
    buttonContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
      backgroundColor: "transparent",
    },
    buttonWrapper: {
      flexDirection: "row",
      alignItems: "center",
    },
    buttonPressed: {
      opacity: activeOpacity,
    },

    logo: {
      width: 36,
      height: 36,
      marginRight: 8,
    },
    buttonText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: isDark ? Colors.white : Colors.black,
    },
    logoPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
      width: 28,
      height: 28,
      marginRight: 12,
    },
  });
