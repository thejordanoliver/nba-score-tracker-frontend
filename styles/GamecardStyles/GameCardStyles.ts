import { activeOpacity, Colors, Fonts } from "constants/styles";
import { StyleSheet } from "react-native";

export const gameCardStyles = (isDark: boolean, isChampionship?: boolean) => {
  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subTextColor = isDark ? Colors.lightGray : Colors.darkGray;
  const accentRed = isDark ? Colors.dark.lightRed : Colors.light.red;
  const borderColor = isDark ? Colors.lightGray : Colors.darkGray;
  const liveColor = isDark ? Colors.dark.limeGreen : Colors.light.green;
  const headlineColor = isChampionship
    ? isDark
      ? Colors.white
      : Colors.black
    : subTextColor;

  return StyleSheet.create({
    /* =========================
       🧱 LAYOUT
    ========================= */
    card: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },

    info: {
      alignItems: "center",
      justifyContent: "center",
      width: 100,
      marginTop: 4,
    },

    infoWrapper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    winnerContainer: {
      alignItems: "center",
      justifyContent: "center",
    },

    /* =========================
       🏀 TEAM
    ========================= */
    teamSection: {
      alignItems: "center",
      width: 70,
    },

    logo: {
      width: 40,
      height: 40,
      resizeMode: "contain",
    },

    teamName: {
      width: 70,
      marginTop: 4,
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: textColor,
      textAlign: "center",
    },

    rank: {
      fontSize: 10,
      color: subTextColor,
    },

    teamScore: {
      width: 72,
      fontFamily: Fonts.BOLD,
      fontSize: 28,
      textAlign: "center",
    },

    teamRecord: {
      width: 72,
      fontFamily: Fonts.BOLD,
      fontSize: 16,
      color: textColor,
      textAlign: "center",
    },

    /* =========================
       🥊 FIGHTERS
    ========================= */
    fighterContainer: {
      alignItems: "center",
      width: 40,
      height: 40,
      borderWidth: 1,
      borderColor,
      borderRadius: 100,
      overflow: "hidden",
    },

    fighter: {
      width: 48,
      height: 48,
      resizeMode: "contain",
    },

    leftFighterFlag: {
      position: "absolute",
      bottom: 14,
      left: 10,
      zIndex: 99,
      width: 20,
      height: 20,
    },

    rightFighterFlag: {
      position: "absolute",
      right: 10,
      bottom: 14,
      zIndex: 99,
      width: 20,
      height: 20,
    },

    /* =========================
       🏈 GAME STATE / STATUS
    ========================= */
    date: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: textColor,
    },

    period: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: textColor,
    },

    finalText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: accentRed,
      textAlign: "center",
    },

    clock: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: accentRed,
      textAlign: "center",
    },

    outsContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    outs: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: accentRed,
      textAlign: "center",
    },

    basesContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },

    downDistance: {
      fontFamily: Fonts.REGULAR,
      fontSize: 10,
      color: subTextColor,
      textAlign: "center",
    },

    broadcast: {
      fontFamily: Fonts.REGULAR,
      fontSize: 10,
      color: subTextColor,
      textAlign: "center",
    },

    statusDivider: {
      width: 1,
      height: 12,
      marginHorizontal: 4,
      backgroundColor: textColor,
    },

    finalStatusDivider: {
      width: 1,
      height: 12,
      marginHorizontal: 4,
      backgroundColor: accentRed,
    },

    /* =========================
       📰 HEADLINES
    ========================= */
    headlineContainer: {
      position: "absolute",
      top: 4,
      right: 0,
      left: 0,
      zIndex: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    headlineText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 8,
      color: headlineColor,
      textAlign: "center",
    },

    headlineDivider: {
      width: 1,
      height: 8,
      backgroundColor: headlineColor,
    },

    /* =========================
       ⚾ POSSESSION / EXTRAS
    ========================= */
    possession: {
      position: "absolute",
      bottom: -14,
      width: 22,
      height: 22,
      resizeMode: "contain",
    },

    flagStack: {
      flexDirection: "row",
      alignItems: "center",
    },

    flagContainer: {
      justifyContent: "center",
      alignItems: "center",
      width: 40,
      height: 40,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.white : Colors.black,
      overflow: "hidden",
    },

    flag: {
      width: 68,
      height: 68,
    },

    overlappingFlag: {
      marginLeft: -20,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },

    tiebreak: {
      color: textColor,
      fontFamily: Fonts.REGULAR,
      fontSize: 8,
    },

    serveIndicator: {
      position: "absolute",
      bottom: -10,
      width: 7,
      height: 7,
      borderRadius: 999,
      backgroundColor: liveColor,
    },
    tennisScoreColumn: {
      alignItems: "center",
      justifyContent: "center",
    },

    tennisLineScore: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },

    tennisLineScoreItem: {
      flexDirection: "row",
      alignItems: "center",
    },

    tennisLineScoreDivider: {
      width: StyleSheet.hairlineWidth,
      height: 14,
      backgroundColor: borderColor,
    },

    setCell: {
      minWidth: 18,
      minHeight: 18,
      alignItems: "center",
      justifyContent: "center",
    },

    setScore: {
      color: textColor,
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      fontVariant: ["tabular-nums"],
    },
  });
};

export const tennisCardStyles = (isDark: boolean, isGrid = false) => {
  const textColor = isDark ? Colors.white : Colors.black;
  const subTextColor = isDark ? Colors.lightGray : Colors.darkGray;
  const liveColor = isDark ? Colors.dark.limeGreen : Colors.light.green;

  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },

    teamSection: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },

    logo: {
      width: 40,
      height: 40,
      resizeMode: "contain",
    },

    competitorName: {
      width: 100,
      marginTop: 4,
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: textColor,
      textAlign: "center",
    },

    rank: {
      fontSize: 10,
      color: subTextColor,
    },

    teamScore: {
      flex: 1,
      fontFamily: Fonts.BOLD,
      fontSize: 28,
      textAlign: "center",
      backgroundColor: "red",
    },

    centerColumn: {
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      paddingHorizontal: isGrid ? 4 : 8,
      gap: 5,
    },

    competitor: {
      justifyContent: "center",
    },

    competitorTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },

    status: {
      color: subTextColor,
      fontFamily: Fonts.REGULAR,
      fontSize: isGrid ? 10 : 12,
      textAlign: "center",
      fontVariant: ["tabular-nums"],
    },

    liveStatus: {
      color: liveColor,
      fontFamily: Fonts.BOLD,
    },

    scoreboard: {
      gap: 2,
      alignItems: "center",
    },

    scoreRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    setCell: {
      width: isGrid ? 20 : 24,
      minHeight: 23,
      alignItems: "center",
      justifyContent: "center",
    },

    mutedSetCell: {
      opacity: 0.4,
    },

    setScore: {
      color: textColor,
      fontFamily: Fonts.REGULAR,
      fontSize: isGrid ? 12 : 15,
      fontVariant: ["tabular-nums"],
    },

    winningSetScore: {
      fontFamily: Fonts.BOLD,
    },

    tiebreak: {
      color: textColor,
      fontFamily: Fonts.REGULAR,
      fontSize: 8,
    },

    serveIndicator: {
      width: 7,
      height: 7,
      borderRadius: 999,
      backgroundColor: liveColor,
    },

    iconColor: {
      color: textColor,
    },

    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    broadcast: {
      flex: 1,
      fontFamily: Fonts.REGULAR,
      fontSize: 10,
      color: subTextColor,
      textAlign: "left",
    },

    court: {
      flex: 1,
      fontFamily: Fonts.REGULAR,
      fontSize: 10,
      color: subTextColor,
      textAlign: "right",
    },

    pressed: {
      opacity: activeOpacity,
    },
  });
};

export const racingCardStyles = (isDark: boolean, isChampionship?: boolean) => {
  const textColor = isDark ? Colors.dark.text : Colors.light.text;
  const subTextColor = isDark ? Colors.lightGray : Colors.darkGray;
  const accentRed = isDark ? Colors.dark.lightRed : Colors.light.red;
  const borderColor = isDark ? Colors.lightGray : Colors.darkGray;
  const goldColor = isDark ? Colors.dark.gold : Colors.light.gold;

  const headlineColor = isChampionship
    ? isDark
      ? Colors.white
      : Colors.black
    : subTextColor;

  return StyleSheet.create({
    /* =========================
       🧱 LAYOUT
    ========================= */
    card: {
      flexDirection: "column",
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },

    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },

    eventInfo: {
      flexDirection: "column",
    },

    infoWrapper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    metaRow: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },

    metaText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      color: subTextColor,
      textAlign: "center",
    },

    driverList: {
      flexDirection: "column",
    },

    driverRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: borderColor,
    },

    leaderRow: {
      borderRadius: 6,
    },

    lastDriverRow: {
      borderBottomWidth: 0,
    },

    /* =========================
       🏁 EVENT / TRACK
    ========================= */
    eventName: {
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      color: textColor,
    },

    trackName: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: subTextColor,
    },

    date: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: textColor,
    },

    lapInfo: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: accentRed,
      textAlign: "center",
    },

    /* =========================
       🏎️ DRIVER
    ========================= */
    positionContainer: {
      alignItems: "center",
      justifyContent: "center",
      width: 24,
    },

    position: {
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      color: subTextColor,
    },

    leaderPosition: {
      color: goldColor,
    },

    driverImageContainer: {
      alignItems: "center",
      width: 40,
      height: 40,
      marginRight: 8,
      borderWidth: 1,
      borderColor,
      borderRadius: 100,
      overflow: "hidden",
    },

    leaderImageContainer: {
      borderWidth: 1.5,
      borderColor: goldColor,
    },

    driverImage: {
      width: 40,
      height: 40,
      resizeMode: "contain",
    },

    driverInfoWrapper: {
      flex: 1,
      flexDirection: "column",
    },

    driverName: {
      fontFamily: Fonts.REGULAR,
      fontSize: 13,
      color: textColor,
    },

    teamName: {
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      color: subTextColor,
    },

    carNumberBadge: {
      alignItems: "center",
      justifyContent: "center",
      width: 22,
      height: 22,
      marginRight: 8,
      borderWidth: 1,
      borderColor,
      borderRadius: 4,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },

    carNumberText: {
      fontFamily: Fonts.BOLD,
      fontSize: 10,
      color: textColor,
    },

    countryFlag: {
      width: 16,
      height: 16,
      marginLeft: 4,
      resizeMode: "contain",
    },

    /* =========================
       ⏱️ TIMING / GAP
    ========================= */
    timeGap: {
      width: 64,
      fontFamily: Fonts.BOLD,
      fontSize: 13,
      color: textColor,
      textAlign: "right",
    },

    interval: {
      width: 64,
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      color: subTextColor,
      textAlign: "right",
    },

    statusIcon: {
      color: accentRed,
    },

    /* =========================
       🏆 STATUS
    ========================= */
    finalText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: accentRed,
      textAlign: "center",
    },

    liveText: {
      fontFamily: Fonts.BOLD,
      fontSize: 12,
      color: accentRed,
      textAlign: "center",
    },

    scheduledText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: subTextColor,
      textAlign: "center",
    },

    dnfText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      fontStyle: "italic",
      color: subTextColor,
    },

    statusDivider: {
      width: 1,
      height: 12,
      marginHorizontal: 4,
      backgroundColor: textColor,
    },

    finalStatusDivider: {
      width: 1,
      height: 12,
      marginHorizontal: 4,
      backgroundColor: accentRed,
    },

    /* =========================
       📰 HEADLINES
    ========================= */
    headlineContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },

    headlineText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 8,
      color: headlineColor,
      textAlign: "center",
    },

    /* =========================
       📡 BROADCAST / EXTRAS
    ========================= */
    broadcast: {
      fontFamily: Fonts.REGULAR,
      fontSize: 10,
      color: subTextColor,
      textAlign: "center",
    },

    showMoreButton: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 6,
    },

    showMoreText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: accentRed,
    },
  });
};
