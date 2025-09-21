import {
  Image,
  ImageBackground,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { teams } from "../constants/teams";
import { logoMap } from "../constants/teams";

type Props = {
  years: number[];
  logo?: any;
  teamId?: string | number;
  teamName?: string;
};

export default function ChampionshipBanner({
  years,
  logo,
  teamId,
  teamName,
}: Props) {
  const isDark = useColorScheme() === "dark";

  const cleanName = teamName?.replace(/"/g, "") || "";
if (!teamId && !teamName) {
  console.warn("ChampionshipBanner: No teamId or teamName passed");
}

  const team =
    teams.find((t) => String(t.id) === String(teamId)) ||
    teams.find((t) => t.fullName === cleanName);

  if (!team) {
    console.warn(
      `ChampionshipBanner: No team found for ID "${teamId}" or name "${teamName}"`
    );
  }

  const isNone = years.length === 0;
  const isManyYears = years.length > 10;
  const banners = isNone ? [null] : isManyYears ? [years.length] : years;

  const textColor = "#fff"; // Always white text

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        justifyContent: "center",
        marginVertical: 16,
      }}
    >
      {banners.map((yearVal, index) => {
        const yearShort = isNone
          ? "NONE"
          : isManyYears
          ? `x${yearVal}`
          : `'${yearVal?.toString().slice(-2)}`;

        const bannerSource = getBannerImage(team?.id);

        return (
          <ImageBackground
            key={index}
            source={bannerSource}
            style={{
              width: 120,
              height: 165,
              alignItems: "center",
              justifyContent: "flex-start",
              paddingTop: 16,
            }}
            resizeMode="contain"
          >
            <Text
              style={{
                color: textColor,
                fontSize: 22,
                fontFamily: "Oswald_700Bold",
              }}
            >
              {yearShort}
            </Text>

            {team && (
              <Image
                source={getTeamLogoFromMap(team.name, isDark) || logo}
                style={{
                  width: 40,
                  height: 60,
                  marginTop: 4,
                  resizeMode: "contain",
                }}
              />
            )}

            <Text
              style={{
                color: textColor,
                fontSize: 12,
                fontFamily: "Oswald_700Bold",
                marginTop: 0,
              }}
            >
              NBA CHAMPIONS
            </Text>
          </ImageBackground>
        );
      })}
    </View>
  );
}
function getTeamLogoFromMap(name?: string, isDark?: boolean) {
  if (!name) return null;

  let cleanName = name.replace(/\s+/g, "");

  // Fix for 76ers team name
  if (cleanName === "76ers") cleanName = "Sixers";

  const logoKey = `${cleanName}Logo`;
  const logoLightKey = `${cleanName}LogoLight`;

  const alwaysLightTeams = ["Jazz", "Rockets", "Sixers"];
  const baseName = cleanName;

  const isAlwaysLight = alwaysLightTeams.includes(baseName);

  if (isAlwaysLight && logoMap[logoLightKey]) {
    return logoMap[logoLightKey];
  }

  if (isDark && logoMap[logoLightKey]) {
    return logoMap[logoLightKey];
  }

  return logoMap[logoKey] ?? null;
}

// Safer object map for banner images
const bannerMap: Record<string, any> = {
  "1": require("../assets/banners/HAWKS.png"),
  "2": require("../assets/banners/CELTICS.png"),
  "4": require("../assets/banners/NETS.png"),
  "5": require("../assets/banners/HORNETS.png"),
  "6": require("../assets/banners/BULLS.png"),
  "7": require("../assets/banners/CAVS.png"),
  "8": require("../assets/banners/MAVS.png"),
  "9": require("../assets/banners/NUGGETS.png"),
  "10": require("../assets/banners/PISTONS.png"),
  "11": require("../assets/banners/WARRIORS.png"),
  "14": require("../assets/banners/ROCKETS.png"),
  "15": require("../assets/banners/PACERS.png"),
  "16": require("../assets/banners/CLIPPERS.png"),
  "17": require("../assets/banners/LAKERS.png"),
  "19": require("../assets/banners/GRIZZLIES.png"),
  "20": require("../assets/banners/HEAT.png"),
  "21": require("../assets/banners/BUCKS.png"),
  "22": require("../assets/banners/TIMBERWOLVES.png"),
  "23": require("../assets/banners/PELICANS.png"),
  "24": require("../assets/banners/KNICKS.png"),
  "25": require("../assets/banners/THUNDER.png"),
  "26": require("../assets/banners/MAGIC.png"),
  "27": require("../assets/banners/76ERS.png"),
  "28": require("../assets/banners/SUNS.png"),
  "29": require("../assets/banners/TRAILBLAZERS.png"),
  "30": require("../assets/banners/KINGS.png"),
  "31": require("../assets/banners/SPURS.png"),
  "38": require("../assets/banners/RAPTORS.png"),
  "40": require("../assets/banners/JAZZ.png"),
  "41": require("../assets/banners/WIZARDS.png"),
};

const bannerLightMap: Record<string, any> = {
  "1": require("../assets/banners/HAWKSLIGHT.png"),
  "2": require("../assets/banners/CELTICSLIGHT.png"),
  "4": require("../assets/banners/NETSLIGHT.png"),
  "5": require("../assets/banners/HORNETSLIGHT.png"),
  "6": require("../assets/banners/BULLSLIGHT.png"),
  "7": require("../assets/banners/CAVSLIGHT.png"),
  "8": require("../assets/banners/MAVSLIGHT.png"),
  "9": require("../assets/banners/NUGGETSLIGHT.png"),
  "10": require("../assets/banners/PISTONSLIGHT.png"),
  "11": require("../assets/banners/WARRIORSLIGHT.png"),
  "14": require("../assets/banners/ROCKETSLIGHT.png"),
  "15": require("../assets/banners/PACERSLIGHT.png"),
  "16": require("../assets/banners/CLIPPERSLIGHT.png"),
  "17": require("../assets/banners/LAKERSLIGHT.png"),
  "19": require("../assets/banners/GRIZZLIESLIGHT.png"),
  "20": require("../assets/banners/HEATLIGHT.png"),
  "21": require("../assets/banners/BUCKSLIGHT.png"),
  "22": require("../assets/banners/TIMBERWOLVESLIGHT.png"),
  "23": require("../assets/banners/PELICANSLIGHT.png"),
  "24": require("../assets/banners/KNICKSLIGHT.png"),
  "25": require("../assets/banners/THUNDERLIGHT.png"),
  "26": require("../assets/banners/MAGICLIGHT.png"),
  "27": require("../assets/banners/76ERSLIGHT.png"),
  "28": require("../assets/banners/SUNSLIGHT.png"),
  "29": require("../assets/banners/TRAILBLAZERSLIGHT.png"),
  "30": require("../assets/banners/KINGSLIGHT.png"),
  "31": require("../assets/banners/SPURSLIGHT.png"),
  "38": require("../assets/banners/RAPTORSLIGHT.png"),
  "40": require("../assets/banners/JAZZLIGHT.png"),
  "41": require("../assets/banners/WIZARDSLIGHT.png"),
};


function getBannerImage(teamId?: string | number, isDark?: boolean) {
  const fallback = require("../assets/banners/DEFAULT.png");

  if (!teamId) return fallback;

  const id = String(teamId);

  if (isDark && bannerLightMap[id]) {
    return bannerLightMap[id];
  }

  if (bannerMap[id]) {
    return bannerMap[id];
  }

  console.warn("Banner not found for team ID:", id);
  return fallback;
}

