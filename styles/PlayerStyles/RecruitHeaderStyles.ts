import { Colors, Fonts } from "constants/styles";
import { StyleSheet } from "react-native";

export const recruitHeaderStyles = (isDark: boolean, accent: string) => {
  const bg = isDark ? Colors.black : Colors.white;
  const surface = isDark
    ? Colors.dark.itemBackground
    : Colors.light.itemBackground;
  const text = isDark ? Colors.white : Colors.black;
  const muted = Colors.midTone;
  const divider = isDark ? Colors.darkGray : Colors.lightGray;

  return StyleSheet.create({
    container: {
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },

    // ── Avatar ──────────────────────────────────────────────
    avatarWrapper: {
      zIndex: 10,
      alignItems: "center",
    },
    avatarRing: {
      width: 110,
      height: 110,
      borderWidth: 2,
      borderColor: accent,
      borderRadius: 55,
      backgroundColor: bg,
      overflow: "hidden",
    },
    avatar: {
      width: "100%",
      height: "100%",
    },
    avatarPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      backgroundColor: Colors.midTone,
    },
    initial: {
      fontFamily: Fonts.BOLD,
      fontSize: 42,
      color: text,
    },

    // ── Position badge ───────────────────────────────────────
    positionBadge: {
      marginTop: 10,
      paddingHorizontal: 16,
      paddingVertical: 5,
      borderRadius: 4,
      backgroundColor: surface,
    },
    positionText: {
      fontFamily: Fonts.BOLD,
      fontSize: 13,
      letterSpacing: 2.5,
      color: text,
    },

    // ── Name ─────────────────────────────────────────────────
    nameContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
    },
    firstName: {
      fontFamily: Fonts.BOLD,
      fontSize: 22,
      letterSpacing: 4,
      color: text,
    },
    lastName: {
      fontFamily: Fonts.BOLD,
      fontSize: 22,
      lineHeight: 26,
      letterSpacing: 4,
      color: accent,
    },

    // ── Stats row ────────────────────────────────────────────
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "stretch",
      marginHorizontal: 20,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 8,
      backgroundColor: surface,
    },
    statChip: {
      flex: 1,
      alignItems: "center",
    },
    statValue: {
      fontFamily: Fonts.BOLD,
      fontSize: 20,
      color: text,
    },
    statLabel: {
      marginTop: 3,
      fontFamily: Fonts.MEDIUM,
      fontSize: 9,
      letterSpacing: 1.8,
      color: muted,
    },
    statDivider: {
      width: 1,
      height: 32,
      backgroundColor: divider,
    },

    // ── Info grid ────────────────────────────────────────────
    infoGrid: {
      alignSelf: "stretch",
      marginTop: 14,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: divider,
    },
    infoLabel: {
      width: 80,
      fontFamily: Fonts.MEDIUM,
      fontSize: 9,
      letterSpacing: 1.8,
      color: accent,
    },
    infoValue: {
      flex: 1,
      fontFamily: Fonts.LIGHT,
      fontSize: 13,
      color: text,
      textAlign: "right",
    },
  });
};
