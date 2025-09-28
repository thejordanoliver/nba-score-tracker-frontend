// components/Headings/HeadingTwo.tsx
import { Fonts } from "constants/fonts";
import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  useColorScheme,
} from "react-native";

type Props = {
  children: React.ReactNode;
  lighter?: boolean; // new prop to force lighter colors
  style?: StyleProp<TextStyle>; // allow custom styles
};

const HeadingTwo: React.FC<Props> = ({ children, lighter, style }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const textColor = lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d";
  const borderColor = lighter ? "#bbb" : isDark ? "#888" : "#888";

  return (
    <Text
      style={[
        styles.heading,
        { color: textColor, borderBottomColor: borderColor },
        style, // merge custom styles last
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
    borderBottomWidth: 1,
  },
});

export default HeadingTwo;
