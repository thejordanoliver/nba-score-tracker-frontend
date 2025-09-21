// components/GameDetails/LiveClock.tsx
import React from "react";
import { Text, StyleSheet } from "react-native";

type Props = {
  clock: string;
  colors: any;
};

export const LiveClock = ({ clock, colors }: Props) => {
  if (!clock) return null;

  return (
    <Text style={[styles.liveClock, { color: colors.live }]}>
      {`Live: ${clock}`}
    </Text>
  );
};

const styles = StyleSheet.create({
  liveClock: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
});
