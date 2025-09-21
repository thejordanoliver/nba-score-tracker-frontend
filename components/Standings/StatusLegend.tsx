import { getStyles } from "styles/Standings.styles";
import { Text, View, useColorScheme } from "react-native";
import HeadingTwo from "../Headings/HeadingTwo";
import { StatusBadge } from "./StatusBadge";

export const statusCodeToLabel: Record<string, string> = {
  x: "Clinched Playoff Berth",
  o: "Eliminated from Playoffs contention",
  e: "Clinched Eastern Conference",
  w: "Clinched Western Conference",
  nw: "Clinched Northwest Division",
  p: "Clinched Pacific Division",
  sw: "Clinched Southwest Division",
  a: "Clinched Atlantic Division",
  ps: "Clinched Postseason",
  c: "Clinched Central Division",
  se: "Clinched Southeast Division",
  pi: "Clinched Play-In",
};

// Map status codes to colors for badges
export const statusCodeToColor: Record<string, string> = {
  x: "#4caf50", // Green
  o: "#f44336", // Red
  e: "#2196f3", // Blue
  w: "#2196f3",
  nw: "#ff9800", // Orange
  p: "#ff9800",
  sw: "#ff9800",
  a: "#9c27b0", // Purple
  ps: "#4caf50",
  c: "#9c27b0",
  se: "#9c27b0",
  pi: "#ffc107", // Amber
};

export const StatusLegend = () => {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  return (
    <View style={styles.legendContainer}>
      <HeadingTwo>Status Legend</HeadingTwo>
      <View style={styles.legendItemsContainer}>
        {Object.entries(statusCodeToLabel).map(([code, label]) => (
          <View key={code} style={styles.legendItem}>
            <StatusBadge code={code} />
            <Text style={[styles.legendLabel, { marginLeft: 6 }]}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
