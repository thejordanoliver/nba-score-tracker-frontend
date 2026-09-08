import { Colors } from "@/constants/styles";
import { FanPredictionStyles } from "@/styles/GameDetailStyles/FanPredictionStyles";
import { useState } from "react";
import { Animated, Image, Text, TouchableOpacity } from "react-native";

type PredictionCardProps = {
  code?: string;
  name?: string;
  logo: any;
  color: string;
  fillAnim: Animated.Value;
  onPress: () => void;
  disabled: boolean;
  isSelected: boolean;
  showPercent: boolean;
  percentText: string;
  isDark: boolean;
  style?: object;
};

export default function PredictionCard({
  code,
  name,
  logo,
  color,
  fillAnim,
  onPress,
  disabled,
  isSelected,
  showPercent,
  percentText,
  isDark,
  style,
}: PredictionCardProps) {
  const styles = FanPredictionStyles(isDark);
  const teamLabel = name || code;

  const [cardHeight, setCardHeight] = useState(0);

  const selectedTeamColor = isDark ? Colors.dark.green : Colors.light.green;

  const fillColor = isSelected ? selectedTeamColor : color;

  const animatedVoteFillHeight =
    cardHeight > 0
      ? fillAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, cardHeight],
          extrapolate: "clamp",
        })
      : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
      style={[
        styles.predictionCard,
        isSelected && styles.predictionCardSelected,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        showPercent
          ? `${teamLabel}, ${percentText} of the vote`
          : `Vote for ${teamLabel}`
      }
      accessibilityState={{
        disabled,
        selected: isSelected,
      }}
      onLayout={(event) => {
        setCardHeight(event.nativeEvent.layout.height);
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.voteFill,
          {
            backgroundColor: fillColor,
            height: animatedVoteFillHeight,
          },
        ]}
      />

      <Image
        source={typeof logo === "string" ? { uri: logo } : logo}
        style={styles.teamLogo}
        resizeMode="contain"
      />

      <Text numberOfLines={1} style={styles.teamLabel}>
        {teamLabel}
      </Text>

      {showPercent && <Text style={styles.votePercentage}>{percentText}</Text>}
    </TouchableOpacity>
  );
}
