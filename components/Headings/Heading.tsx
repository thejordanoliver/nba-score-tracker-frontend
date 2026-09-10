// components/Heading.tsx
import { Colors, Fonts } from "constants/styles";
import React from "react";
import { StyleSheet, Text, TextStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  isDark: boolean;
  style?: TextStyle | TextStyle[];
};

export default function Heading({ children, isDark, style }: Props) {
  const styles = headerStyles(isDark);
  return <Text style={(styles.heading, style)}>{children}</Text>; // ✅ merge styles
}

const headerStyles = (isDark: boolean) =>
  StyleSheet.create({
    heading: {
      borderBottomColor: isDark ? Colors.midTone : Colors.midTone,
      fontFamily: Fonts.MEDIUM,
      fontSize: 20,
      color: isDark ? Colors.dark.white : Colors.light.black,
    },
  });
