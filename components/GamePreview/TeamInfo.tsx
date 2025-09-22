import { Fonts } from "constants/fonts";
import { teams } from "constants/teams";
import { Image, Text, View } from "react-native";

type TeamInfoProps = {
  team?: (typeof teams)[number];
  teamName: string;
  scoreOrRecord: string | number;
  isWinner: boolean;
  isDark: boolean;
  isGameOver: boolean;
  isScheduled?: boolean;
  record?: string;
  hasPossession?: boolean; // 👈 new
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
  hasPossession,
}: TeamInfoProps) {
  const scoreOpacity =
    isScheduled ? 1 : !isGameOver ? 1 : isWinner ? 1 : 0.5;

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ position: "relative" }}>
        <Image
          source={team?.logoLight || team?.logo}
          style={{ width: 80, height: 80, resizeMode: "contain" }}
        />
        {hasPossession && (
          <View
            style={{
              position: "absolute",
              bottom: -6,
              alignSelf: "center",
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: isDark ? "#FFD700" : "#000",
            }}
          />
        )}
      </View>

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
