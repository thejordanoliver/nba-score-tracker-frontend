import { Fonts } from "constants/fonts";
import {
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import HeadingTwo from "../Headings/HeadingTwo";

type Props = {
  linescore: {
    home: (string | null | undefined)[];
    away: (string | null | undefined)[];
  };
  homeCode: string;
  awayCode: string;
  lighter?: boolean;
};

export default function LineScore({
  linescore,
  homeCode,
  awayCode,
  lighter,
}: Props) {
  if (!linescore || !linescore.home || !linescore.away) return null;

  const isDark = useColorScheme() === "dark";
  const textColor = lighter ? "#fff" : isDark ? "#fff" : "#000";
  const borderColor = lighter ? "#aaa" : isDark ? "#333" : "#888";
  const dividerColor = lighter ? "#bbb" : isDark ? "#888" : "#888";

  const total = (scores: (string | null | undefined)[]) => {
    const numericValues = scores
      .map((v) => (v != null ? parseInt(v, 10) : NaN))
      .filter((n) => !isNaN(n));
    if (numericValues.length === 0) return "-";
    return numericValues.reduce((a, b) => a + b, 0);
  };

  const homeTotal = total(linescore.home);
  const awayTotal = total(linescore.away);

  const maxQuarters = Math.max(
    4, // always show Q1–Q4
    linescore.home.length,
    linescore.away.length
  );

  const renderScore = (score: string | null | undefined) =>
    score != null ? score : "-";

  const getQuarterLabel = (i: number) => {
    if (i < 4) return `Q${i + 1}`;
    if (i === 4) return "OT";
    return `OT${i - 3}`;
  };

  const quarters = Array.from({ length: maxQuarters }, (_, i) =>
    getQuarterLabel(i)
  );

  const columnStyle: ViewStyle = { flex: 1, alignItems: "center" }; // ✅ cast as ViewStyle
  return (
    <View style={[styles.container, { borderColor }]}>
      <HeadingTwo style={{ marginBottom: 12 }} lighter={lighter}>Score Summary</HeadingTwo>

      {/* Header */}
      <View style={styles.row}>
        <Text style={[styles.teamCode, { color: "transparent" }]}>-</Text>
        <View style={styles.scoresWrapper}>
          {quarters.map((q, idx) => (
            <View key={`q-${idx}`} style={columnStyle}>
              <Text style={[styles.header, { color: textColor }]}>{q}</Text>
            </View>
          ))}
          <View style={columnStyle}>
            <Text style={[styles.header, { color: textColor }]}>Total</Text>
          </View>
        </View>
      </View>

      {/* Away Row */}
      <View style={styles.row}>
        <Text style={[styles.teamCode, { color: textColor }]}>{awayCode}</Text>
        <View style={styles.scoresWrapper}>
          {quarters.map((_, idx) => (
            <View key={`away-${idx}`} style={columnStyle}>
              <Text style={[styles.score, { color: textColor }]}>
                {renderScore(linescore.away[idx])}
              </Text>
            </View>
          ))}
          <View style={columnStyle}>
            <Text style={[styles.totalScore, { color: textColor }]}>
              {awayTotal}
            </Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />

      {/* Home Row */}
      <View style={styles.row}>
        <Text style={[styles.teamCode, { color: textColor }]}>{homeCode}</Text>
        <View style={styles.scoresWrapper}>
          {quarters.map((_, idx) => (
            <View key={`home-${idx}`} style={columnStyle}>
              <Text style={[styles.score, { color: textColor }]}>
                {renderScore(linescore.home[idx])}
              </Text>
            </View>
          ))}
          <View style={columnStyle}>
            <Text style={[styles.totalScore, { color: textColor }]}>
              {homeTotal}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
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
    paddingLeft: 8,
  },
  scoresWrapper: {
    flex: 1,
    flexDirection: "row",
  },
  header: {
    fontFamily: Fonts.OSMEDIUM,
    fontSize: 10,
    opacity: 0.8,
    textAlign: "center",
  },
  score: {
    fontFamily: Fonts.OSREGULAR,
    fontSize: 14,
    textAlign: "center",
  },
  totalScore: {
    fontFamily: Fonts.OSMEDIUM,
    fontSize: 14,
    textAlign: "center",
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: 4,
  },
});
