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

  // Render timeout dots
  const renderTimeoutDots = () => {
    const totalTimeouts = 3;
    const dots = [];
    for (let i = 0; i < totalTimeouts; i++) {
      dots.push(
        <View
          key={i}
          style={{
            width: 10,
            height: 4,
            borderRadius: 5,
            marginHorizontal: 2,
            backgroundColor: i < timeouts ? "#fff" : "rgba(255,255,255,0.3)",
          }}
        />
      );
    }
    return <View style={{ flexDirection: "row", marginTop: 4 }}>{dots}</View>;
  };

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

        {/* Timeout dots */}
        {renderTimeoutDots()}
      </View>
    </View>
  );
}
