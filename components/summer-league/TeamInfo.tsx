import { Text, View, ImageSourcePropType } from "react-native";
import { Image } from 'expo-image';


const OSEXTRALIGHT = "Oswald_200ExtraLight";
const OSLIGHT = "Oswald_300Light";
const OSMEDIUM = "Oswald_500Medium";
const OSREGULAR = "Oswald_400Regular";
const OSBOLD = "Oswald_700Bold";

type SummerTeam = {
  id: string | number;
  name: string;
  record?: string;
  logo?: ImageSourcePropType; // better typing for images
  fullName?: string;
};

type TeamInfoProps = {
  team?: SummerTeam;
  teamName: string;
  scoreOrRecord: string | number | null | undefined; // allow nullable to handle no data
  isWinner: boolean;
  isDark: boolean;
};

export default function TeamInfo({
  team,
  teamName,
  scoreOrRecord,
  isWinner,
  isDark,
}: TeamInfoProps) {
  const winnerStyle = isWinner
    ? {
        color: isDark ? "#fff" : "#000",
      }
    : {};

  return (
    <View style={{ alignItems: "center" }}>
      {team?.logo && (
        <Image
          source={team.logo}
          style={{ width: 80, height: 80, resizeMode: "contain" }}
        />
      )}
      <Text
        style={[
          {
            fontSize: 14,
            fontFamily: OSREGULAR,
            color: isDark ? "#aaa" : "rgba(0, 0, 0, 0.4)",
            marginTop: 6,
          },
          winnerStyle,
        ]}
      >
        {teamName}
      </Text>
      <Text
        style={[
          {
   fontSize: 30,            fontFamily: OSBOLD,
            color: isDark ? "#aaa" : "rgba(0, 0, 0, 0.4)",
          },
          winnerStyle,
        ]}
      >
        {/* Display scoreOrRecord or fallback to "-" */}
        {scoreOrRecord !== null && scoreOrRecord !== undefined
          ? scoreOrRecord
          : "-"}
      </Text>
    </View>
  );
}
