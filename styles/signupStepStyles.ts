// components/styles/SignupStepsStyles.ts
import { StyleSheet } from "react-native";
import { Fonts } from "constants/fonts";

export const getSignupStepsStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDark ? "#1d1d1d" : "#fff",
    },
    signInContainer: {
      flex: 1,
      justifyContent: "center",
    },
    inputContainer: {
      flex: 1,
      justifyContent: "space-around",
      paddingVertical: 20,
    },
    title: {
      fontSize: 24,
      fontFamily: Fonts.OSBOLD,
      marginTop: 10,
      marginBottom: 20,
      color: isDark ? "#fff" : "#000",
      textAlign: "center",
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginVertical: 16,
    },
    titleCentered: {
      position: "absolute",
      left: 0,
      right: 0,
      textAlign: "center",
      fontSize: 24,
      color: isDark ? "#fff" : "#000",
      fontFamily: Fonts.OSBOLD,
    },
    input: {
      color: isDark ? "#fff" : "#000",
      backgroundColor: isDark ? "#222" : "#eee",
      padding: 20,
      borderRadius: 8,
      fontSize: 16,
      marginVertical: 20,
      fontFamily: Fonts.OSLIGHT,
    },
    searchBar: {
      borderWidth: 1,
      borderColor: "#888",
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
      color: "#000",
      fontFamily: Fonts.OSLIGHT,
    },
    passwordRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#222" : "#eee",
      borderRadius: 8,
      marginBottom: 12,
    },
    passwordInput: {
      fontFamily: Fonts.OSLIGHT,
      flex: 1,
      fontSize: 16,
      padding: 20,
      color: isDark ? "#fff" : "#000",
    },
    iconButton: { padding: 20 },
    button: {
      backgroundColor: isDark ? "#fff" : "#1d1d1d",
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 10,
    },
    buttonText: {
      color: isDark ? "#000" : "#fff",
      fontFamily: Fonts.OSREGULAR,
      fontSize: 16,
    },
    row: {
      flexDirection: "column",
      justifyContent: "space-between",
    },
    logo: {
      width: 50,
      height: 50,
      resizeMode: "contain",
    },

    teamName: {
      marginLeft: 16,
      fontSize: 16,
      fontFamily: Fonts.OSREGULAR,
    },

    imageUploadBox: {
      borderWidth: 1,
      borderColor: "#888",
      borderRadius: 10,
      height: 100,
      justifyContent: "center",
      alignItems: "center",
    },
    profileImageUploadBox: {
      borderWidth: 1,
      borderColor: "#888",
      borderRadius: 100,
      height: 120,
      width: 120,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
    },

    heading: {
      fontSize: 16,
      fontFamily: Fonts.OSMEDIUM,
      marginTop: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#444" : "#ccc",
      color: isDark ? "#fff" : "#1d1d1d",
    },

    reviewInput: {
      width: "100%",
      marginTop: 16,
      backgroundColor: isDark ? "#222" : "#eee",
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },

    reviewContainer: {
      justifyContent: "center",
      alignContent: "center",
      paddingHorizontal: 8,
      paddingBottom: 24,
    },
    favoritesScroll: {
      maxHeight: 280,
      marginTop: 8,
    },
    imagePreview: {
      height: 120,
      width: 120,
      borderRadius: 100,
      alignSelf: "center",
    },
    imagePlaceholder: {
      color: isDark ? "#aaa" : "#666",
      textAlign: "center",
      fontFamily: Fonts.OSLIGHT,
      fontSize: 12,
    },
    reviewText: {
      marginVertical: 8,
      color: isDark ? "#eee" : "#333",
      fontFamily: Fonts.OSREGULAR,
    },
    progressBarBackground: {
      height: 2,
      width: "100%",
      backgroundColor: "#ccc",
      borderRadius: 5,
      overflow: "hidden",
      marginVertical: 8,
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: "#007AFF",
    },
    skipText: {
      color: isDark ? "#aaa" : "#555",
      fontSize: 16,
      fontFamily: Fonts.OSREGULAR,
    },
    teamCardList: {
      flexDirection: "row",
      flex: 1,
      alignItems: "center",
      marginTop: 12,
      padding: 12,
      backgroundColor: isDark ? "#222" : "#f5f5f5",
      borderRadius: 8,
    },
    teamCardGrid: {
      flexDirection: "column",
      flex: 0, // important: don't stretch full width
      alignItems: "center",
      marginTop: 12,
      padding: 12,
      backgroundColor: isDark ? "#222" : "#f5f5f5",
      borderRadius: 8,
      width: "30%", // or fixed width to fit 3 columns nicely
      maxWidth: 120, // optional max width for consistency
    },

    tabBarWrapper: { paddingHorizontal: 80 },
  });
