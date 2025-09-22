import NFLLogo from "assets/Football/NFL_Logos/NFL.png";
import Football from "assets/icons8/Football.png";
import FootballLight from "assets/icons8/FootballLight.png";
import { Fonts } from "constants/fonts";
import { teams } from "constants/teamsNFL";
import { Image, ImageSourcePropType, Text, View } from "react-native";

type TeamInfoProps = {
  team?: (typeof teams)[number];
  teamName: string;
  score?: number;
  record?: string;
  isWinner: boolean;
  isDark: boolean;
  isGameOver: boolean;
  hasStarted: boolean;
  possessionTeamId?: string;
  side?: "home" | "away";
  timeouts: number; // number of remaining timeouts (0-3)
};

export default function TeamInfo({
  team,
  teamName,
  score,
  record,
  isWinner,
  isDark,
  isGameOver,
  hasStarted,
  possessionTeamId,
  side = "home",
  timeouts
}: TeamInfoProps) {
  const scoreOpacity = !isGameOver ? 1 : isWinner ? 1 : 0.5;

  const logo: ImageSourcePropType =
    (isDark && team?.logoLight ? team.logoLight : team?.logo) || NFLLogo;

  const displayValue = !hasStarted ? record ?? "-" : score ?? "-";

  const hasPossession =
    hasStarted && String(possessionTeamId) === String(team?.id);

  return (
    <View style={{ alignItems: "center", position: "relative" }}>
      <Image
        source={logo}
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

      <View
        style={{
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row" }}>
          {side === "home" && hasPossession && (
            <Image
              source={isDark ? FootballLight : Football}
              style={{
                position: "absolute",
                right: 20,
                bottom: "10%",
                width: 36,
                height: 36,
                resizeMode: "contain",
              }}
            />
          )}

          <Text
            style={{
              fontSize: 40,
              fontFamily: Fonts.OSBOLD,
              color: "#fff",
              opacity: hasStarted ? scoreOpacity : 1,
            }}
          >
            {displayValue}
          </Text>

          {side === "away" && hasPossession && (
            <Image
              source={isDark ? FootballLight : Football}
              style={{
                position: "absolute",
                left: 20,
                bottom: "10%",
                width: 36,
                height: 36,
                resizeMode: "contain",
              }}
            />
          )}
        </View>

        {/* Only show record when game is final */}
        {isGameOver && record && (
          <Text
            style={{
              fontSize: 14,
              fontFamily: Fonts.OSREGULAR,
              color: "#fff",
              marginTop: 4,
            }}
          >
            {record}
          </Text>
        )}
      </View>
    </View>
  );
}
