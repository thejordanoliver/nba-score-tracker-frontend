import { Colors, Fonts } from "@/constants/styles";
import { StyleSheet } from "react-native";

export const FanPredictionStyles = (isDark: boolean) =>
  StyleSheet.create({
   
    wrapper: {
      flex: 1,
      flexDirection: "row",
      gap: 8,
      justifyContent: "space-evenly",
    },
    subtitle: {
      marginTop: 4,
      marginBottom: 2,
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      color: Colors.midTone,
    },
    totalVotesText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      color: Colors.midTone,
    },
    row: {
      justifyContent: "center",
      alignItems: "center",
      padding: 12,
      flex: 1,
      borderWidth: 1,
      borderColor: Colors.midTone,
      borderRadius: 12,
      overflow: "hidden",
    },
    rowSelected: {
      borderColor: isDark ? Colors.white : Colors.black,
    },
    fill: {
      position: "absolute",
      bottom: 0,
      right: 0,
      left: 0,
      opacity: 0.26,
    },
    touchArea: {
      alignItems: "center",
      gap: 10,
      height: "100%",
      paddingHorizontal: 12,
    },
    badge: {
      alignItems: "center",
      justifyContent: "center",
      width: 36,
      height: 36,
      borderRadius: 18,
      overflow: "hidden",
    },
    badgeLogo: {
      width: 32,
      height: 32,
      resizeMode: "contain",
    },
    label: {
      flex: 1,
      fontFamily: Fonts.BOLD,
      fontSize: 15,
      color: isDark ? Colors.white : Colors.black,
    },
    percent: {
      fontFamily: Fonts.BOLD,
      fontSize: 15,
      color: isDark ? Colors.white : Colors.black,
    },
    skeletonRow: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
      padding: 12,
      minHeight: 100,
      borderWidth: 1,
      borderColor: Colors.midTone,
      borderRadius: 12,
      overflow: "hidden",
    },

    skeletonBadgeLogo: {
      width: 36,
      height: 36,
    },

    skeletonTeamName: {
      width: 60,
      height: 15,
      borderRadius: 6,
    },

    skeletonSubtitle: {
      width: 180,
      height: 14,
      marginTop: 4,
      marginBottom: 2,
      borderRadius: 6,
    },

    skeletonTotalVotesText: {
      width: 70,
      height: 14,
      marginTop: 4,
      borderRadius: 6,
    },
    predictionCard: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 12,
      borderWidth: 1,
      borderColor: Colors.midTone,
      borderRadius: 12,
      gap: 10,
      height: "100%",
      overflow: "hidden",
    },

    predictionCardSelected: {
      borderColor: isDark ? Colors.white : Colors.black,
    },

    voteFill: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      opacity: 0.26,
    },

    cardContent: {
      alignItems: "center",
      gap: 10,
      height: "100%",
    },

  
    teamLogo: {
      width: 32,
      height: 32,
      resizeMode: "contain",
    },

    teamLabel: {
      flex: 1,
      fontFamily: Fonts.BOLD,
      fontSize: 15,
      color: isDark ? Colors.white : Colors.black,
    },

    votePercentage: {
      fontFamily: Fonts.BOLD,
      fontSize: 15,
      color: isDark ? Colors.white : Colors.black,
    },
  });
