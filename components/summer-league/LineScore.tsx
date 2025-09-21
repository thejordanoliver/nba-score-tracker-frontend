import { StyleSheet, Text, View } from "react-native";
import HeadingTwo from "../Headings/HeadingTwo";
import { Fonts } from "constants/fonts";

type ScoreType = {
  q1?: number;
  q2?: number;
  q3?: number;
  q4?: number;
  total?: number;
  over_time?: number | null;
};

type LineScoreProps = {
  homeScores: ScoreType;
  awayScores: ScoreType;
  homeCode: string;
  awayCode: string;
  isDark: boolean; // ← Add this line
};

export default function LineScore({
  homeScores,
  awayScores,
  homeCode,
  awayCode,
  isDark,
}: LineScoreProps) {
  const textColor = isDark ? "#fff" : "#000";
  const borderColor = isDark ? "#333" : "#888";
  const dividerColor = isDark ? "#888" : "#888";

  const getScores = (scores: ScoreType) => {
    const result = [scores.q1, scores.q2, scores.q3, scores.q4];
    if (scores.over_time != null) result.push(scores.over_time);
    return result;
  };

  const homeLine = getScores(homeScores);
  const awayLine = getScores(awayScores);
  const maxQuarters = Math.max(homeLine.length, awayLine.length);

  const getQuarterLabel = (i: number) => {
    if (i < 4) return `Q${i + 1}`;
    if (i === 4) return "OT";
    return `OT${i - 3}`;
  };

  return (
    <>
      <HeadingTwo>Score Summary</HeadingTwo>
      <View style={[styles.container]}>
        {/* Header Row */}
        <View style={styles.row}>
          <Text style={[styles.teamCode, { color: "transparent" }]}>-</Text>
          <View style={styles.scoresWrapper}>
            {[...Array(maxQuarters)].map((_, i) => (
              <Text
                key={`q-${i}`}
                style={[styles.header, { color: textColor }]}
              >
                {getQuarterLabel(i)}
              </Text>
            ))}
            <Text style={[styles.header, { color: textColor }]}>Total</Text>
          </View>
        </View>

        {/* Away Team Row */}
        <View style={styles.row}>
          <Text style={[styles.teamCode, { color: textColor }]}>
            {awayCode}
          </Text>
          <View style={styles.scoresWrapper}>
            {awayLine.map((score, i) => (
              <Text
                key={`away-${i}`}
                style={[styles.score, { color: textColor }]}
              >
                {score}
              </Text>
            ))}
            <Text style={[styles.totalScore, { color: textColor }]}>
              {awayScores.total}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        {/* Home Team Row */}
        <View style={styles.row}>
          <Text style={[styles.teamCode, { color: textColor }]}>
            {homeCode}
          </Text>
          <View style={styles.scoresWrapper}>
            {homeLine.map((score, i) => (
              <Text
                key={`home-${i}`}
                style={[styles.score, { color: textColor }]}
              >
                {score}
              </Text>
            ))}
            <Text style={[styles.totalScore, { color: textColor }]}>
              {homeScores.total}
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  teamCode: {
    width: 40,
    fontFamily: Fonts.OSMEDIUM,
    fontSize: 14,
  },
  scoresWrapper: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    fontFamily: Fonts.OSMEDIUM,
    fontSize: 10,
    opacity: 0.8,
    textAlign: "center",
    flex: 1,
  },
  score: {
    fontFamily: Fonts.OSREGULAR,
    fontSize: 14,
    textAlign: "center",
    flex: 1,
  },
  totalScore: {
    fontFamily: Fonts.OSMEDIUM,
    fontSize: 14,
    textAlign: "center",
    flex: 1,
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: 4,
  },
});
