import { Fonts } from "constants/fonts";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import HeadingTwo from "../Headings/HeadingTwo";

type Props = {
  homeWinProbability: number;
  awayWinProbability: number;
  homeColor: string;
  awayColor: string;
  homeTeamId: string | number;
  awayTeamId: string | number;
  homeSecondaryColor?: string;
  awaySecondaryColor?: string;
};

export default function PredictionBar({
  homeWinProbability,
  awayWinProbability,
  homeColor,
  awayColor,
  homeTeamId,
  awayTeamId,
  homeSecondaryColor,
  awaySecondaryColor,
}: Props) {
  const isDark = useColorScheme() === "dark";

  const homePercent = Math.min(Math.max(homeWinProbability, 0), 100);
  const awayPercent = Math.min(Math.max(awayWinProbability, 0), 100);
  const alwaysPrimary = ["25", "5", "26", "27", "6", "38", "2", "11", "8"]; // OKC

  const contrast = ["29", "20", "11"];

  // Use secondary color in dark mode if it exists, else primary color
  const resolveColor = (
    teamId: string | number,
    primary: string,
    secondary?: string
  ) => {
    const id = String(teamId);

    if (alwaysPrimary.includes(id)) {
      return primary;
    }

    if (contrast.includes(id)) {
      return isDark ? primary : secondary ?? primary;
    }

    return isDark && secondary ? secondary : primary;
  };

  const effectiveHomeColor = resolveColor(
    homeTeamId,
    homeColor,
    homeSecondaryColor
  );
  const effectiveAwayColor = resolveColor(
    awayTeamId,
    awayColor,
    awaySecondaryColor
  );
  const textColor = isDark ? "#fff" : "#1d1d1d";

  return (
    <>
      <View style={[styles.container]}>
        <HeadingTwo>Win Predictor</HeadingTwo>
        <View style={[styles.wrapper]}>
          <View
            style={[
              styles.bar,
              { flex: awayPercent, backgroundColor: effectiveAwayColor },
            ]}
          ></View>
          <View
            style={[
              styles.bar,
              { flex: homePercent, backgroundColor: effectiveHomeColor },
            ]}
          ></View>
        </View>
        <View style={styles.numbers}>
          {awayPercent > 5 && (
            <Text style={[styles.text, { color: textColor }]}>
              {awayPercent.toFixed(1)}%
            </Text>
          )}
          {homePercent > 5 && (
            <Text style={[styles.text, { color: textColor }]}>
              {homePercent.toFixed(1)}%
            </Text>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  wrapper: {
    flexDirection: "row",
    height: 8,
    borderRadius: 100,
    overflow: "hidden",
   
  },
  bar: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontFamily: Fonts.OSBOLD,
  },
  numbers: {
    flex: 1,
     padding: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
