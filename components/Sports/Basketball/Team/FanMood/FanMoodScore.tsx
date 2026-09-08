import { Text, View } from "react-native";

import { FanMoodStyles } from "@/styles/TeamStyles/FanMoodStyles";
import type { FanMoodLevel } from "@/types/fanMood";

type FanMoodScoreProps = {
  score: number;
  level: FanMoodLevel;
  isDark: boolean;
};

function formatMoodLevel(level: FanMoodLevel) {
  switch (level) {
    case "furious":
      return "Furious";

    case "frustrated":
      return "Frustrated";

    case "mixed":
      return "Mixed";

    case "optimistic":
      return "Optimistic";

    case "ecstatic":
      return "Ecstatic";
  }
}

export default function FanMoodScore({
  score,
  level,
  isDark,
}: FanMoodScoreProps) {
  const styles = FanMoodStyles(isDark);
  return (
    <View>
      <Text style={styles.score}>{score}</Text>

      <Text style={styles.levelText}>{formatMoodLevel(level)}</Text>
    </View>
  );
}
