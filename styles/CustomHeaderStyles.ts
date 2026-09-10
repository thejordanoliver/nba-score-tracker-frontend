import { Colors, Fonts } from "constants/styles";
import { StyleSheet } from "react-native";

const TABLET_BREAKPOINT = 768;

export const customHeaderStyles = (isDark: boolean, screenWidth: number) => {
  const isTablet = screenWidth >= TABLET_BREAKPOINT;

  return StyleSheet.create({
    bgImage: {
      position: "absolute",
      top: isTablet ? -90 : -70,
      zIndex: 0,

      width: "100%",
      height: isTablet ? 260 : 200,

      opacity: 0.25,

      resizeMode: "contain",
    },

    headerSidePlaceholder: {
      width: isTablet ? 32 : 24,
    },

    exploreHeaderActions: {
      flexDirection: "row",
      alignItems: "center",

      gap: isTablet ? 4 : 2,
    },

    exploreHeaderActionButton: {
      alignItems: "center",
      justifyContent: "center",

      width: isTablet ? 38 : 34,
      height: isTablet ? 38 : 34,

      borderRadius: isTablet ? 19 : 17,
    },

    exploreHeaderActionButtonSelected: {
      backgroundColor: isDark ? Colors.white : Colors.black,
    },

    profileHeaderPlaceholder: {
      width: isTablet ? 40 : 32,
    },

    defaultHeaderTitleContainer: {
      flex: 1,

      alignItems: "center",
      justifyContent: "center",
    },

    leagueHeaderContainer: {
      flex: 1,

      alignItems: "center",
      justifyContent: "center",

      height: isTablet ? 64 : 56,

      overflow: "hidden",
    },

    leagueHeaderButton: {
      zIndex: 2,

      flexDirection: "row",
      alignItems: "center",
    },

    teamHeaderActions: {
      flexDirection: "row",
      alignItems: "center",

      gap: isTablet ? 4 : 0,
    },

    teamHeaderActionButton: {
      padding: isTablet ? 10 : 8,
    },

    // ----------------------------------------------------------------
    // GAME HEADER
    // ----------------------------------------------------------------

    teamHalfWrapper: {
      position: "relative",

      flex: 1,

      alignItems: "center",
      justifyContent: "center",

      overflow: "hidden",
    },

    teamHalfContent: {
      ...StyleSheet.absoluteFill,

      zIndex: 2,

      alignItems: "center",
      justifyContent: "center",
    },

    bgLogo: {
      position: "absolute",

      alignSelf: "center",

      width: isTablet ? "82%" : "100%",
      height: isTablet ? 260 : 180,

      marginTop: isTablet ? 16 : 10,

      opacity: 0.25,
    },

    teamCodeRow: {
      flexDirection: "row",

      alignItems: "center",
      justifyContent: "center",

      gap: isTablet ? 2 : 0,
    },

    teamCode: {
      zIndex: 2,
      fontFamily: Fonts.BOLD,
      fontSize: isTablet ? 32 : 24,
      lineHeight: isTablet ? 42 : 30,
      color: Colors.white,
      textAlign: "center",
    },

    dividerWrapper: {
      position: "absolute",
      left: "50%",
      top: 0,
      bottom: 0,
      zIndex: 10,
      width: isTablet ? 80 : 60,
      marginLeft: isTablet ? -15 : -30,
      alignItems: "center",
      justifyContent: "center",
    },

    dividerText: {
      fontFamily: Fonts.BOLD,
      fontSize: isTablet ? 32 : 24,
      color: Colors.white,
      textAlign: "center",
    },

    // ----------------------------------------------------------------
    // MESSAGE HEADER
    // ----------------------------------------------------------------

    messageHeaderContainer: {
      flex: 1,

      flexDirection: "row",

      alignItems: "center",
      justifyContent: "center",

      height: isTablet ? 64 : 56,

      paddingHorizontal: isTablet ? 12 : 8,
    },

    messageAvatarWrap: {
      width: isTablet ? 42 : 36,
      height: isTablet ? 42 : 36,

      marginRight: isTablet ? 12 : 9,

      borderRadius: isTablet ? 21 : 18,
    },

    messageAvatar: {
      width: isTablet ? 42 : 36,
      height: isTablet ? 42 : 36,

      borderRadius: isTablet ? 21 : 18,

      backgroundColor: Colors.darkGray,
    },

    messageOnlineDot: {
      position: "absolute",

      right: -1,
      bottom: 1,

      width: isTablet ? 12 : 10,
      height: isTablet ? 12 : 10,

      borderWidth: 1.5,
      borderRadius: isTablet ? 6 : 5,

      backgroundColor: Colors.dark.leafGreen,
    },

    messageHeaderTextWrap: {
      justifyContent: "center",

      maxWidth: screenWidth * (isTablet ? 0.42 : 0.54),
    },

    messageUsernameRow: {
      flexDirection: "row",

      alignItems: "center",

      gap: isTablet ? 6 : 4,
    },

    messageUsername: {
      flexShrink: 1,

      fontFamily: Fonts.BOLD,

      fontSize: isTablet ? 17 : 15,
    },

    messageFullName: {
      marginTop: 1,

      fontFamily: Fonts.REGULAR,

      fontSize: isTablet ? 13 : 11,
    },

    // ----------------------------------------------------------------
    // PROFILE HEADER
    // ----------------------------------------------------------------

    profileMenuAnchor: {
      position: "relative",

      zIndex: 50,

      alignItems: "center",
      justifyContent: "center",

      width: isTablet ? 40 : 32,
      height: isTablet ? 40 : 32,

      elevation: 50,
    },

    profileHeaderActionButton: {
      alignItems: "center",
      justifyContent: "center",

      width: isTablet ? 40 : 32,
      height: isTablet ? 40 : 32,

      borderRadius: isTablet ? 20 : 16,
    },

    profileSubmenu: {
      position: "absolute",

      top: isTablet ? 46 : 38,
      right: 0,

      width: isTablet ? 180 : 150,

      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: isTablet ? 16 : 14,

      overflow: "hidden",

      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,

      borderColor: isDark ? Colors.darkGray : Colors.lightGray,

      shadowColor: Colors.black,

      shadowOffset: {
        width: 0,
        height: 6,
      },

      shadowOpacity: 0.18,
      shadowRadius: 12,

      elevation: 18,
    },

    profileSubmenuItem: {
      flexDirection: "row",

      alignItems: "center",

      gap: isTablet ? 10 : 8,

      paddingHorizontal: isTablet ? 14 : 10,
      paddingVertical: isTablet ? 13 : 10,
    },

    profileSubmenuIconWrap: {
      alignItems: "center",
      justifyContent: "center",

      width: isTablet ? 28 : 24,
      height: isTablet ? 28 : 24,

      borderRadius: isTablet ? 14 : 12,
    },

    profileSubmenuText: {
      flex: 1,

      fontFamily: Fonts.BOLD,

      fontSize: isTablet ? 14 : 12,

      color: isDark ? Colors.dark.text : Colors.light.text,
    },

    profileSubmenuSeparator: {
      height: StyleSheet.hairlineWidth,

      marginLeft: isTablet ? 52 : 42,

      backgroundColor: isDark ? Colors.darkGray : Colors.lightGray,
    },

    // ----------------------------------------------------------------
    // HEADER ACTIONS
    // ----------------------------------------------------------------

    headerActionButton: {
      alignItems: "center",
      justifyContent: "center",

      width: isTablet ? 46 : 40,
      height: isTablet ? 46 : 40,

      borderRadius: isTablet ? 23 : 20,
    },

    headerActionButtonPressed: {
      opacity: 0.65,
    },

    notificationButton: {
      position: "relative",

      alignItems: "center",
      justifyContent: "center",

      width: isTablet ? 40 : 32,
      height: isTablet ? 40 : 32,
    },

    notificationBadge: {
      position: "absolute",

      top: isTablet ? -6 : -5,
      right: isTablet ? -3 : -2,

      minWidth: isTablet ? 22 : 20,
      height: isTablet ? 22 : 20,

      paddingHorizontal: isTablet ? 5 : 4,

      alignItems: "center",
      justifyContent: "center",

      overflow: "hidden",

      borderRadius: 999,

      backgroundColor: isDark ? Colors.dark.lightRed : Colors.light.red,

      borderWidth: 2,

      borderColor: isDark ? Colors.black : Colors.white,
    },

    notificationBadgeText: {
      fontFamily: Fonts.REGULAR,

      fontSize: isTablet ? 11 : 10,

      color: Colors.white,

      textAlign: "center",
    },
  });
};
