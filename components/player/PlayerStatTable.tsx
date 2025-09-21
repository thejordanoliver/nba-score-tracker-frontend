import PlayerStatTableSkeleton from "components/player/PlayerStatsTableSkeleton"; // adjust path if needed
import { Fonts } from "constants/fonts";
import { usePlayerStatsBySeason } from "hooks/usePlayerStatsAllSeasons";
import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

interface Props {
  playerId: number;
  seasons: string[];
}

const safeDivide = (num: number, denom: number) =>
  denom === 0 ? "0.0" : (num / denom).toFixed(1);

const percentage = (str: string | number) => `${str}%`;

export default function PlayerStatTable({ playerId, seasons }: Props) {
  const { data, loading, error } = usePlayerStatsBySeason(playerId, seasons);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const dynamicStyles = useMemo(
    () => ({
      container: {
        borderColor: isDark ? "#555" : "#ccc",
        backgroundColor: isDark ? "#222" : "#fff",
      },
      headerRow: {
        backgroundColor: isDark ? "#333" : "#eee",
      },
      rowEven: {
        backgroundColor: isDark ? "#222" : "#fff",
        borderBottomColor: isDark ? "#555" : "#ccc",
      },
      rowOdd: {
        backgroundColor: isDark ? "#2a2a2a" : "#f3f3f3",
        borderBottomColor: isDark ? "#555" : "#ccc",
      },
      highlight: {
        backgroundColor: "#ffd700",
      },
      highlightDark: {
        backgroundColor: "#5c4300",
      },
      careerRow: {
        backgroundColor: isDark ? "#004400" : "#ccffcc",

        borderTopColor: isDark ? "#00ff00" : "#008800",
      },
      textDark: {
        color: "#eee",
      },
      errorTextDark: {
        color: "#ff6666",
      },
    }),
    [isDark]
  );

  const bestSeason = useMemo(() => {
    let maxPPG = -Infinity;
    let best: string | null = null;
    data.forEach((season) => {
      const games = season.games.length;
      const totalPoints = season.games.reduce(
        (sum, g) => sum + (g.points || 0),
        0
      );
      const ppg = games === 0 ? 0 : totalPoints / games;
      if (ppg > maxPPG) {
        maxPPG = ppg;
        best = season.season;
      }
    });
    return best;
  }, [data]);

  if (loading) {
    return <PlayerStatTableSkeleton />;
  }
  if (error)
    return (
      <Text
        style={[
          styles.cell,
          styles.errorText,
          isDark && dynamicStyles.errorTextDark,
        ]}
      >
        Error loading stats
      </Text>
    );

  if (!data.length)
    return (
      <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
        No stats available
      </Text>
    );

  // Aggregate career totals for all seasons combined
  const careerTotals = data.reduce(
    (acc, seasonData) => {
      seasonData.games.forEach((g) => {
        const parseNum = (val: string | number | undefined) =>
          parseFloat(val as any) || 0;
        acc.games += 1;
        acc.min += parseNum(g.min);
        acc.fgm += g.fgm || 0;
        acc.fga += g.fga || 0;
        acc.fgp += parseNum(g.fgp);
        acc.tpm += g.tpm || 0;
        acc.tpa += g.tpa || 0;
        acc.tpp += parseNum(g.tpp);
        acc.ftm += g.ftm || 0;
        acc.fta += g.fta || 0;
        acc.ftp += parseNum(g.ftp);
        acc.offReb += g.offReb || 0;
        acc.defReb += g.defReb || 0;
        acc.totReb += g.totReb || 0;
        acc.ast += g.assists || 0;
        acc.stl += g.steals || 0;
        acc.blk += g.blocks || 0;
        acc.to += g.turnovers || 0;
        acc.pf += g.pFouls || 0;
        acc.plusMinus += parseNum(g.plusMinus);
        acc.pts += g.points || 0;
      });
      return acc;
    },
    {
      games: 0,
      min: 0,
      fgm: 0,
      fga: 0,
      fgp: 0,
      tpm: 0,
      tpa: 0,
      tpp: 0,
      ftm: 0,
      fta: 0,
      ftp: 0,
      offReb: 0,
      defReb: 0,
      totReb: 0,
      ast: 0,
      stl: 0,
      blk: 0,
      to: 0,
      pf: 0,
      plusMinus: 0,
      pts: 0,
    }
  );

  const statLabels = [
    "Season",
    "GP",
    "PTS",
    "MIN",
    "FGM",
    "FGA",
    "FG%",
    "3PM",
    "3PA",
    "3P%",
    "FTM",
    "FTA",
    "FT%",
    "OREB",
    "DREB",
    "REB",
    "AST",
    "STL",
    "BLK",
    "TO",
    "PF",
    "+/-",
  ];

  return (
    <>
      <View
        style={{ flexDirection: "row", borderRadius: 4, overflow: "hidden" }}
      >
        {/* Fixed Season Column */}
        <View>
          {/* Header */}
          <View style={[styles.seasonCell, dynamicStyles.headerRow]}>
            <Text
              style={[
                styles.cell,
                styles.headerCell,
                isDark && dynamicStyles.textDark,
              ]}
            >
              Season
            </Text>
          </View>

          {/* Season Rows */}
          {data.map((seasonData, index) => {
            const rowStyle = [
              index % 2 === 1 ? dynamicStyles.rowOdd : dynamicStyles.rowEven,
              seasonData.season === bestSeason
                ? isDark
                  ? dynamicStyles.highlightDark
                  : dynamicStyles.highlight
                : {},
              {},
            ];

            return (
              <View
                key={seasonData.season}
                style={[styles.seasonCell, rowStyle]}
              >
                <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                  {seasonData.season}
                </Text>
              </View>
            );
          })}

          {/* Career Label Row */}
          <View
            style={[
              styles.seasonCell,
              dynamicStyles.careerRow,
              { borderTopColor: isDark ? "#00ff00" : "#008800" },
            ]}
          >
            <Text
              style={[
                styles.cell,
                styles.headerCell,
                isDark && dynamicStyles.textDark,
              ]}
            >
              Career
            </Text>
          </View>
        </View>

        {/* Scrollable Stats Table */}
        <ScrollView horizontal>
          <View style={[styles.container, dynamicStyles.container]}>
            {/* Header Row */}
            <View style={[styles.row, dynamicStyles.headerRow]}>
              {statLabels.slice(1).map((label) => (
                <Text
                  key={label}
                  style={[
                    styles.cell,
                    styles.headerCell,
                    isDark && dynamicStyles.textDark,
                  ]}
                >
                  {label}
                </Text>
              ))}
            </View>

            {/* Season Rows */}
            {data.map((seasonData, index) => {
              const totalGames = seasonData.games.length;
              const totals = seasonData.games.reduce(
                (acc, g) => {
                  const parseNum = (val: string | number | undefined) =>
                    parseFloat(val as any) || 0;

                  acc.min += parseNum(g.min);
                  acc.fgm += g.fgm || 0;
                  acc.fga += g.fga || 0;
                  acc.fgp += parseNum(g.fgp);
                  acc.tpm += g.tpm || 0;
                  acc.tpa += g.tpa || 0;
                  acc.tpp += parseNum(g.tpp);
                  acc.ftm += g.ftm || 0;
                  acc.fta += g.fta || 0;
                  acc.ftp += parseNum(g.ftp);
                  acc.offReb += g.offReb || 0;
                  acc.defReb += g.defReb || 0;
                  acc.totReb += g.totReb || 0;
                  acc.ast += g.assists || 0;
                  acc.stl += g.steals || 0;
                  acc.blk += g.blocks || 0;
                  acc.to += g.turnovers || 0;
                  acc.pf += g.pFouls || 0;
                  acc.plusMinus += parseNum(g.plusMinus);
                  acc.pts += g.points || 0;
                  return acc;
                },
                {
                  min: 0,
                  fgm: 0,
                  fga: 0,
                  fgp: 0,
                  tpm: 0,
                  tpa: 0,
                  tpp: 0,
                  ftm: 0,
                  fta: 0,
                  ftp: 0,
                  offReb: 0,
                  defReb: 0,
                  totReb: 0,
                  ast: 0,
                  stl: 0,
                  blk: 0,
                  to: 0,
                  pf: 0,
                  plusMinus: 0,
                  pts: 0,
                }
              );

              const rowStyle = [
                styles.row,
                index % 2 === 1 ? dynamicStyles.rowOdd : dynamicStyles.rowEven,
                seasonData.season === bestSeason
                  ? isDark
                    ? dynamicStyles.highlightDark
                    : dynamicStyles.highlight
                  : {},
              ];

              return (
                <View key={seasonData.season} style={rowStyle}>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {totalGames}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.pts, totalGames)}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.min, totalGames)}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.fgm, totalGames)}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.fga, totalGames)}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {percentage(safeDivide(totals.fgp, totalGames))}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.tpm, totalGames)}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.tpa, totalGames)}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {percentage(safeDivide(totals.tpp, totalGames))}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.ftm, totalGames)}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.fta, totalGames)}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {percentage(safeDivide(totals.ftp, totalGames))}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.offReb, totalGames)}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.defReb, totalGames)}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.totReb, totalGames)}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.ast, totalGames)}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.stl, totalGames)}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.blk, totalGames)}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.to, totalGames)}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.pf, totalGames)}
                  </Text>
                  <Text style={[styles.cell, isDark && dynamicStyles.textDark]}>
                    {safeDivide(totals.plusMinus, totalGames)}
                  </Text>
                </View>
              );
            })}

            {/* Career Row */}
            <View style={[styles.row, dynamicStyles.careerRow]}>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.games}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.pts}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.min.toFixed(1)}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.fgm}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.fga}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {percentage((careerTotals.fgp / careerTotals.games).toFixed(1))}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.tpm}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.tpa}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {percentage((careerTotals.tpp / careerTotals.games).toFixed(1))}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.ftm}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.fta}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {percentage((careerTotals.ftp / careerTotals.games).toFixed(1))}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.offReb}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.defReb}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.totReb}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.ast}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.stl}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.blk}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.to}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.pf}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.headerCell,
                  isDark && dynamicStyles.textDark,
                ]}
              >
                {careerTotals.plusMinus.toFixed(1)}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Legend */}
      <View
        style={[styles.legendContainer, isDark && styles.legendContainerDark]}
      >
        {/* Best Season */}
        <View
          style={[
            styles.legendColorBox,
            isDark ? styles.legendColorBoxDark : styles.legendColorBoxLight,
          ]}
        />
        <Text style={[styles.legendText, isDark && styles.textDark]}>
          Best Season (highlighted)
        </Text>

        {/* Spacer */}
        <View style={{ width: 24 }} />

        {/* Career Totals */}
        <View
          style={[
            styles.legendColorBox,
            isDark ? styles.legendCareerBoxDark : styles.legendCareerBoxLight,
          ]}
        />
        <Text style={[styles.legendText, isDark && styles.textDark]}>
          Career Totals
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    flexDirection: "column",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },

  row: {
    flexDirection: "row",
    paddingVertical: 8,
    alignItems: "center",
  },

  cell: {
    minWidth: 60,
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontFamily: Fonts.OSREGULAR, // ✅ Text style only
    paddingHorizontal: 4,
  },
  headerCell: {
    fontFamily: Fonts.OSBOLD, // ✅ OK because applied to Text
  },
  errorText: {
    color: "red",
  },
  seasonCell: {
    minWidth: 80,
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  legendContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,

    marginTop: 12,
    borderTopColor: "#ccc",
    borderTopWidth: 1,
  },
  legendContainerDark: {
    borderTopColor: "#555",
  },
  legendColorBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
  },
  legendColorBoxLight: {
    backgroundColor: "#ffd700",
  },
  legendColorBoxDark: {
    backgroundColor: "#5c4300",
  },
  legendText: {
    fontSize: 14,
    fontFamily: Fonts.OSREGULAR,
  },
  textDark: {
    color: "#eee",
  },

  legendCareerBoxLight: {
    backgroundColor: "#ccffcc",
  },
  legendCareerBoxDark: {
    backgroundColor: "#004400",
  },
});
