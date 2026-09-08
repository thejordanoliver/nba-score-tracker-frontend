// styles/GameDetailStyles/TeamRow.styles.ts
import { Colors, Fonts } from "constants/styles";
import { StyleSheet } from "react-native";

export type SizeType = "small" | "medium" | "large";

export type FighterRow = {
  id?: string | number;
  espnId?: string | number;
  headshot: any;
  shortName?: string;
  name?: string;
  record?: string;
};

export type FootballTeamRowProps = {
  id: number | null;
  logo: any;
  name: string;
  record: string | null | undefined;
  timeouts: number | null;
  rank: number | null | undefined;
  isDark: boolean;
  isHome?: boolean;
  score?: number | null;
  isWinner: boolean | null;
  isTie: boolean | null;
  state?: string;
  gameStatusDescription?: string;
  size?: SizeType;
  hasPossession: boolean | null;
  opponentScore?: number | null;
  league: string;
};

export type BasketballTeamRowProps = {
  id: number | null;
  logo: any;
  name: string;
  record: string;
  timeouts?: number;
  bonusState: string | undefined | null;
  size?: SizeType;
  rank: number | null;
  isDark: boolean;
  isHome?: boolean;
  score?: number;
  isWinner?: boolean;
  hideRecord?: boolean;
  colors?: {
    text: string;
    record: string;
    score: string;
    winnerScore: string;
  };
  gameStatusDescription?: string;
  league: string;
};

export type MMAProps = {
  id?: number;
  headshot: string;
  name: string;
  flag: string | undefined;
  record: string | undefined;
  size?: SizeType;
  rank?: string;
  isDark: boolean;
  isFirstFighter?: boolean;
  isWinner?: boolean;
  hideRecord?: boolean;
  gameStatusDescription?: string;
};

export type TennisProps = {
  id: string | null;
  isHome?: boolean;
  name: string;
  flag: string | null;
  flags: string[];
  country: string | null;
  rank: number | null;
  isWinner: boolean | null;
  serving: boolean;
  score: number;
  gameStatusDescription?: string;
  isDark: boolean;
};

export type RacingProps = {
  id?: number;
  name: string;
  headshot: string | null | undefined;
  flag: string | null | undefined;
  laps: string | null | undefined;
  time: string | null | undefined;
  size?: SizeType;
  rank?: string;
  isDark: boolean;
  isWinner: boolean | null | undefined;
  gameStatusDescription: string | null | undefined;
};

export type BaseballProps = {
  id: number;
  name: string;
  logo: any;
  record: string;
  size?: SizeType;
  rank: number | undefined | null;
  isDark: boolean;
  isHome?: boolean;
  score?: number;
  isWinner: boolean;
  hideRecord?: boolean;
  state?: string | null;
  gameStatusDescription?: string;
  league: string;
};

export type SoccerProps = {
  id: number;
  name: string;
  logo: any;
  record: string;
  size?: SizeType;
  rank: number | undefined | null;
  isHome?: boolean;
  isDark: boolean;
  score?: number;
  isTie?: boolean | undefined | null;
  isWinner?: boolean | undefined | null;
  hideRecord?: boolean;
  state?: string | null;
  gameStatusDescription?: string;
  league: string;
  isNational: boolean | undefined | null;
  isAllStar: boolean | undefined | null;
};

export type NHLProps = {
  id: number | null;
  logo: any;
  name: string;
  record: string;
  timeouts?: number;
  size?: SizeType;
  rank?: number | null;
  isDark: boolean;
  isHome?: boolean;
  score?: number;
  isWinner?: boolean;
  hideRecord?: boolean;
  colors?: {
    text: string;
    record: string;
    score: string;
    winnerScore: string;
  };
  gameStatusDescription?: string;
  league: string;
};

// Main static styles
export const TeamRowStyles = (isDark: boolean, isTie?: boolean) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
    },
    teamInfoContainer: {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    },
    teamInfo: {
      justifyContent: "center",
    },
    headshotContainer: {
      borderWidth: 1,
      borderColor: isDark ? Colors.lightGray : Colors.darkGray,
      borderRadius: 100,
      overflow: "hidden",
    },

    logo: {
      width: 50,
      height: 50,
    },

    headshot: {
      width: 50,
      height: 50,
      paddingTop: 4,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    teamName: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    rank: {
      fontSize: 10,
      color: Colors.lightGray,
    },
    record: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: isTie
        ? isDark
          ? Colors.white
          : Colors.black
        : isDark
          ? Colors.white
          : Colors.black,
      textAlign: "center",
    },
    score: {
      width: 60,
      marginHorizontal: 16,
      fontFamily: Fonts.BOLD,
      fontSize: 36,
      textAlign: "center",
    },
    preGameRecord: {
      width: 80,
      marginHorizontal: 8,
      fontFamily: Fonts.BOLD,
      fontSize: 20,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    scoreWrapper: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    possessionIcon: {
      position: "absolute",
      bottom: "-35%",
      alignSelf: "center",
      width: 25,
      height: 40,
      resizeMode: "contain",
    },
    timeoutsContainer: { alignItems: "center" },
    bonus: {
      position: "absolute",
      bottom: -10,
      marginTop: 2,
      fontFamily: Fonts.MEDIUM,
      fontSize: 8,
      letterSpacing: 0.5,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
  });

// Main static styles
export const DriverRowStyles = (isDark: boolean, isTie?: boolean) =>
  StyleSheet.create({
    row: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.lightGray : Colors.darkGray,
      borderRadius: 8,
    },
    driverContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rank: {
      width: 30,
      fontFamily: Fonts.BOLD,
      fontSize: 24,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    profileContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    headshotContainer: {
      width: 40,
      height: 40,
      marginHorizontal: 8,
      borderWidth: 1,
      borderColor: isDark ? Colors.lightGray : Colors.darkGray,
      borderRadius: 999,
      overflow: "hidden",
    },
    headshot: {
      width: 40,
      height: 40,
      paddingTop: 4,
    },

    name: {
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    subText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textAlign: "center",
    },
  });

// Main static styles
export const CompetitorRowStyles = (isDark: boolean, isTie?: boolean) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
    },
    teamInfoContainer: {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    },
    teamInfo: {
      justifyContent: "center",
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
      marginBottom: 4,
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

    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    name: {
      width: 80,
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    rank: {
      fontSize: 10,
      color: Colors.lightGray,
    },
    record: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: isTie
        ? isDark
          ? Colors.white
          : Colors.black
        : isDark
          ? Colors.white
          : Colors.black,
      textAlign: "center",
    },
    score: {
      width: 60,
      marginHorizontal: 16,
      fontFamily: Fonts.BOLD,
      fontSize: 36,
      textAlign: "center",
    },
    preGameRecord: {
      width: 80,
      marginHorizontal: 8,
      fontFamily: Fonts.BOLD,
      fontSize: 20,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    scoreWrapper: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },
    serveIndicator: {
      position: "absolute",
      bottom: -10,
      width: 7,
      height: 7,
      borderRadius: 999,
      backgroundColor: isDark ? Colors.dark.limeGreen : Colors.light.green,
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
  });
