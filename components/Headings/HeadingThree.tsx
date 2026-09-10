// components/Heading.tsx
import { Colors, Fonts } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import type { ReactNode } from "react";
import { StyleSheet, Text } from "react-native";
type Props = {
  children: ReactNode;
};

export default function HeadingThree({ children }: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = headingStyles(isDark);
  return <Text style={styles.heading}>{children}</Text>;
}

const headingStyles = (isDark: boolean) =>
  StyleSheet.create({
    heading: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 20,
      color: isDark ? Colors.white : Colors.black,
    },
  });
