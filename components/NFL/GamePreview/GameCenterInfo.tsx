import { Fonts } from "constants/fonts";
import { NFLTeam } from "types/nfl";

import { useNFLGameBroadcasts } from "hooks/NFLHooks/useNFLGameBroadcasts";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type NFLGameCenterInfoProps = {
  status:
    | "Scheduled"
    | "In Progress"
    | "Final"
    | "Canceled"
    | "Postponed"
    | "Delayed"
    | "Halftime";
  date: string;
  time: string;
  period?: string;
  clock?: string;
  colors: Record<string, string>;
  isDark: boolean;
  playoffInfo?: string | string[];
  homeTeam: NFLTeam;
  awayTeam: NFLTeam;
  lighter: boolean;
  apiDate?: string; // ✅ add this
};

export function NFLGameCenterInfo({
  status,
  date,
  time,
  period,
  clock,
  colors,
  isDark,
  homeTeam,
  awayTeam,
  lighter,
  apiDate, // ✅ now available
}: NFLGameCenterInfoProps) {
  const { broadcasts, loading, error } = useNFLGameBroadcasts(
    homeTeam.code,
    awayTeam.code,
    apiDate // ✅ use API date
  );
  // console.log("broadcasts for", homeTeam.code, awayTeam.code, apiDate, broadcasts);

  const formatQuarter = useMemo(
    () => (short: string) => {
      switch (short) {
        case "Q1":
          return "1st";
        case "Q2":
          return "2nd";
        case "Q3":
          return "3rd";
        case "Q4":
          return "4th";
        case "OT":
          return "OT";
        default:
          return short;
      }
    },
    []
  );

  const styles = getStyles(isDark);
  const dateColor = lighter ? "#fff" : isDark ? "#fff" : "#000";
  const timeColor = lighter ? "#aaa" : isDark ? "#333" : "#888";
  const broadcastColor = lighter ? "#aaa" : isDark ? "#333" : "#888";
  const dividerColor = lighter ? "#bbb" : isDark ? "#888" : "#888";

  return (
    <View style={styles.container}>
      {/* Scheduled */}
      {status === "Scheduled" && (
        <>
          <Text style={[styles.date, { color: dateColor }]}>
            {date || "TBD"}
          </Text>
          <Text style={[styles.time, { color: timeColor }]}>{time || ""}</Text>
        </>
      )}
      {/* In Progress */}
      {status === "In Progress" && (
        <>
          <Text style={styles.date}>{period ? formatQuarter(period) : ""}</Text>
          {clock && <Text style={styles.clock}>{clock}</Text>}
          {broadcasts.slice(0, 1).map((b, i) => (
            <Text
              key={i}
              style={[styles.broadcasts, { color: broadcastColor }]}
            >
              {b.names.join("/")}
            </Text>
          ))}
        </>
      )}
      {/* Halftime */}
      {status === "Halftime" && <Text style={styles.date}>Halftime</Text>}
      {/* Final */}
      {status === "Final" && (
        <>
          <Text style={styles.finalText}>Final</Text>
          <Text style={styles.dateFinal}>{date || ""}</Text>
        </>
      )}
      {/* Canceled, Postponed, Delayed */}
      {(status === "Canceled" ||
        status === "Postponed" ||
        status === "Delayed") && <Text style={styles.finalText}>{status}</Text>}
      {!loading && broadcasts.length > 0 && <View></View>}
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
      fontSize: 20,
    },
    time: {
      fontSize: 14,
      fontFamily: Fonts.OSREGULAR,
      color: isDark ? "#fff" : "#444",
    },
    broadcasts: {
      fontSize: 10,
      fontFamily: Fonts.OSREGULAR,
      color: isDark ? "#aaa" : "#444",
    },
    period: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 14,
      color: "#fff",
    },
    clock: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 14,
      color: "#ff4444",
      marginTop: 4,
      textAlign: "center",
    },

    final: {
      fontSize: 14,
      fontFamily: Fonts.OSBOLD,
    },

    dateFinal: {
      fontFamily: Fonts.OSREGULAR,
      color: "rgba(255,255,255, .5)",
      fontSize: 16,
    },
    finalText: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 20,
      color: "#ff4444",
      textAlign: "center",
    },
  });
