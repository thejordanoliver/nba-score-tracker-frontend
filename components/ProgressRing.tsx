import { Colors, Fonts } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
type Props = {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  duration?: number;
};

export default function ProgressRing({
  value,
  max,
  size = 72,
  strokeWidth = 8,
  color,
  label,
  duration = 900,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = progressRingStyles(isDark);
  const progress = max > 0 ? value / max : 0;

  // Animated value (0 → progress)
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedProgress.setValue(0);

    Animated.timing(animatedProgress, {
      toValue: progress,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // SVG does not support native driver
    }).start();
  }, [animatedProgress, duration, progress]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ alignItems: "center", width: size }}>
      <Svg width={size} height={size}>
        {/* Background ring */}
        <Circle
          stroke="#e5e5e5"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />

        {/* Animated foreground ring */}
        <AnimatedCircle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Value */}
      <Text style={styles.teamValue}>{value}</Text>

      {/* Label */}
      <Text
        style={styles.teamName}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.5}
      >
        {label}
      </Text>
    </View>
  );
}

const progressRingStyles = (isDark: boolean) =>
  StyleSheet.create({
    teamValue: {
      marginTop: 6,
      fontFamily: Fonts.BOLD,
      color: isDark ? Colors.white : Colors.black,
    },
    teamName: {
      marginTop: 6,
      fontFamily: Fonts.BOLD,
      fontSize: 10,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
  });
