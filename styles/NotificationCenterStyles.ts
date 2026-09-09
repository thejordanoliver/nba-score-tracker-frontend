import { Colors, Fonts } from "@/constants/styles";
import { StyleSheet } from "react-native";

export const NotificationsCenterStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 80,
    },

    emptyContainer: {
      justifyContent: "center",
    },

    listHeader: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: 8,
      paddingVertical: 6,
    },

    markAllButton: {
      paddingHorizontal: 4,
      paddingVertical: 4,
    },

    markAllButtonPressed: {
      opacity: 0.55,
    },

    markAllText: {
      fontFamily: Fonts.BOLD,
      fontSize: 13,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },

    notificationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
    },

    notificationRowUnread: {
    
    },

    notificationRowPressed: {
      opacity: 0.55,
    },

    iconWrapper: {
      position: "relative",
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.lightGray : Colors.darkGray,
      borderRadius: 21,
    },

    gameTeamLogoWrapper: {
      width: 52,
      borderWidth: 0,
      borderRadius: 0,
    },

    profileImage: {
      width: "100%",
      height: "100%",
      borderRadius: 21,
    },

    unreadDot: {
      position: "absolute",
      top: 2,
      right: 2,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? Colors.dark.blue : Colors.light.blue,
    },

    textContainer: {
      flex: 1,
      gap: 4,
      paddingTop: 1,
    },

    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    leagueLabel: {
      flexShrink: 0,
      overflow: "hidden",
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: isDark ? Colors.dark.blue : Colors.light.blue,
      color: Colors.white,
      fontFamily: Fonts.BOLD,
      fontSize: 10,
      lineHeight: 13,
      letterSpacing: 0.4,
    },

    notificationHeader: {
      flexShrink: 1,
      fontFamily: Fonts.BOLD,
      fontSize: 16,
      lineHeight: 20,
      color: isDark ? Colors.white : Colors.black,
    },

    notificationText: {
      flexShrink: 1,
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      lineHeight: 20,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },

    notificationTime: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      lineHeight: 16,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },

    teamNames: {
      flexShrink: 1,
      fontFamily: Fonts.BOLD,
      fontSize: 12,
      lineHeight: 16,
      color: isDark ? Colors.white : Colors.black,
    },

    chevron: {
      flexShrink: 0,
    },

    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 32,
      paddingVertical: 40,
    },

    emptyTitle: {
      marginTop: 4,
      fontFamily: Fonts.BOLD,
      fontSize: 18,
      color: isDark ? Colors.white : Colors.black,
    },

    emptyText: {
      maxWidth: 320,
      textAlign: "center",
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      lineHeight: 20,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
  });
