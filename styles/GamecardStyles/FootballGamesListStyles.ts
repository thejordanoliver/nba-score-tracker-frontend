import { StyleSheet } from "react-native";

export const footballGamesListStyle = StyleSheet.create({
  /* ---------- Containers ---------- */

  contentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },

  gridListContainer: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },

  skeletonWrapper: {
    gap: 12,
    paddingHorizontal: 12,
  },

  skeletonGridWrapper: {
    paddingHorizontal: 12,
  },

  headerSkeleton: {
    marginHorizontal: 12,
  },

  /* ---------- Grid ---------- */

  gridRow: {
    flexDirection: "row",
    gap: 12, // 🔑 single source of truth
    marginBottom: 12,
  },

  gridItem: {
    flex: 1,
  },
});
