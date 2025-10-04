import { getStyles } from "styles/Standings.styles";
import { Text, View, useColorScheme } from "react-native";
import HeadingTwo from "../../Headings/HeadingTwo";
import { StatusBadge } from "./StatusBadge";

/**
 * Updated status codes based on NFL-managed leagues and playoff logic:
 * - 'x' : Clinched Playoff Berth
 * - 'o' : Eliminated from Playoffs contention
 * - 'c' : Clinched Conference
 * - 'd' : Clinched Division
 * - 'pi': Clinched Play-In
 */
export const statusCodeToLabel: Record<string, string> = {
  x: "Clinched Playoff Berth",
  o: "Eliminated from Playoffs contention",
  c: "Clinched Conference",
  d: "Clinched Division",
  pi: "Clinched Wild Card",
};

// Map status codes to colors for badges
export const statusCodeToColor: Record<string, string> = {
  x: "#4caf50", // Green
  o: "#f44336", // Red
  c: "#2196f3", // Blue
  d: "#ff9800", // Orange
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
