// components/Subheading.tsx
import React from "react";
import { Text, StyleSheet, useColorScheme } from "react-native";



const OSEXTRALIGHT = "Oswald_200ExtraLight";
const OSLIGHT = "Oswald_300Light";
const OSREGULAR = "Oswald_400Regular";
const OSMEDIUM = "Oswald_500Medium";
const OSBOLD = "Oswald_700Bold";
const OSSEMIBOLD = "Oswald_600SemiBold";

type Props = {
  children: React.ReactNode;
};

const Subheading: React.FC<Props> = ({ children }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return <Text style={[styles.heading, { color: isDark ? "#fff" : "#1d1d1d", borderBottomColor: isDark ? "#444" : "#ccc" }]}>{children}</Text>;
};

const styles = StyleSheet.create({
  heading: {
    fontSize: 16,
    fontFamily:OSREGULAR,
    marginBottom: 8,
    paddingBottom: 4,
  
  },
});

export default Subheading;
