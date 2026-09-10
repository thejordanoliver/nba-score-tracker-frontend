import { Colors, Fonts } from "constants/styles";
import { StyleSheet } from "react-native";

export const PlayByPlayStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {},
    wrapper: {
      gap: 6,
      padding: 12,
      borderWidth: 1,
      borderColor: isDark ? Colors.midTone : Colors.lightGray,
      borderRadius: 8,
    },
    fieldFrame: {
      alignItems: "center",
      alignSelf: "stretch",
      marginTop: -2,
      overflow: "hidden",
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 10,
    },
    headerRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 8,
      minWidth: 0,
    },
    headerMeta: {
      flexShrink: 0,
      alignItems: "flex-end",
      gap: 4,
    },
    liveRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minHeight: 22,
    },
    participantsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-evenly",
      gap: 8,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.white : Colors.black,
    },
    participantItem: {
      flexShrink: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minWidth: 110,
      maxWidth: "100%",
    },
    participantAvatar: {
      alignItems: "center",
      justifyContent: "center",
      width: 40,
      height: 40,
      borderWidth: 1,
      borderColor: isDark ? Colors.lightGray : Colors.darkGray,
      borderRadius: 999,
      overflow: "hidden",
    },
    participantHeadshot: {
      width: "100%",
      height: "100%",
    },
    participantInitials: {
      fontFamily: Fonts.BOLD,
      fontSize: 12,
      lineHeight: 14,
      color: isDark ? Colors.white : Colors.black,
    },
    participantTextGroup: {
      flexShrink: 1,
      minWidth: 0,
    },
    participantRole: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 10,
      lineHeight: 12,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textTransform: "uppercase",
    },
    participantName: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 13,
      lineHeight: 15,
      color: isDark ? Colors.white : Colors.black,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 999,
      backgroundColor: isDark ? Colors.dark.leafGreen : Colors.light.green,
    },

    divider: {
      width: 1,
      height: 14,
      backgroundColor: isDark ? Colors.lightGray : Colors.darkGray,
    },
    eyebrow: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 11,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textTransform: "uppercase",
    },
    gameTime: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 18,
      lineHeight: 22,
      color: isDark ? Colors.white : Colors.black,
    },
    titleText: {
      flexShrink: 1,
      fontFamily: Fonts.MEDIUM,
      fontSize: 18,
      lineHeight: 22,
      color: isDark ? Colors.white : Colors.black,
    },
    fourthDown: {
      color: isDark ? Colors.dark.lightRed : Colors.light.red,
    },
    scoringPlay: {
      color: isDark ? Colors.dark.limeGreen : Colors.light.green,
    },
    turnover: {
      color: isDark ? Colors.dark.lightRed : Colors.light.red,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      height: 60,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },

    detailText: {
      flex: 1,
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      lineHeight: 16,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },

    headerLogo: {
      width: 36,
      height: 36,
      resizeMode: "contain",
    },
    playStatusBadge: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      height: 22,
      minWidth: 82,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderRadius: 4,
      overflow: "hidden",
    },
    redZoneBadge: {
      borderColor: isDark ? Colors.dark.lightRed : Colors.light.red,
      backgroundColor: isDark ? Colors.light.red : Colors.dark.lightRed,
    },
    touchdownBadge: {
      minWidth: 94,
      borderColor: isDark ? Colors.dark.limeGreen : Colors.light.green,
      backgroundColor: isDark ? Colors.dark.limeGreen : Colors.light.green,
    },
    fieldGoalBadge: {
      minWidth: 88,
      borderColor: isDark ? Colors.dark.yellow : Colors.light.yellow,
      backgroundColor: isDark ? "#7A5A09" : "#B88700",
    },
    baseballBadge: {
      borderColor: isDark ? Colors.dark.leafGreen : Colors.light.green,
      backgroundColor: isDark ? "#245C2A" : Colors.light.green,
    },
    playStatusGlow: {
      ...StyleSheet.absoluteFill,
    },
    redZoneGlow: {
      backgroundColor: isDark ? Colors.dark.lightRed : Colors.light.red,
    },
    touchdownGlow: {
      backgroundColor: isDark ? Colors.dark.limeGreen : Colors.light.green,
    },
    fieldGoalGlow: {
      backgroundColor: isDark ? Colors.dark.yellow : Colors.light.yellow,
    },
    baseballGlow: {
      backgroundColor: isDark ? Colors.dark.leafGreen : Colors.light.green,
    },
    playStatusText: {
      fontFamily: Fonts.BOLD,
      fontSize: 10,
      lineHeight: 12,
      color: Colors.white,
    },
  });
