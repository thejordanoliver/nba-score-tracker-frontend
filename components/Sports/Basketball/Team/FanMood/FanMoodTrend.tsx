import { Colors } from "@/constants/styles";
import { FanMoodStyles } from "@/styles/TeamStyles/FanMoodStyles";
import type { FanMoodTrendDirection } from "@/types/fanMood";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

type FanMoodTrendProps = {
  direction: FanMoodTrendDirection;
  change: number;
  isDark: boolean;
};

function getTrendIcon(direction: FanMoodTrendDirection) {
  switch (direction) {
    case "up":
      return "arrow-up";

    case "down":
      return "arrow-down";

    case "neutral":
      return "remove";
  }
}

export default function FanMoodTrend({
  direction,
  change,
  isDark,
}: FanMoodTrendProps) {
  const styles = FanMoodStyles(isDark);

  return (
    <View style={styles.fanMoodTrendContainer}>
      <Ionicons
        name={getTrendIcon(direction)}
        size={14}
        color={isDark ? Colors.lightGray : Colors.darkGray}
      />
      <Text style={styles.changeText}>{Math.abs(change)}</Text>
    </View>
  );
}
