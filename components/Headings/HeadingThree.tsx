// components/Heading.tsx
import React from "react";
import { StyleSheet, Text, useColorScheme } from "react-native";
import { Fonts } from "constants/fonts";
type Props = {
  children: React.ReactNode;
};

const HeadingThree: React.FC<Props> = ({ children }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Text
      style={[
        styles.heading,
        {
          color: isDark ? "rgba(255, 255, 255, 1)" : "rgba(29, 29, 29, 1)",
          borderBottomColor: isDark ? "rgba(255, 255, 255, .5)" : "rgba(29, 29, 29, .5)",
        },
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontFamily: Fonts.OSMEDIUM,
    paddingBottom: 4,
    marginBottom: 12,
  },
});

export default HeadingThree;
