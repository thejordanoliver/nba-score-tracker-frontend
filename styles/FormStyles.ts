import { Colors, Fonts } from "constants/styles";
import { StyleSheet } from "react-native";

// ─── Design Tokens ───────────────────────────────────────────────────────────

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

const INPUT_HEIGHT = 54;

// ─── Styles ──────────────────────────────────────────────────────────────────

export const formStyles = (isDark: boolean) => {
  const background = isDark ? Colors.black : Colors.white;

  const surface = isDark
    ? Colors.dark.itemBackground
    : Colors.light.itemBackground;

  const text = isDark ? Colors.white : Colors.black;

  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const focusBorder = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)";

  const subtleText = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";

  const divider = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";

  return StyleSheet.create({
    // ─── Layout ──────────────────────────────────────────────────────────────

    container: {
      flex: 1,
      padding: SPACING.md,
      marginBottom: 40,
      backgroundColor: background,
    },

    sectionContainer: {
      flex: 1,
    },

    formWrapper: {
      flex: 1,
      justifyContent: "center",
      gap: SPACING.md,
    },

    field: {
      gap: SPACING.xs,
    },

    row: {
      flexDirection: "column",
      gap: SPACING.sm,
    },

    tabs: {
      marginBottom: SPACING.md,
    },

    buttonContainer: {
      justifyContent: "center",
    },

    favoritesContainer: {
      flex: 1,
    },

    reviewContainer: {
      justifyContent: "center",
    },

    // ─── Inputs ──────────────────────────────────────────────────────────────

    input: {
      height: INPUT_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING.lg,
      borderRadius: RADIUS.sm,
      backgroundColor: surface,
    },

    inputFocused: {
      borderWidth: 1,
      borderColor: focusBorder,
    },

    inputError: {
      borderWidth: 1,
      borderColor: isDark ? Colors.dark.lightRed : Colors.light.red,
    },

    inputText: {
      flex: 1,
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: text,
    },

    fieldErrorText: {
      paddingHorizontal: SPACING.xs,
      fontFamily: Fonts.REGULAR,
      fontSize: 13,
      color: isDark ? Colors.dark.lightRed : Colors.light.red,
    },

    reviewInput: {
      marginTop: SPACING.xs,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderWidth: 1,
      borderColor: border,
      borderRadius: RADIUS.md,
      backgroundColor: surface,
    },

    // ─── Links ───────────────────────────────────────────────────────────────

    forgotPasswordLink: {
      alignSelf: "center",
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
    },

    forgotPasswordText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: Colors.midTone,
    },

    skipText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: Colors.midTone,
    },

    // ─── Progress Bar ────────────────────────────────────────────────────────

    progressContainer: {
      gap: SPACING.xs,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.md,
    },

    progressMeta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: SPACING.xs,
    },

    progressLabel: {
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      letterSpacing: 0.5,
      color: subtleText,
      textTransform: "uppercase",
    },

    progressBarBackground: {
      width: "100%",
      height: 3,
      borderRadius: RADIUS.full,
      backgroundColor: divider,
      overflow: "hidden",
    },

    progressBarFill: {
      height: "100%",
      borderRadius: RADIUS.full,
      backgroundColor: text,
    },

    // ─── Team ────────────────────────────────────────────────────────────────

    logo: {
      width: 50,
      height: 50,
      resizeMode: "contain",
    },

    teamName: {
      marginLeft: SPACING.lg,
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: text,
    },

    teamCardList: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: SPACING.md,
      padding: SPACING.md,
      borderRadius: RADIUS.sm,
      backgroundColor: surface,
    },

    // ─── Image Upload ────────────────────────────────────────────────────────

    imageUploadBox: {
      height: 100,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: border,
      borderStyle: "dashed",
      borderRadius: RADIUS.md,
      backgroundColor: surface,
      overflow: "hidden",
    },

    profileImageUploadBox: {
      width: 110,
      height: 110,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: SPACING.sm,
      borderWidth: 1,
      borderColor: border,
      borderStyle: "dashed",
      borderRadius: RADIUS.full,
      backgroundColor: surface,
      overflow: "hidden",
    },

    bannerImage: {
      width: "100%",
      height: "100%",
      borderRadius: RADIUS.md,
    },

    imagePreview: {
      width: 120,
      height: 120,
      alignSelf: "center",
      borderRadius: RADIUS.full,
    },

    imagePlaceholder: {
      fontFamily: Fonts.LIGHT,
      fontSize: 12,
      color: subtleText,
      textAlign: "center",
    },

    // ─── Section / Review ────────────────────────────────────────────────────

    heading: {
      marginTop: SPACING.lg,
      marginBottom: SPACING.xs,
      fontFamily: Fonts.MEDIUM,
      fontSize: 11,
      letterSpacing: 0.6,
      color: subtleText,
      textTransform: "uppercase",
    },

    divider: {
      height: StyleSheet.hairlineWidth,
      marginVertical: SPACING.xs,
      backgroundColor: divider,
    },

    reviewText: {
      marginVertical: SPACING.sm,
      fontFamily: Fonts.REGULAR,
      color: Colors.midTone,
    },

    // ─── Tabs ────────────────────────────────────────────────────────────────

    tabBarWrapper: {
      paddingHorizontal: 80,
    },
  });
};
