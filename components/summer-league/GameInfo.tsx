// components/GameDetails/GameInfo.tsx
import { useESPNBroadcasts } from "hooks/useESPNBroadcasts";
import { matchBroadcastToGame } from "utils/matchBroadcast";
import { StyleSheet, Text, View } from "react-native";
import { Fonts } from "constants/fonts";

type GameInfoProps = {
  status: string; // Allow string here to handle variants
  date: string;
  time?: string;
  period?: string;
  clock?: string;
  colors: Record<string, string>;
  isDark: boolean;
  playoffInfo?: string | string[];
  homeTeam: string;
  awayTeam: string;
  isSummerLeague?: boolean;
};

export function GameInfo({
  status,
  date,
  time,
  period,
  clock,
  colors,
  isDark,
  playoffInfo,
  homeTeam,
  awayTeam,
}: GameInfoProps) {
  const { broadcasts } = useESPNBroadcasts();

  // Normalize status to handle "Final" and "Game Finished" as final statuses
  const normalizedStatus =
    status === "Final" || status === "Game Finished" ? "Final" : status;

  const matched = matchBroadcastToGame(
    {
      date,
      home: { name: homeTeam },
      away: { name: awayTeam },
    },
    broadcasts
  );

  const networkString = matched?.broadcasts
    ?.map((b) => b.network)
    .filter(Boolean)
    .join(", ");

  const renderPlayoffInfo = () => {
    if (!playoffInfo) return null;

    if (Array.isArray(playoffInfo)) {
      return playoffInfo.map((line, index) => (
        <Text key={index} style={[styles.playoffText, { color: colors.text }]}>
          {line}
        </Text>
      ));
    }

    return (
      <Text style={[styles.playoffText, { color: colors.text }]}>
        {playoffInfo}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {normalizedStatus === "Scheduled" && (
        <>
          <Text style={[styles.date, { color: colors.secondaryText }]}>
            {date}
          </Text>
          <Text style={[styles.time, { color: colors.secondaryText }]}>
            {time}
          </Text>
        </>
      )}

      {normalizedStatus === "In Progress" && (
        <>
          <Text style={[styles.period, { color: isDark ? "#fff" : "#000" }]}>
            {period}
          </Text>
          {clock && (
            <Text
              style={[
                styles.clock,
                {
                  color: isDark ? "#ff6b00" : "#d35400",
                },
              ]}
            >
              {clock}
            </Text>
          )}
        </>
      )}

      {normalizedStatus === "Final" && (
        <>
          <Text style={[styles.final, { color: colors.finalText }]}>Final</Text>
          <Text style={[styles.date, { color: colors.secondaryText }]}>
            {date}
          </Text>
          {networkString && (
            <Text
              style={{
                fontSize: 10,
                fontFamily: Fonts.OSREGULAR,
                color: colors.secondaryText,
                textAlign: "center",
              }}
              accessibilityLabel="Broadcast Networks"
            >
              {networkString}
            </Text>
          )}
        </>
      )}

      {renderPlayoffInfo()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    marginBottom: 8,
  },
  summer: {
    fontSize: 14,
    fontFamily: Fonts.OSEXTRALIGHT,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    fontFamily: Fonts.OSREGULAR,
  },
  time: {
    fontSize: 14,
    fontFamily: Fonts.OSREGULAR,
  },
  period: {
    fontFamily: "Oswald_500Medium",
    fontSize: 14,
  },
  clock: {
    fontSize: 14,
    fontFamily: "Oswald_500Medium",
    fontWeight: "bold",
    marginTop: 4,
    textAlign: "center",
  },
  final: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: Fonts.OSBOLD,
  },
  playoffText: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: Fonts.OSSEMIBOLD,
    textAlign: "center",
  },
});
