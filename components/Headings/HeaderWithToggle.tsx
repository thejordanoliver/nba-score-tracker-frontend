import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  isGridView: boolean;
  onToggleView: () => void;
};

export default function HeaderWithToggle({
  title,
  isGridView,
  onToggleView,
}: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = HeaderWithToggleStyles(isDark);

  return (
    <View style={[styles.favoritesHeader, {}]}>
      <Text style={styles.heading}>{title}</Text>
      <Pressable
        onPress={onToggleView}
        accessibilityRole="button"
        accessibilityLabel="Toggle view"
        style={styles.toggleIcon}
      >
        <Ionicons
          name={isGridView ? "list" : "grid"}
          size={22}
          color={isDark ? Colors.white : Colors.black}
        />
      </Pressable>
    </View>
  );
}

const HeaderWithToggleStyles = (isDark: boolean) =>
  StyleSheet.create({
    favoritesHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? Colors.lightGray : Colors.darkGray,
    },
    toggleIcon: {
      paddingHorizontal: 4,
    },
    heading: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 20,
      color: isDark ? Colors.white : Colors.black,
    },
  });
