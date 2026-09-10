import { Colors, Fonts } from "constants/styles";
import type { ReactNode } from "react";
import { StyleSheet, Text, TextStyle } from "react-native";

type Props = {
  children: ReactNode;
  isDark: boolean;
  style?: TextStyle | TextStyle[];
};

export default function HeadingTwo({ children, isDark, style }: Props) {
  const styles = headerStyles(isDark);

  return <Text style={[styles.heading, style]}>{children}</Text>;
}

const headerStyles = (isDark: boolean) =>
  StyleSheet.create({
    heading: {
      marginBottom: 12,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: Colors.midTone,
      fontFamily: Fonts.MEDIUM,
      fontSize: 20,
      color: isDark ? Colors.dark.white : Colors.light.black,
    },
  });
