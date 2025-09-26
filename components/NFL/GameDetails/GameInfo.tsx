import { Fonts } from "constants/fonts";
import { useNFLGameBroadcasts } from "hooks/NFLHooks/useNFLGameBroadcasts";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { NFLTeam } from "types/nfl";

type NFLGameCenterInfoProps = {
  status: string; // <- allow any string now
  date: string;
  time: string;
  period?: string;
  clock?: string;
  downAndDistance?: string;
  colors: Record<string, string>;
  isDark: boolean;
  playoffInfo?: string | string[];
  homeTeam: NFLTeam;
  awayTeam: NFLTeam;
};


export function NFLGameCenterInfo({
  status,
  date,
  time,
  period,
  clock,
  downAndDistance,
  colors,
  isDark,
  homeTeam,
  awayTeam,
}: NFLGameCenterInfoProps) {
  const { broadcasts, loading } = useNFLGameBroadcasts(
    homeTeam.code,
    awayTeam.code,
    date
  );

  // ⏱ force refresh trigger every 30 seconds
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (status === "In Progress" || status === "Halftime") {
      const interval = setInterval(() => {
        setTick((t) => t + 1); // triggers re-render
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [status]);

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

  let displayBroadcasts: string[] = [];
  if (!loading && broadcasts.length > 0) {
    const allNames = broadcasts.flatMap((b) => b.names);
    if (allNames.includes("ABC") && allNames.includes("ESPN")) {
      displayBroadcasts = ["ABC/ESPN"];
    } else {
      displayBroadcasts = [allNames[0]];
    }
  }

  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      {/* Scheduled */}
      {status === "Scheduled" && (
        <>
          <Text style={styles.date}>{date || "TBD"}</Text>
          <Text style={styles.time}>{time || ""}</Text>
        </>
      )}

      {/* In Progress */}
      {status === "In Progress" && (
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Text style={styles.date}>
              {period ? formatQuarter(period) : ""}
            </Text>
            <View style={styles.divider}/>
            {clock && <Text style={styles.clock}>{clock}</Text>}
          </View>
          {downAndDistance && (
            <Text style={styles.downAndDistance}>{downAndDistance}</Text>
          )}
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

      {/* Broadcasts */}
      {(status === "In Progress" || status === "Halftime") &&
        displayBroadcasts.length > 0 && (
          <View>
            {displayBroadcasts.map((b, i) => (
              <Text key={i} style={styles.broadcasts}>
                {b}
              </Text>
            ))}
          </View>
        )}
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
  });
