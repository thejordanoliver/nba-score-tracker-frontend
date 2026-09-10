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

    handle: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },
    handleIndicator: {
      width: 38,
      backgroundColor: Colors.midTone,
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
      textAlign: "center",
      marginTop: 2,
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
    container: {
      flex: 1,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: "hidden",
    },
    contentContainerStyle: {
      paddingHorizontal: 12,
      paddingBottom: 60,
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
