import { Colors, Fonts } from "constants/styles";
import { StyleSheet } from "react-native";

export const createPostStyles = (isDark: boolean) =>
  StyleSheet.create({
    // ─── Screen / scroll ────────────────────────────────────────────────
    container: {
      flexGrow: 1,
      paddingBottom: 40,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },

    // ─── User identity row ───────────────────────────────────────────────
    userRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingTop: 14,
      paddingBottom: 8,
    },
    avatar: {
      alignItems: "center",
      justifyContent: "center",
      width: 38,
      height: 38,
      borderRadius: 19,
      overflow: "hidden",
    },
    avatarImage: {
      width: 38,
      height: 38,
    },

    userInfo: {
      flex: 1,
      flexDirection: "column",
      gap: 2,
    },
    username: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
      lineHeight: 18,
      color: isDark ? Colors.white : Colors.black,
    },
    audiencePill: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 999,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },
    audiencePillText: {
      flexShrink: 1,
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },

    // ─── Text composer ───────────────────────────────────────────────────
    textContainer: {
      flex: 1,
    },
    textInput: {
      minHeight: 120,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: "transparent",
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: isDark ? Colors.white : Colors.black,
      textAlignVertical: "top",
    },

    // ─── Media strip (inline thumbnails) ────────────────────────────────
    mediaStrip: {
      paddingHorizontal: 12,
      paddingBottom: 12,
      overflow: "visible",
    },
    mediaThumb: {
      alignItems: "center",
      justifyContent: "center",
      width: 80,
      height: 80,
      marginRight: 8,
      borderRadius: 10,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
      overflow: "hidden",
    },
    mediaThumbImage: {
      width: 80,
      height: 80,
      borderRadius: 10,
    },
    mediaAddButton: {
      alignItems: "center",
      justifyContent: "center",
      width: 80,
      height: 80,
      borderWidth: 1.5,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderStyle: "dashed",
      borderRadius: 10,
    },
    mediaBadge: {
      position: "absolute",
      bottom: 5,
      left: 5,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.7)",
    },
    mediaBadgeText: {
      fontFamily: Fonts.BOLD,
      fontSize: 10,
      color: Colors.white,
    },
    removeButton: {
      position: "absolute",
      top: 3,
      right: 3,
      alignItems: "center",
      justifyContent: "center",
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: "rgba(0,0,0,0.6)",
    },

    // ─── Divider ─────────────────────────────────────────────────────────
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: isDark ? Colors.darkGray : Colors.lightGray,
    },

    // ─── Toolbar ─────────────────────────────────────────────────────────
    toolbar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    toolBtn: {
      alignItems: "center",
      justifyContent: "center",
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: "transparent",
    },
    toolBtnActive: {
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },
    toolGifLabel: {
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderWidth: 1.5,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 4,
      overflow: "hidden",
      fontFamily: Fonts.BOLD,
      fontSize: 10,
      letterSpacing: 0.5,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
    toolSpacer: {
      flex: 1,
    },
    charCountRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    charCountLabel: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: isDark ? Colors.darkGray : Colors.lightGray,
    },

    // ─── Poll card ───────────────────────────────────────────────────────
    pollCardContainer: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 12,
      overflow: "hidden",
    },
    pollQuestion: {
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 6,
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      color: isDark ? Colors.white : Colors.black,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 12,
      marginBottom: 6,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 8,
    },
    pollOptionsText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 13,
      color: isDark ? Colors.white : Colors.black,
    },
    metaContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingTop: 6,
      paddingBottom: 10,
    },
    pollDuration: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    pollDurationText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
    pollRemoveContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    pollRemoveButton: {
      fontFamily: Fonts.REGULAR,
      fontSize: 11,
      color: Colors.midTone,
    },

    // ─── Bottom bar ──────────────────────────────────────────────────────
    bottom: {
      gap: 20,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? Colors.darkGray : Colors.lightGray,
    },
    bottomBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    teamBadge: {
      flexShrink: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 999,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },
    teamDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? Colors.dark.blue : Colors.light.blue,
    },
    teamBadgeText: {
      flexShrink: 1,
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
    mediaCountText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: isDark ? Colors.darkGray : Colors.lightGray,
    },

    // ─── Legacy / kept for modals ────────────────────────────────────────
    label: {
      marginBottom: 12,
      fontFamily: Fonts.REGULAR,
      fontSize: 18,
      color: isDark ? Colors.white : Colors.black,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    thumbnail: {
      alignItems: "center",
      justifyContent: "center",
      width: 80,
      height: 80,
      borderRadius: 10,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },
    // kept as alias so renderMediaItem still compiles
    thumnailPreview: {
      width: 80,
      height: 80,
      borderRadius: 10,
    },
    imageContainer: {
      marginBottom: 12,
      overflow: "visible",
    },
    addMediaText: {
      marginLeft: 4,
      fontFamily: Fonts.MEDIUM,
      fontSize: 16,
      color: isDark ? Colors.white : Colors.black,
    },
    mediaItem: {
      position: "relative",
      marginRight: 8,
      overflow: "visible",
    },
    postOptionsContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? Colors.lightGray : Colors.darkGray,
    },
    postOptionsWrapper: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
    },
    postOptionsInnerWrapper: {
      flexDirection: "row",
      alignItems: "center",
    },
  });
