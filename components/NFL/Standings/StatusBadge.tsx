import { getStyles } from "styles/Standings.styles";
import { Text, View, useColorScheme } from "react-native";

// Simplified NFL-managed league status codes
type StatusCode = "x" | "o" | "c" | "d" | "pi";

// Map each status code to its color
const statusCodeToColor: Record<StatusCode, string> = {
  x: "#4caf50", // Clinched Playoff Berth - Green
  o: "#f44336", // Eliminated - Red
  c: "#2196f3", // Clinched Conference - Blue
  d: "#ff9800", // Clinched Division - Orange
  pi: "#ffc107", // Clinched Play-In - Amber
};

// Optional: map code to a friendly label
const statusCodeToLabel: Record<StatusCode, string> = {
  x: "X",
  o: "E",
  c: "C",
  d: "D",
  pi: "WC",
};

interface StatusBadgeProps {
  code?: string | null; // could be a numeric seed or a special code
  clinchedConference?: boolean; // explicitly mark if the team clinched conference
  
}

export const StatusBadge = ({
  code,
  clinchedConference = false,
}: StatusBadgeProps) => {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  if (!code && !clinchedConference) return null;

  

  // Use "c" for clinched conference if applicable
  const displayCode: StatusCode | string = clinchedConference
    ? "c"
    : ["x", "o", "c", "d", "pi"].includes(code || "")
    ? (code as StatusCode)
    : code!;

  // Determine background color
  const backgroundColor =
    (["x", "o", "c", "d", "pi"].includes(displayCode)
      ? statusCodeToColor[displayCode as StatusCode]
      : "#4caf50") || // green for playoff seeds
    (isDark ? "#555" : "#ccc");

  // Determine label text
  const label =
    displayCode in statusCodeToLabel ? statusCodeToLabel[displayCode as StatusCode] : displayCode;

  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor, minWidth: 28, paddingHorizontal: 6 },
      ]}
    >
      <Text
        style={[
          styles.statusBadgeText,
          { fontSize: 12, textAlign: "center", paddingVertical: 2 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};
