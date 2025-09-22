// components/NFL/NFLGameLeaders.tsx
import NFLLogo from "assets/Football/NFL_Logos/NFL.png";
import HeadingTwo from "components/Headings/HeadingTwo";
import { Fonts } from "constants/fonts";
import { getNFLTeamsLogo, getTeamAbbreviation } from "constants/teamsNFL";
import {
  NFLPlayer,
  useNFLGameLeaders,
} from "hooks/NFLHooks/useNFLGameLeaders";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import FixedWidthTabBar from "../FixedWidthTabBar";
const CATEGORIES = ["Passing", "Rushing", "Defensive"] as const;
type Category = (typeof CATEGORIES)[number];

type Props = {
  gameId: string;
  homeTeamId: string;
  awayTeamId: string;
  lighter?: boolean;
};

type PlayerStat = { name: string; value: string | number | null };
type DisplayPlayer = {
  id: number;
  name: string;
  image: string;
  teamId: string;
  teamAbbr: string;
  group: Category;
  statistics: PlayerStat[];
};

// Normalize raw NFLPlayer to DisplayPlayer
const normalizePlayers = (
  players: NFLPlayer[] | undefined,
  teamIdProp: string
): DisplayPlayer[] =>
  (players ?? []).map((p) => {
    const teamAbbr = getTeamAbbreviation(teamIdProp) || "UNK"; // fallback unknown
    return {
      id: Number(p.id),
      name: p.name,
      image: (p as any).image ?? "",
      teamId: teamIdProp,
      teamAbbr,
      group: p.group as Category,
      statistics:
        p.stats?.map((s) => ({
          name: s.name,
          value: s.value,
        })) ?? [],
    };
  });

export default function NFLGameLeaders({
  gameId,
  homeTeamId,
  awayTeamId,
  lighter,
}: Props) {
  const {
    players: homePlayers,
    isLoading: loadingHome,
    isError: errorHome,
  } = useNFLGameLeaders(gameId, homeTeamId);
  const {
    players: awayPlayers,
    isLoading: loadingAway,
    isError: errorAway,
  } = useNFLGameLeaders(gameId, awayTeamId);

  const isDark = useColorScheme() === "dark";
  const [selectedCategory, setSelectedCategory] = useState<Category>("Passing");

  const styles = getStyles(isDark);
  const textColor = lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d";
  const subTextColor = lighter ? "#ccc" : isDark ? "#888" : "#555";
  const borderColor = lighter ? "#aaa" : isDark ? "#888" : "#ccc";

  const homeDisplay = useMemo(
    () => normalizePlayers(homePlayers, homeTeamId),
    [homePlayers, homeTeamId]
  );
  const awayDisplay = useMemo(
    () => normalizePlayers(awayPlayers, awayTeamId),
    [awayPlayers, awayTeamId]
  );

  const topLeaders = useMemo(
    () =>
      CATEGORIES.reduce(
        (acc, category) => {
          acc[category] = {
            home: homeDisplay.find((p) => p.group === category) || null,
            away: awayDisplay.find((p) => p.group === category) || null,
          };
          return acc;
        },
        {} as Record<
          Category,
          { home: DisplayPlayer | null; away: DisplayPlayer | null }
        >
      ),
    [homeDisplay, awayDisplay]
  );

  if (loadingHome || loadingAway) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (errorHome || errorAway) {
    return (
      <View style={styles.center}>
        <Text style={[styles.error, { color: textColor }]}>
          Failed to load game leaders
        </Text>
      </View>
    );
  }

  const hasAnyLeaders = homeDisplay.length > 0 || awayDisplay.length > 0;
  if (!hasAnyLeaders) return null;

  const { home, away } = topLeaders[selectedCategory];

  return (
    <View style={styles.container}>
      <HeadingTwo lighter={lighter}>Game Leaders</HeadingTwo>

      <View style={{ marginBottom: 12 }}>
        <FixedWidthTabBar
          tabs={CATEGORIES}
          lighter={lighter}
          selected={selectedCategory}
          onTabPress={(tab) => setSelectedCategory(tab as Category)}
          renderLabel={(tab, isSelected) => (
            <Text
              style={{
                fontFamily: Fonts.OSMEDIUM,
                fontSize: 14,
                color: isSelected ? textColor : subTextColor,
              }}
            >
              {tab}
            </Text>
          )}
        />
      </View>

      {[away, home].map((p, idx) => {
        if (!p) return null;

        // Get the team logo URL
        const teamLogoUri = getNFLTeamsLogo(p.teamAbbr, isDark);
        // console.log("Rendering player:", p.name, "from team:", p.teamAbbr);
        return (
          <View
            key={p.id + idx}
            style={[
              styles.card,
              { borderBottomWidth: 1, borderBottomColor: borderColor },
            ]}
          >
            {/* Player Image */}
            <Image
              source={p.image ? { uri: p.image } : NFLLogo}
              style={[styles.avatar, { backgroundColor: borderColor }]}
            />

            {/* Player Info */}
            <View style={styles.infoSection}>
              <Text style={[styles.playerName, { color: textColor }]}>
                {p.name}
              </Text>

              <View style={styles.statRow}>
                {p.statistics
                  .filter((stat) => {
                    const name = stat.name.toLowerCase();
                    if (selectedCategory === "Passing") {
                      return [
                        "comp att",
                        "yards",
                        "passing touch downs",
                        "interceptions",
                      ].includes(name);
                    }
                    if (selectedCategory === "Rushing") {
                      return [
                        "total rushes",
                        "yards",
                        "average",
                        "rushing touch downs",
                      ].includes(name);
                    }
                    if (selectedCategory === "Defensive") {
                      return [
                        "interceptions",
                        "sacks",
                        "tackles",
                        "tfl",
                        "ff",
                      ].includes(name);
                    }
                    return true;
                  })
                  .map((stat, idx2) => {
                    let label = stat.name;

                    if (selectedCategory === "Passing") {
                      const name = stat.name.toLowerCase();
                      if (name === "comp att") label = "COMP/ATT";
                      else if (name === "yards") label = "YARDS";
                      else if (name === "passing touch downs") label = "TDS";
                      else if (name === "interceptions") label = "INTS";
                    } else if (selectedCategory === "Rushing") {
                      const name = stat.name.toLowerCase();
                      if (name === "total rushes") label = "ATT";
                      else if (name === "yards") label = "YARDS";
                      else if (name === "average") label = "AVG";
                      else if (name === "rushing touch downs") label = "TDS";
                    } else if (selectedCategory === "Defensive") {
                      const name = stat.name.toLowerCase();
                      if (name === "tackles") label = "TKS";
                      else if (name === "sacks") label = "SACKS";
                      else if (name === "tfl") label = "TFL";
                      else if (name === "ff") label = "FF";
                    }

                    return (
                      <View style={styles.statBlock} key={idx2}>
                        <Text
                          style={[styles.statLabel, { color: subTextColor }]}
                        >
                          {label.toUpperCase()}
                        </Text>
                        <Text style={[styles.statText, { color: textColor }]}>
                          {stat.value ?? "-"}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            </View>

            {/* Team Logo */}
            <Image
              source={teamLogoUri || NFLLogo} // no { uri: ... } for local images
              style={styles.teamLogo}
              resizeMode="contain"
            />
          </View>
        );
      })}
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: { marginTop: 12, overflow: "hidden" },
    center: { alignItems: "center", justifyContent: "center", padding: 16 },
    error: { fontFamily: Fonts.OSREGULAR },
    card: { flexDirection: "row", alignItems: "center", padding: 12 },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
     
    },
    infoSection: { flex: 1, marginLeft: 10, justifyContent: "flex-end" },
    playerName: { fontFamily: Fonts.OSBOLD, fontSize: 14 },
    statRow: {
      flexDirection: "row",
      marginTop: 4,
      justifyContent: "space-between",
      paddingRight: 12,
    },
    statBlock: { alignItems: "flex-start", flex: 1 },
    statLabel: { fontFamily: Fonts.OSMEDIUM, fontSize: 10 },
    statText: { fontFamily: Fonts.OSREGULAR, fontSize: 14 },
    teamLogo: { position: "absolute", top: 6, right: 6, width: 28, height: 28 },
  });
