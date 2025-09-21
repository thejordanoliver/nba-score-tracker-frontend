import { getStyles } from "styles/Standings.styles";
import { Text, View, useColorScheme } from "react-native";

const statusCodeToColor: Record<StatusCode, string> = {
  x: "#4caf50",
  o: "#f44336",
  e: "#2196f3",
  w: "#2196f3",
  nw: "#ff9800",
  p: "#ff9800",
  sw: "#ff9800",
  a: "#9c27b0",
  ps: "#4caf50",
  c: "#9c27b0",
  se: "#9c27b0",
  pi: "#ffc107",
};

type StatusCode =
  | "x"
  | "o"
  | "e"
  | "w"
  | "nw"
  | "p"
  | "sw"
  | "a"
  | "ps"
  | "c"
  | "se"
  | "pi";

export const StatusBadge = ({ code }: { code?: string | null }) => {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  if (!code || !(code in statusCodeToColor)) return null;

  const backgroundColor = statusCodeToColor[code as StatusCode];

  return (
    <View style={[styles.statusBadge, { backgroundColor }]}>
      <Text style={styles.statusBadgeText}>{code.toUpperCase()}</Text>
    </View>
  );
};
