import { Fonts } from "constants/fonts";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import PlayoffsLogo from "../../assets/Logos/NBAPlayoffs.png";
import PlayoffsLogoLight from "../../assets/Logos/NBAPlayoffsLight.png";
import FinalsLogo from "../../assets/Logos/TheNBAFinals.png";
import FinalsLogoLight from "../../assets/Logos/TheNBAFinalsLight.png";

type CenterInfoProps = {
  isNBAFinals: boolean;
  isFinal: boolean;
  isCanceled?: boolean;
  isHalftime?: boolean;
  broadcastNetworks?: string;
  showLiveInfo: boolean;
  period: number | string;
  time: string;
  clock?: string | null;
  endOfPeriod?: boolean;
  formattedDate: string;
  isDark: boolean;
  gameNumberLabel?: string;
  seriesSummary?: string;
  isPlayoffs?: boolean;
  totalPeriodsPlayed?: number;
};

export default function CenterInfo({
  isNBAFinals,
  isFinal,
  isCanceled,
  isHalftime,
  broadcastNetworks,
  showLiveInfo,
  period,
  clock,
  endOfPeriod,
  time,
  formattedDate,
  isDark,
  gameNumberLabel,
  seriesSummary,
  isPlayoffs,
  totalPeriodsPlayed,
}: CenterInfoProps) {
  const lightOpacity = useRef(new Animated.Value(isDark ? 0 : 1)).current;
  const darkOpacity = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  function getLivePeriodLabel(period?: number) {
    if (!period) return "Live";
    if (period <= 4) {
      return ["1st", "2nd", "3rd", "4th"][period - 1];
    }
    const overtimeNumber = period - 4;
    return overtimeNumber === 1 ? "OT" : `OT${overtimeNumber}`;
  }

  useEffect(() => {
    if (isNBAFinals || isPlayoffs) {
      Animated.parallel([
        Animated.timing(lightOpacity, {
          toValue: isDark ? 0 : 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(darkOpacity, {
          toValue: isDark ? 1 : 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDark, isNBAFinals, isPlayoffs, lightOpacity, darkOpacity]);

  return (
    <View style={styles.container}>
      {(isNBAFinals || isPlayoffs) && (
        <View style={styles.logoWrapper}>
          <Animated.Image
            source={isNBAFinals ? FinalsLogo : PlayoffsLogo}
            style={[styles.logo, { opacity: lightOpacity }]}
          />
          <Animated.Image
            source={isNBAFinals ? FinalsLogoLight : PlayoffsLogoLight}
            style={[styles.logo, { opacity: darkOpacity }]}
          />
        </View>
      )}

      {(gameNumberLabel || seriesSummary) && (
        <View style={styles.gameInfoRow}>
          {gameNumberLabel && <Text style={styles.gameNumberLabel}>{gameNumberLabel}</Text>}
          {gameNumberLabel && seriesSummary && <View style={styles.divider} />}
          {seriesSummary && <Text style={styles.gameNumberLabel}>{seriesSummary}</Text>}
        </View>
      )}

      {isCanceled ? (
        <Text style={styles.canceled}>Cancelled</Text>
      ) : isFinal ? (
        <Text style={styles.final}>Final</Text>
      ) : null}

      {showLiveInfo && clock ? (
        <>
          <Text style={styles.livePeriod}>
            {isHalftime
              ? "Halftime"
              : endOfPeriod && typeof period === "number"
              ? `End of ${getLivePeriodLabel(period)}`
              : typeof period === "number"
              ? getLivePeriodLabel(period)
              : period}
          </Text>

          {!endOfPeriod && <Text style={styles.clock}>{clock}</Text>}
        </>
      ) : (
        !showLiveInfo && (
          <>
            <Text style={styles.formattedDate}>{formattedDate}</Text>
            {!isFinal && !isCanceled && time && <Text style={styles.time}>{time}</Text>}
          </>
        )
      )}

      {broadcastNetworks && <Text style={styles.broadcast}>{broadcastNetworks}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  logoWrapper: {
    width: 100,
    height: 60,
    position: "relative",
  },
  logo: {
    width: 100,
    height: 60,
    resizeMode: "contain",
    position: "absolute",
    top: 0,
    left: 0,
  },
  gameInfoRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  gameNumberLabel: {
    fontSize: 12,
    fontFamily: Fonts.OSLIGHT,
    color: "#ccc",
  },
  divider: {
    height: 12,
    width: 0.5,
    backgroundColor: "#ccc",
    marginHorizontal: 8,
  },
  canceled: {
    fontSize: 20,
    fontFamily: Fonts.OSBOLD,
    color: "#ff5555",
    marginTop: 6,
  },
  final: {
    fontSize: 20,
    fontFamily: Fonts.OSBOLD,
    color: "#ff4444",
  },
  livePeriod: {
    fontSize: 18,
    fontFamily: Fonts.OSMEDIUM,
    marginTop: 4,
  },
  clock: {
    fontSize: 20,
    fontFamily: Fonts.OSMEDIUM,
    color: "#ff4444",
  },
  formattedDate: {
    fontSize: 16,
    fontFamily: Fonts.OSREGULAR,
    color: "#fff",
  },
  time: {
    fontFamily: Fonts.OSREGULAR,
    color: "#fff",
    fontSize: 16,
  },
  broadcast: {
    fontSize: 12,
    fontFamily: Fonts.OSREGULAR,
    color: "#fff",
    textAlign: "center",
  },
});
