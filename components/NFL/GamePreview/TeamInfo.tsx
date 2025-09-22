import NFLLogo from "assets/Football/NFL_Logos/NFL.png";
import { Fonts } from "constants/fonts";
import { teams } from "constants/teamsNFL";
import { Image, ImageSourcePropType, Text, View } from "react-native";
import Football from "assets/icons8/Football.png";
import FootballLight from "assets/icons8/FootballLight.png";

type TeamInfoProps = {
  team?: (typeof teams)[number];
  teamName: string;
  score?: number;
  record?: string;
  isWinner: boolean;
  isDark: boolean;
  isGameOver: boolean;
  hasStarted: boolean;
  possessionTeamId?: string; // ✅ new
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
}: TeamInfoProps) {
  // Score opacity logic
  const scoreOpacity = !isGameOver ? 1 : isWinner ? 1 : 0.5;

  // Team logo (fallback to NFL logo)
  const logo: ImageSourcePropType =
    (isDark && team?.logoLight ? team.logoLight : team?.logo) || NFLLogo;

  // Decide what to display
  const displayValue = !hasStarted ? (record ?? "-") : (score ?? "-");

  // ✅ Possession logic
  const hasPossession =
    hasStarted && String(possessionTeamId) === String(team?.id);

  return (
    <View style={{ alignItems: "center", position: "relative" }}>
      <Image
        source={logo}
        style={{ width: 80, height: 80, resizeMode: "contain" }}
      />

      {/* ✅ Possession football overlay */}
      {hasPossession && (
        <Image
          source={isDark ? FootballLight : Football}
          style={{
            width: 28,
            height: 45,
            resizeMode: "contain",
            position: "absolute",
            top: "50%",
            alignSelf: "center",
          }}
        />
      )}

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
          opacity: hasStarted ? scoreOpacity : 1,
        }}
      >
        {displayValue}
      </Text>
    </View>
  );
}
