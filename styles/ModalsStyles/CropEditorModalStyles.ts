import { Colors, Fonts } from "constants/styles";
import { StyleSheet } from "react-native";

export const cropEditorModalStyles = (
  isDark: boolean,
  isProfile: boolean,
  cropWidth: number,
  cropHeight: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? Colors.black : Colors.white,
    },
    wrapper: {
      flex: 1,
      justifyContent: "flex-start",
      padding: 12,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginVertical: 20,
    },

    headerBtn: { padding: 8 },
    headerTitle: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 18,
      color: isDark ? Colors.white : Colors.black,
    },
    cropContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      marginTop: 12,
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: Colors.white,
    },
    cropBox: {
      borderWidth: 2,
      backgroundColor: Colors.black,
      overflow: "hidden",
    },
    imageContainer: {
      alignItems: "center",
      justifyContent: "center",
      width: cropWidth,
      height: cropHeight,
      borderRadius: isProfile ? cropHeight / 2 : 8,
      backgroundColor: Colors.black,
      overflow: "hidden",
    },
    cropFrame: {
      ...StyleSheet.absoluteFill,
      borderWidth: 2,
      borderColor: isDark ? Colors.white : Colors.black,
      borderRadius: isProfile ? cropHeight / 2 : 8,
    },
    controlsContainer: {
      paddingVertical: 20,
      paddingHorizontal: 16,
    },
    controlRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      marginBottom: 12,
    },
    controlButton: {
      alignItems: "center",
      padding: 8,
    },
    controlButtonDisabled: {
      opacity: 0.5,
    },
    controlLabel: {
      marginTop: 4,
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: Colors.white,
    },
    controlLabelDisabled: {
      color: Colors.darkGray,
    },
    scaleIndicator: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 16,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: 40,
      paddingVertical: 20,
    },
    cancelButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    saveButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
      marginLeft: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      backgroundColor: isDark ? Colors.dark.leafGreen : Colors.light.green,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    saveText: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 18,
      color: isDark ? Colors.white : Colors.black,
    },
    cancelText: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 18,
      color: isDark ? Colors.white : Colors.black,
    },
    buttonTextDisabled: {
      opacity: 0.5,
    },
  });
