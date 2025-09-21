import React from "react";
import { Pressable, Text, StyleSheet, useColorScheme } from "react-native";

type SaveButtonProps = {
  onPress: () => void;
  disabled?: boolean;
    title?: string;
loading?: boolean;
};

export default function Button({ onPress, disabled, title = "Save" }: SaveButtonProps) {
  const isDark = useColorScheme() === "dark";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.saveButton,
        {
          backgroundColor: isDark ? "#fff" : "#000",
          opacity: pressed || disabled ? 0.7 : 1,
        },
      ]}
    >
       <Text style={[styles.saveButtonText, { color: isDark ? "#000" : "#fff" }]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  saveButton: {
    marginVertical: 24,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "Oswald_500Medium",
  },
});
