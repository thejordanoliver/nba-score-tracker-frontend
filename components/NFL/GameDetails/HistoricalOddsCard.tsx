import { Fonts } from "constants/fonts";
import { teams } from "constants/teamsNFL";
import { HistoricalNFLGameOdds } from "hooks/NFLHooks/useNFLHistoricalOdds";
import React from "react";
import { Image, StyleSheet, Text, useColorScheme, View } from "react-native";

interface Props {
  game: HistoricalNFLGameOdds;
}

// ✅ NFL Team Name Map (allow string indexing)
const teamNameMapNFL: { [key: string]: string } = {
  ARI: "Arizona Cardinals",
  ATL: "Atlanta Falcons",
  BAL: "Baltimore Ravens",
  BUF: "Buffalo Bills",
  CAR: "Carolina Panthers",
  CHI: "Chicago Bears",
  CIN: "Cincinnati Bengals",
  CLE: "Cleveland Browns",
  DAL: "Dallas Cowboys",
  DEN: "Denver Broncos",
  DET: "Detroit Lions",
  GB: "Green Bay Packers",
  HOU: "Houston Texans",
  IND: "Indianapolis Colts",
  JAX: "Jacksonville Jaguars",
  KC: "Kansas City Chiefs",
  LAC: "Los Angeles Chargers",
  LAR: "Los Angeles Rams",
  LV: "Las Vegas Raiders",
  MIA: "Miami Dolphins",
  MIN: "Minnesota Vikings",
  NE: "New England Patriots",
  NO: "New Orleans Saints",
  NYG: "New York Giants",
  NYJ: "New York Jets",
  PHI: "Philadelphia Eagles",
  PIT: "Pittsburgh Steelers",
  SEA: "Seattle Seahawks",
  SF: "San Francisco 49ers",
  TB: "Tampa Bay Buccaneers",
  TEN: "Tennessee Titans",
  WAS: "Washington Commanders",
};

const getTeamFromApi = (teamIdentifier: string) => {
  if (!teamIdentifier) return undefined;

  // Try code first
  const byCode = teams.find((t) => t.code === teamIdentifier);
  if (byCode) return byCode;

  // Try full name via map
  const fullName = teamNameMapNFL[teamIdentifier];
  if (fullName) {
    return teams.find((t) => t.name === fullName);
  }

  // Try directly by full name
  return teams.find((t) => t.name === teamIdentifier);
};

const HistoricalOddsCard: React.FC<Props> = ({ game }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // ✅ Pick only the first bookmaker
  const bookmaker = game.bookmakers?.[0]; // pick first bookmaker

  // Lookup teams safely
  const homeTeam = getTeamFromApi(game.home_team);
  const awayTeam = getTeamFromApi(game.away_team);

  const getMarket = (key: string) =>
    bookmaker.markets?.find((m) => m.key === key);

  const h2h = getMarket("h2h");
  const spreads = getMarket("spreads");
  const totals = getMarket("totals");

  const oddsMap = [
    { label: "ML", market: h2h },
    { label: "Spread", market: spreads },
    { label: "Total", market: totals },
  ];

  const getLogo = (team: typeof homeTeam | undefined) => {
    if (!team) return require("../../../assets/Football/NFL_Logos/NFL.png");

    const logo = isDark ? team.logoLight || team.logo : team.logo;

    if (!logo) return require("../../../assets/Football/NFL_Logos/NFL.png");

    if (typeof logo === "string") return { uri: logo };
    return logo;
  };
  const colors = {
    textPrimary: isDark ? "#fff" : "#000",
    textSecondary: isDark ? "#eee" : "#333",
    textHeader: isDark ? "#ccc" : "#666",
    divider: isDark ? "#444" : "#ccc",
    
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

    return `${outcome.price}${
      outcome.point !== undefined ? ` (${outcome.point})` : ""
    }`;
  };

  return (
    <View>
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
              { color: colors.textPrimary, fontFamily: Fonts.OSREGULAR },
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
              { color: colors.textSecondary, marginLeft: i === 0 ? 12 : 8 },
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
              { color: colors.textPrimary, fontFamily: Fonts.OSREGULAR },
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
              { color: colors.textSecondary, marginLeft: i === 0 ? 12 : 8 },
            ]}
          >
            {formatOutcome(market, 1, label)}
          </Text>
        ))}
      </View>

      {/* Bookmaker Info */}
      <View style={styles.bookmaker}>
        <View style={styles.bookmakerWrapper}>
          <Text style={styles.subtext}>
            Powered By: {bookmaker?.title || "Unknown"}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({

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

export default HistoricalOddsCard;
