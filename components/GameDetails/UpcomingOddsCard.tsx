import { Fonts } from "constants/fonts";
import { teams } from "constants/teams";
import { UpcomingGameOdds } from "hooks/useUpcomingOdds";
import React from "react";
import { Image, StyleSheet, Text, useColorScheme, View } from "react-native";
import HeadingTwo from "../Headings/HeadingTwo";
interface Props {
  game: UpcomingGameOdds;
}

const UpcomingOddsCard: React.FC<Props> = ({ game }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Pick only the first bookmaker
  const bookmaker = game.bookmakers?.[0];

  const homeTeam = teams.find((t) => t.fullName === game.home_team);
  const awayTeam = teams.find((t) => t.fullName === game.away_team);

  const getMarket = (key: string) =>
    bookmaker?.markets?.find((m) => m.key === key);

  const h2h = getMarket("h2h");
  const spreads = getMarket("spreads");
  const totals = getMarket("totals");

  const oddsMap = [
    { label: "ML", market: h2h },
    { label: "Spread", market: spreads },
    { label: "Total", market: totals },
  ];

  const getLogo = (team: typeof homeTeam | undefined) => {
    if (!team) return undefined;
    return isDark ? team.logoLight || team.logo : team.logo;
  };

  const colors = {
    textPrimary: isDark ? "#fff" : "#000",
    textSecondary: isDark ? "#888" : "#333",
    textHeader: isDark ? "#ccc" : "#666",
    divider: isDark ? "#444" : "#ccc",
    background: isDark ? "#1e1e1e" : "#fff",
  };

  const formatOutcome = (
    market: typeof h2h | typeof spreads | typeof totals,
    index: number,
    label: string
  ) => {
    const outcome = market?.outcomes?.[index];
    if (!outcome) return "-";

    if (label === "Total") {
      return `${index === 0 ? "O" : "U"} ${outcome.point ?? "-"}`;
    }

    return `${outcome.price}${outcome.point !== undefined ? ` (${outcome.point})` : ""}`;
  };

  return (
    <>
      <HeadingTwo>Betting Odds</HeadingTwo>
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
                { color: colors.textPrimary, fontFamily: Fonts.OSMEDIUM },
              ]}
            >
              {awayTeam?.code || "Unknown"}
            </Text>
          </View>
          {oddsMap.map(({ market, label }, i) => (
            <Text
              key={`${label}-away`}
              style={[
                styles.oddsText,
                { color: colors.textPrimary, marginLeft: i === 0 ? 12 : 8 },
              ]}
            >
              {formatOutcome(market, 0, label)}
            </Text>
          ))}
        </View>

        <View style={[styles.divider, { borderBottomColor: colors.divider }]} />

        {/* Home Team Row */}
        <View style={styles.teamRow}>
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
                { color: colors.textPrimary, fontFamily: Fonts.OSMEDIUM },
              ]}
            >
              {homeTeam?.code || "Unknown"}
            </Text>
          </View>
          {oddsMap.map(({ market, label }, i) => (
            <Text
              key={`${label}-home`}
              style={[
                styles.oddsText,
                { color: colors.textPrimary, marginLeft: i === 0 ? 12 : 8 },
              ]}
            >
              {formatOutcome(market, 1, label)}
            </Text>
          ))}
        </View>

        {/* Bookmaker Info */}
        <View style={styles.bookmaker}>
                <Text style={styles.subtext}>
                  Powered By: {bookmaker?.title || "Unknown"}
                </Text>
                <Text style={styles.subtext}>
                  {new Date(game.commence_time).toLocaleString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "2-digit",
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                  })}
                </Text>
              </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
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
  bookmaker: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },

  bookmakerWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookmakerImage: {
    width: 60,
    height: 20,
    resizeMode: "contain",
    marginLeft: 4,
  },
  subtext: {
    color: "#888",
    fontSize: 12,
    fontFamily: Fonts.OSLIGHT,
  },
});

export default UpcomingOddsCard;
