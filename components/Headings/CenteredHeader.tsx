// components/Heading.tsx
import React from "react";
import { StyleSheet, Text, useColorScheme } from "react-native";

type Props = {
  children: React.ReactNode;
};

const CenteredHeader: React.FC<Props> = ({ children }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Text
      style={[
        styles.heading,
        {
          color: isDark ? "#fff" : "#1d1d1d",
          borderBottomColor: isDark ? "#888" : "#888",
        },
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    fontFamily: "Oswald_500Medium",
    textAlign: "center",
    paddingBottom: 4,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
});

export default CenteredHeader;
