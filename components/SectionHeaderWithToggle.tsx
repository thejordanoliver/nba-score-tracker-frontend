import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const OSMEDIUM = "Oswald_500Medium";


type Props = {
  title: string;
  isGridView: boolean;
  onToggleView: () => void;
};

const SectionHeaderWithToggle: React.FC<Props> = ({
  title,
  isGridView,
  onToggleView,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { colors } = theme(isDark);

  return (
    <View
      style={[styles.favoritesHeader, { borderBottomColor: colors.border }]}
    >
      <Text style={[styles.heading, { color: isDark ? "white" : "#1d1d1d" }]}>
        {title}
      </Text>
      <Pressable
        onPress={onToggleView}
        accessibilityRole="button"
        accessibilityLabel="Toggle view"
        style={styles.toggleIcon}
      >
        <Ionicons
          name={isGridView ? "list" : "grid"}
          size={22}
          color={isDark ? "#fff" : "#000"}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  favoritesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  toggleIcon: {
    paddingHorizontal: 4,
  },
  heading: {
    fontSize: 24,
    fontFamily: OSMEDIUM,
  },
});

const theme = (isDark: boolean) => ({
  colors: {
    background: isDark ? "#1d1d1d" : "#fff",
    inverse: isDark ? "#fff" : "#1d1d1d",
    bannerBackground: isDark ? "#333" : "#ccc",
    profileBorder: isDark ? "#222" : "#fff",
    profileBackground: isDark ? "#444" : "#eee",
    textPrimary: isDark ? "#fff" : "#1d1d1d",
    textSecondary: isDark ? "#ccc" : "#333",
    textTertiary: isDark ? "#888" : "#666",
    accent: isDark ? "#1d1d1d" : "#fff",
    border: isDark ? "#444" : "#ccc",
    followCount: isDark ? "#fff" : "#1d1d1d",
  },
  fonts: {
    bold: "Oswald_500Medium",
    medium: "Oswald_400Regular",
    light: "Oswald_300Light",
  },
});

export default SectionHeaderWithToggle;
