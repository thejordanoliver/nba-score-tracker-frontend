// ---- LastFiveGamesSwitcher.tsx ----
import FixedWidthTabBar from "components/FixedWidthTabBar";
import HeadingTwo from "components/Headings/HeadingTwo";
import { Fonts } from "constants/fonts";
import { useState } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { teams } from "../../constants/teams";

type Props = {
  isDark: boolean;
  lighter?: boolean; // <-- new prop
  home: {
    teamCode: string;
    teamLogoLight: any;
    teamLogo: any;
    games: any[];
  };
  away: {
    teamCode: string;
    teamLogoLight: any;
    teamLogo: any;
    games: any[];
  };
};

function getOpponentCodeFromName(opponentName: string): string | undefined {
  const team = teams.find(
    (t) =>
      t.name === opponentName ||
      t.code === opponentName ||
      t.fullName === opponentName
  );
  return team?.code;
}

export default function LastFiveGamesSwitcher({
  isDark,
  lighter,
  home,
  away,
}: Props) {
  const [selected, setSelected] = useState<"home" | "away">("home");
  const team = selected === "home" ? home : away;
  const styles = getStyles(isDark);

  const teamsUsingLogoLightInDark = new Set(["PHI", "TOR", "HOU", "UTA"]);

  const renderRow = ({ item, index }: { item: any; index: number }) => {
    const matchupSymbol = item.isHome ? "vs" : "@";
    const resultSymbol = item.won ? "W" : "L";
    const resultColor = lighter
      ? item.won
        ? "#71ff76ff"
        : "#ff6363ff"
      : item.won
      ? "#4caf50"
      : "#f44336";

    const opponentCode =
      item.opponentCode || getOpponentCodeFromName(item.opponent);

    const opponentLogoSource =
      lighter || (isDark && teamsUsingLogoLightInDark.has(opponentCode))
        ? item.opponentLogoLight || item.opponentLogo
        : item.opponentLogo;

    const textColor = lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d";

    return (
      <View
        style={[
          styles.row,
          {
            borderBottomColor: "#aaa",
            borderBottomWidth: index === team.games.length - 1 ? 0 : 1,
          },
        ]}
      >
        <Text style={[styles.cell, styles.date, { color: textColor }]}>
          {item.date}
        </Text>

        <View style={[styles.cell, styles.team, styles.teamWithLogo]}>
          <Text style={{ fontFamily: Fonts.OSREGULAR, color: textColor }}>
            {matchupSymbol} {item.opponent}
          </Text>
          <Image
            source={opponentLogoSource}
            style={{
              width: 18,
              height: 18,
              resizeMode: "contain",
              marginRight: 6,
              marginTop: 1,
            }}
          />
        </View>

        <Text style={[styles.cell, { color: resultColor }]}>
          {resultSymbol} {item.isHome ? item.homeScore : item.awayScore} -{" "}
          {item.isHome ? item.awayScore : item.homeScore}
        </Text>
      </View>
    );
  };

  const tabs: readonly ("away" | "home")[] = ["away", "home"];

  return (
    <View style={styles.container}>
      <HeadingTwo lighter={lighter}>Last Five Games</HeadingTwo>
      <View style={{ alignSelf: "center" }}>
        <FixedWidthTabBar
          tabs={tabs}
          lighter={lighter}
          selected={selected}
          onTabPress={setSelected}
          renderLabel={(tab, isSelected) => {
            const teamData = tab === "home" ? home : away;
            const useLogoLight =
              lighter ||
              (isDark && teamsUsingLogoLightInDark.has(teamData.teamCode));
            const logoSource = useLogoLight
              ? teamData.teamLogoLight || teamData.teamLogo
              : teamData.teamLogo;

            const textColor = lighter
              ? "#fff"
              : isSelected
              ? isDark
                ? "#fff"
                : "#1d1d1d"
              : isDark
              ? "#888"
              : "rgba(0,0,0,0.5)";

            return (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Image
                  source={logoSource}
                  style={{
                    width: 20,
                    height: 20,
                    resizeMode: "contain",
                    opacity: isSelected ? 1 : 0.5,
                  }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    color: textColor,
                    fontFamily: Fonts.OSMEDIUM,
                  }}
                >
                  {teamData.teamCode}
                </Text>
              </View>
            );
          }}
        />
      </View>
      <FlatList
        data={team.games}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRow}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={styles.empty}>No recent games.</Text>}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.cell,
                styles.date,
                { color: lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d" },
              ]}
            >
              Date
            </Text>
            <Text
              style={[
                styles.cell,
                styles.team,
                { color: lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d" },
              ]}
            >
              Matchup
            </Text>
            <Text
              style={[
                styles.cell,
                { color: lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d" },
              ]}
            >
              Result
            </Text>
          </View>
        }
      />
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderColor: "#aaa",
      marginBottom: 6,
    },
    cell: {
      fontSize: 14,
      flex: 1,
      textAlign: "center",
      fontFamily: Fonts.OSREGULAR,
    },
    date: { flex: 1.2 },
    team: { flex: 2 },
    teamWithLogo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    empty: {
      textAlign: "center",
      color: "#999",
      marginTop: 12,
      fontFamily: Fonts.OSREGULAR,
    },
  });
