// components/Heading.tsx
import { Fonts } from "constants/fonts";
import React from "react";
import { StyleSheet, Text, useColorScheme } from "react-native";
type Props = {
  children: React.ReactNode;
  lighter?: boolean; // new prop to force lighter colors
};

const HeadingTwo: React.FC<Props> = ({ children, lighter }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const textColor = lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d";
  const borderColor = lighter ? "#bbb" : isDark ? "#888" : "#888";

  return (
    <Text
      style={[
        styles.heading,
        { color: textColor, borderBottomColor: borderColor },
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    fontFamily: Fonts.OSMEDIUM,
    paddingBottom: 4,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
});

export default HeadingTwo;
