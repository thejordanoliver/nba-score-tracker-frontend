import { Fonts } from "constants/fonts";
import { teams } from "constants/teams";
import { HistoricalGameOdds } from "hooks/useHistoricalOdds";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import HeadingTwo from "../Headings/HeadingTwo";

interface Props {
  game: HistoricalGameOdds;
}

const HistoricalOddsCard: React.FC<Props> = ({ game }) => {
  const colorScheme = useColorScheme(); // "dark" or "light"
  const isDark = colorScheme === "dark";

  const bookmaker = game.bookmakers[0];

  const homeTeam = teams.find((t) => t.fullName === game.home_team);
  const awayTeam = teams.find((t) => t.fullName === game.away_team);

  const getMarket = (key: string) =>
    bookmaker?.markets.find((m) => m.key === key);

  const h2h = getMarket("h2h");
  const spreads = getMarket("spreads");
  const totals = getMarket("totals");

  const oddsMap = [
    { label: "ML", market: h2h },
    { label: "Spread", market: spreads },
    { label: "Total", market: totals },
  ];

  // Helper to pick the right logo based on color scheme
  const getLogo = (team: typeof homeTeam | undefined) => {
    if (!team) return undefined;
    if (isDark) {
      // Use logoLight if exists, else fallback to logo
      return team.logoLight || team.logo;
    }
    // Light mode uses regular logo
    return team.logo;
  };

  // Text colors based on mode
  const colors = {
    textPrimary: isDark ? "#fff" : "#000",
    textSecondary: isDark ? "#eee" : "#333",
    textHeader: isDark ? "#ccc" : "#666",
    divider: isDark ? "#444" : "#ccc",
    background: isDark ? "#1e1e1e" : "#fff",
  };

  return (
    <>
      <HeadingTwo>Game Odds</HeadingTwo>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.headerTeamText,
              { color: colors.textHeader, flex: 2, fontFamily: Fonts.OSBOLD },
            ]}
          >
            Team
          </Text>
          {oddsMap.map(({ label }, i) => (
            <Text
              key={label}
              style={[
                styles.headerText,
                {
                  color: colors.textHeader,
                  flex: 1,
                  marginLeft: i === 0 ? 12 : 8,
                  fontFamily: Fonts.OSBOLD,
                },
              ]}
            >
              {label}
            </Text>
          ))}
        </View>

        {/* Away Team Row */}
        <View style={styles.teamRow}>
          {/* Team Info */}
          <View style={styles.teamInfo}>
            {awayTeam && (
              <Image
                source={getLogo(awayTeam)}
                style={styles.teamLogo}
                resizeMode="contain"
              />
            )}
            <Text
              style={[
                styles.teamName,
                { color: colors.textPrimary, fontFamily: Fonts.OSREGULAR },
              ]}
            >
              {awayTeam?.name || "Unknown"}
            </Text>
          </View>

          {/* Odds */}
          {oddsMap.map(({ market, label }, i) => {
            // Special rendering for Total (Over/Under)
            if (label === "Total" && market?.outcomes.length === 2) {
              const over = market.outcomes[0];
              const labelText = "O";
              const outcome = over;
              return (
                <Text
                  key={`${label}-away`}
                  style={[
                    styles.oddsText,
                    {
                      color: colors.textSecondary,
                      marginLeft: i === 0 ? 12 : 8,
                    },
                  ]}
                >
                  {outcome ? `${labelText} ${outcome.point}` : "-"}
                </Text>
              );
            }

            const outcome = market?.outcomes[0];
            return (
              <Text
                key={`${label}-away`}
                style={[
                  styles.oddsText,
                  {
                    color: colors.textSecondary,
                    marginLeft: i === 0 ? 12 : 8,
                  },
                ]}
              >
                {outcome
                  ? `${outcome.price}${
                      outcome.point !== undefined ? ` (${outcome.point})` : ""
                    }`
                  : "-"}
              </Text>
            );
          })}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { borderBottomColor: colors.divider }]} />

        {/* Home Team Row */}
        <View style={styles.teamRow}>
          {/* Team Info */}
          <View style={styles.teamInfo}>
            {homeTeam && (
              <Image
                source={getLogo(homeTeam)}
                style={styles.teamLogo}
                resizeMode="contain"
              />
            )}
            <Text
              style={[
                styles.teamName,
                { color: colors.textPrimary, fontFamily: Fonts.OSREGULAR },
              ]}
            >
              {homeTeam?.name || "Unknown"}
            </Text>
          </View>

          {/* Odds */}
          {oddsMap.map(({ market, label }, i) => {
            // Special rendering for Total (Over/Under)
            if (label === "Total" && market?.outcomes.length === 2) {
              const under = market.outcomes[1];
              const labelText = "U";
              const outcome = under;
              return (
                <Text
                  key={`${label}-home`}
                  style={[
                    styles.oddsText,
                    {
                      color: colors.textSecondary,
                      marginLeft: i === 0 ? 12 : 8,
                    },
                  ]}
                >
                  {outcome ? `${labelText} ${outcome.point}` : "-"}
                </Text>
              );
            }

            const outcome = market?.outcomes[1];
            return (
              <Text
                key={`${label}-home`}
                style={[
                  styles.oddsText,
                  {
                    color: colors.textSecondary,
                    marginLeft: i === 0 ? 12 : 8,
                  },
                ]}
              >
                {outcome
                  ? `${outcome.price}${
                      outcome.point !== undefined ? ` (${outcome.point})` : ""
                    }`
                  : "-"}
              </Text>
            );
          })}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  headerText: {
    fontSize: 12,
    textAlign: "center",
  },
  headerTeamText: {
    fontSize: 12,
    textAlign: "left",
    paddingLeft: 4,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  teamInfo: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
  },
  teamLogo: {
    width: 28,
    height: 28,
  },
  teamName: {
    fontSize: 14,
  },
  oddsText: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontFamily: Fonts.OSREGULAR,
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: 8,
  },
});

export default HistoricalOddsCard;
