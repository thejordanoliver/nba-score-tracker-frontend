// components/GameDetails/GameInfo.tsx
import { Fonts } from "constants/fonts";
import { StyleSheet, Text, View } from "react-native";

type GameInfoProps = {
  status: "Scheduled" | "In Progress" | "Final" | "Canceled" | "Postponed"; // ← added "Canceled"
  date: string;
  time: string;
  period?: string;
  clock?: string;
  colors: Record<string, string>;
  isDark: boolean;
  playoffInfo?: string | string[];
  homeTeam: string;
  awayTeam: string;
  broadcastNetworks?: string;
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
  broadcastNetworks,
}: GameInfoProps) {
  const styles = getStyles(isDark); // 👈 call function here

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

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
  });

  return (
    <View style={styles.container}>
      {status === "Scheduled" && (
        <>
          <Text style={[styles.date]}>{date}</Text>
          <Text style={[styles.time, { color: colors.secondaryText }]}>
            {time}
          </Text>
        </>
      )}

      {status === "In Progress" && (
        <>
          <Text style={[styles.date, { color: isDark ? "#fff" : "#000" }]}>
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

      {status === "Final" && (
        <>
          <Text style={[styles.finalText, { color: colors.finalText }]}>
            Final
          </Text>
          <Text style={[styles.dateFinal, { color: colors.secondaryText }]}>
            {formattedDate}
          </Text>
        </>
      )}
      {status === "Canceled" && (
        <>
          <Text style={[styles.finalText, { color: colors.finalText }]}>
            Canceled
          </Text>
          <Text style={[styles.date]}>{date}</Text>
        </>
      )}
      {status === "Postponed" && (
        <>
          <Text style={[styles.finalText, { color: colors.finalText }]}>
            Postponed
          </Text>
          <Text style={[styles.date, { color: colors.secondaryText }]}>
            {new Date(date).toLocaleDateString("en-US", {
              month: "numeric",
              day: "numeric",
            })}
          </Text>
        </>
      )}

      <Text style={styles.broadcasts}>{broadcastNetworks}</Text>

      {renderPlayoffInfo()}
    </View>
  );
}

export const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      justifyContent: "center",
      alignItems: "center",
      marginHorizontal: 8,
      marginBottom: 8,
    },
    date: {
      fontFamily: Fonts.OSMEDIUM,
      color: isDark ? "#fff" : "#1d1d1d",
      fontSize: 14,
    },
    time: {
      fontFamily: Fonts.OSREGULAR,
      color: isDark ? "#aaa" : "#555",
      fontSize: 12,
    },
    broadcasts: {
      fontSize: 10,
      fontFamily: Fonts.OSREGULAR,
      color: isDark ? "#aaa" : "#555",
      textAlign: "center",
    },
    clock: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 14,
      color: isDark ? "#ff4444" : "#cc0000",
      textAlign: "center",
    },
    downAndDistance: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 12,
      color: isDark ? "#aaa" : "#555",
      marginTop: 2,
      textAlign: "center",
    },
    dateFinal: {
      fontFamily: Fonts.OSREGULAR,
      color: isDark ? "rgba(255,255,255, 1)" : "rgba(0, 0, 0, .5)",
      fontSize: 14,
    },
    finalText: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 16,
      color: isDark ? "#ff4444" : "#cc0000",
      textAlign: "center",
    },
    divider: {
      height: 14,
      width: 1,
      backgroundColor: isDark ? "rgba(255,255,255, 1)" : "rgba(0, 0, 0, .5)",
    },
    playoffContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    playoffText: {
      fontSize: 13,
      color: isDark ? "#fff" : "#1d1d1d",
      fontFamily: Fonts.OSEXTRALIGHT,
      textAlign: "center",
    },
  });
