import { activeOpacity } from "@/constants/styles";
import { FanMoodStyles } from "@/styles/TeamStyles/FanMoodStyles";
import type { FanMoodData } from "@/types/fanMood";
import { Pressable, Text, View } from "react-native";
import FanMoodScore from "./FanMoodScore";
import FanMoodTrend from "./FanMoodTrend";

type FanMoodCardProps = {
  mood: FanMoodData;
  isDark: boolean;

  title?: string;
  onPress?: () => void;
};

export default function FanMoodCard({
  mood,
  isDark,
  title = "Fan Mood",
  onPress,
}: FanMoodCardProps) {
  const styles = FanMoodStyles(isDark);

  const content = (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>

        <FanMoodTrend
          direction={mood.trend.direction}
          change={mood.trend.change}
          isDark={isDark}
        />
      </View>

      <FanMoodScore score={mood.score} level={mood.level} isDark={isDark} />

      {mood.sampleSize != null && (
        <Text style={styles.sampleSize}>
          Based on {mood.sampleSize.toLocaleString()} fan
          {mood.sampleSize === 1 ? "" : "s"}
        </Text>
      )}
    </>
  );

  if (!onPress) {
    return <View style={styles.container}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && {
          opacity: activeOpacity,
        },
      ]}
    >
      {content}
    </Pressable>
  );
}
