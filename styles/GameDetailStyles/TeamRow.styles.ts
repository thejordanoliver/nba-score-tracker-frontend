// styles/GameDetailStyles/TeamRow.styles.ts

import { Colors, Fonts } from "constants/styles";
import { StyleSheet } from "react-native";

/* ============================================================
 * Types
 * ========================================================== */

export type SizeType = "small" | "medium" | "large";

/* ============================================================
 * Football
 * ========================================================== */

export type FootballProps = {
  id: number | null;
  logo: any;
  name: string;
  record: string | null | undefined;
  timeouts: number | null;
  rank: number | null | undefined;

  isDark: boolean;
  isHome?: boolean;
  isWinner: boolean | null;
  isTie: boolean | null;

  score?: number | null;
  opponentScore?: number | null;

  state?: string;
  gameStatusDescription?: string;

  size?: SizeType;

  hasPossession: boolean | null;

  league: string;
};

/* ============================================================
 * Basketball
 * ========================================================== */

export type BasketballProps = {
  id: number | null;
  logo: any;
  name: string;
  record: string;

  timeouts?: number;
  bonusState: string | undefined | null;

  rank: number | null;
  score?: number;

  isDark: boolean;
  isHome?: boolean;
  isWinner?: boolean;
  hideRecord?: boolean;

  size?: SizeType;

  colors?: {
    text: string;
    record: string;
    score: string;
    winnerScore: string;
  };

  gameStatusDescription?: string;

  league: string;
};

/* ============================================================
 * MMA
 * ========================================================== */

export type MMAProps = {
  id?: number;

  headshot: string;
  name: string;
  flag: string | undefined;
  record: string | undefined;
  rank?: string;

  isDark: boolean;
  isFirstFighter?: boolean;
  isWinner?: boolean;
  hideRecord?: boolean;

  size?: SizeType;

  gameStatusDescription?: string;
};

/* ============================================================
 * Tennis
 * ========================================================== */

export type TennisProps = {
  id: string | null;

  name: string;

  flag: string | null;
  flags: string[];
  country: string | null;

  rank: number | null;
  score: number | null;

  isHome?: boolean;
  isWinner: boolean | null;
  serving: boolean;

  state?: string | null;

  isDark: boolean;
};

/* ============================================================
 * Racing
 * ========================================================== */

export type RacingProps = {
  id?: number;

  name: string;
  headshot: string | null | undefined;
  flag: string | null | undefined;

  laps: string | null | undefined;
  time: string | null | undefined;
  rank?: string;

  isDark: boolean;
  isWinner: boolean | null | undefined;

  size?: SizeType;

  gameStatusDescription: string | null | undefined;
};

/* ============================================================
 * Baseball
 * ========================================================== */

export type BaseballProps = {
  id: number;

  name: string;
  logo: any;
  record: string;

  rank: number | undefined | null;
  score?: number;

  isDark: boolean;
  isHome?: boolean;
  isWinner: boolean;
  hideRecord?: boolean;

  state?: string | null;
  gameStatusDescription?: string;

  size?: SizeType;

  league: string;
};

/* ============================================================
 * Soccer
 * ========================================================== */

export type SoccerProps = {
  id: number;

  name: string;
  logo: any;
  record: string;

  rank: number | undefined | null;
  score?: number;

  isHome?: boolean;
  isDark: boolean;

  isTie?: boolean | undefined | null;
  isWinner?: boolean | undefined | null;
  hideRecord?: boolean;

  isNational: boolean | undefined | null;
  isAllStar: boolean | undefined | null;

  state?: string | null;
  gameStatusDescription?: string;

  size?: SizeType;

  league: string;
};

/* ============================================================
 * NHL
 * ========================================================== */

export type NHLProps = {
  id: number | null;

  logo: any;
  name: string;
  record: string;

  timeouts?: number;
  rank?: number | null;
  score?: number;

  isDark: boolean;
  isHome?: boolean;
  isWinner?: boolean;
  hideRecord?: boolean;

  size?: SizeType;

  colors?: {
    text: string;
    record: string;
    score: string;
    winnerScore: string;
  };

  gameStatusDescription?: string;

  league: string;
};

/* ============================================================
 * Shared Team Row Styles
 * Football / Basketball / Baseball / Soccer / Hockey
 * ========================================================== */

export const TeamRowStyles = (isDark: boolean, _isTie?: boolean) =>
  StyleSheet.create({
    /* ----------------------------------------------------------
     * Layout
     * -------------------------------------------------------- */

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

    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    scoreWrapper: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    },

    timeoutsContainer: {
      alignItems: "center",
    },

    /* ----------------------------------------------------------
     * Media
     * -------------------------------------------------------- */

    logo: {
      width: 50,
      height: 50,
    },

    headshotContainer: {
      borderWidth: 1,
      borderColor: isDark ? Colors.lightGray : Colors.darkGray,
      borderRadius: 100,
      overflow: "hidden",
    },

    headshot: {
      width: 50,
      height: 50,
      paddingTop: 4,
    },

    /* ----------------------------------------------------------
     * Team Information
     * -------------------------------------------------------- */

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
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },

    /* ----------------------------------------------------------
     * Score
     * -------------------------------------------------------- */

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

    /* ----------------------------------------------------------
     * Game Status
     * -------------------------------------------------------- */

    possessionIcon: {
      position: "absolute",
      bottom: "-35%",
      alignSelf: "center",
      width: 25,
      height: 40,
      resizeMode: "contain",
    },

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

/* ============================================================
 * Racing Driver Row Styles
 * ========================================================== */

export const DriverRowStyles = (isDark: boolean, _isTie?: boolean) =>
  StyleSheet.create({
    /* ----------------------------------------------------------
     * Layout
     * -------------------------------------------------------- */

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

    profileContainer: {
      flexDirection: "row",
      alignItems: "center",
    },

    /* ----------------------------------------------------------
     * Driver Media
     * -------------------------------------------------------- */

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

    /* ----------------------------------------------------------
     * Driver Information
     * -------------------------------------------------------- */

    rank: {
      width: 30,
      fontFamily: Fonts.BOLD,
      fontSize: 24,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
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
