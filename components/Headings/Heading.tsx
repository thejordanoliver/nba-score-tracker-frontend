// components/Heading.tsx
import React from "react";
import { Text, StyleSheet, useColorScheme } from "react-native";

type Props = {
  children: React.ReactNode;
};

const Heading: React.FC<Props> = ({ children }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return <Text style={[styles.heading, { color: isDark ? "#fff" : "#1d1d1d", borderBottomColor: isDark ? "#444" : "#ccc" }]}>{children}</Text>;
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    fontFamily: "Oswald_500Medium",
    marginTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    marginHorizontal: 12,
  },
});

export default Heading;
