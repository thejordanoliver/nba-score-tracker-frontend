import { Fonts } from "constants/fonts";
import { teams } from "constants/teams";
import { Image, Text, View } from "react-native";

type TeamInfoProps = {
  team?: (typeof teams)[number];
  teamName: string;
  scoreOrRecord: string | number;
  isWinner: boolean;
  isDark: boolean;
  isGameOver: boolean; // ✅ new prop
  isScheduled?: boolean; // 👈 add this
  record?: string;
};

export default function TeamInfo({
  team,
  teamName,
  scoreOrRecord,
  isWinner,
  isDark,
  isGameOver,
  isScheduled,
  record,
}: TeamInfoProps) {
  // Opacity logic
  const scoreOpacity =
    isScheduled // scheduled games → always full opacity
      ? 1
      : !isGameOver // in-progress games → full opacity
        ? 1
        : isWinner // game over → winner stays full
          ? 1
          : 0.5; // game over → loser gets 0.5 opacity

  return (
    <View style={{ alignItems: "center" }}>
      <Image
        source={team?.logoLight || team?.logo}
        style={{ width: 80, height: 80, resizeMode: "contain" }}
      />
      <Text
        style={{
          fontSize: 14,
          fontFamily: Fonts.OSREGULAR,
          color: "#fff",
          marginTop: 6,
        }}
      >
        {teamName}
      </Text>

      <Text
        style={{
          fontSize: 30,
          fontFamily: Fonts.OSBOLD,
          color: "#fff",
          opacity: scoreOpacity,
        }}
      >
        {scoreOrRecord}
      </Text>
    </View>
  );
}
