// ./NFL/GamePreview/NFLGameCenterInfo.tsx
import { Fonts } from "constants/fonts";
import { useNFLGameBroadcasts } from "hooks/NFLHooks/useNFLGameBroadcasts";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { NFLTeam } from "types/nfl";

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
  week: string;
  time: string;
  period?: string;
  clock?: string;
  colors: Record<string, string>;
  isDark: boolean;
  playoffInfo?: string | string[];
  homeTeam: NFLTeam;
  awayTeam: NFLTeam;
  lighter: boolean;
  apiDate?: string;
  downAndDistance: string;
  isPlayoff: boolean;
};

export function NFLGameCenterInfo({
  status,
  week,
  date,
  time,
  period,
  clock,
  colors,
  isDark,
  homeTeam,
  awayTeam,
  lighter,
  apiDate,
  downAndDistance,
  isPlayoff,
}: NFLGameCenterInfoProps) {
  const { broadcasts, loading } = useNFLGameBroadcasts(
    homeTeam.code,
    awayTeam.code,
    apiDate
  );

  // ✅ handles quarters & OT
  const formatQuarter = useMemo(
    () => (short: string) => {
      if (!short) return "";
      const map: Record<string, string> = {
        Q1: "1st",
        Q2: "2nd",
        Q3: "3rd",
        Q4: "4th",
        OT: "OT",
        HT: "Halftime",
        FT: "Final",
        AOT: "Final/OT",
      };

      // Handle OT variations like OT1, OT2, 2OT
      if (short.toUpperCase().startsWith("OT")) {
        const num = short.replace(/[^0-9]/g, "");
        return num ? `${num}OT` : "OT";
      }

      return map[short] ?? short;
    },
    []
  );

  // ✅ detect OT for Final state
  const wentOT =
    (period && period.toUpperCase().includes("OT")) ||
    (status && ["AOT"].includes(status as string));

  const styles = getStyles(isDark);
  const dateColor = lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d";
  const timeColor = lighter ? "#fff" : isDark ? "#333" : "#888";
  const broadcastColor = lighter ? "#fff" : isDark ? "#333" : "#888";

  return (
    <View style={styles.container}>
      {isPlayoff && <Text style={styles.gameTitle}>{week}</Text>}
      {/* Scheduled */}
      {status === "Scheduled" && (
        <>
          <Text style={[styles.date, { color: dateColor }]}>
            {date || "TBD"}
          </Text>
          <Text style={[styles.time, { color: timeColor }]}>{time || ""}</Text>
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
            <View style={styles.divider} />
            {clock && <Text style={styles.clock}>{clock}</Text>}
          </View>
          {downAndDistance && (
            <Text style={styles.downAndDistance}>{downAndDistance}</Text>
          )}
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
      {status === "Halftime" && (
        <>
          <Text style={styles.date}>Halftime</Text>
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

      {/* Final */}
      {status === "Final" && (
        <>
          <Text style={styles.finalText}>{wentOT ? "Final/OT" : "Final"}</Text>
          <Text style={[styles.date, { color: dateColor }]}>{date || ""}</Text>
        </>
      )}

      {/* Canceled, Postponed, Delayed */}
      {(status === "Canceled" ||
        status === "Postponed" ||
        status === "Delayed") && <Text style={styles.finalText}>{status}</Text>}
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
      fontSize: 16,
      fontFamily: Fonts.OSREGULAR,
      color: "#fff",
    },
    time: {
      fontFamily: Fonts.OSREGULAR,
      color: "#fff",
      fontSize: 16,
    },
    broadcasts: {
      fontSize: 14,
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
      fontSize: 16,
      color: "#ff4444",
      textAlign: "center",
    },
    downAndDistance: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 14,
      color: isDark ? "#aaa" : "#555",
      marginTop: 2,
      textAlign: "center",
    },
    final: {
      fontSize: 14,
      fontFamily: Fonts.OSBOLD,
    },
    finalText: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 20,
      color: "#ff4444",
      textAlign: "center",
    },
    divider: {
      height: 16,
      width: 1,
      backgroundColor: isDark ? "rgba(255,255,255, 1)" : "rgba(0, 0, 0, .5)",
    },
    gameTitle: {
      position: "absolute",
      top: -40,
      width: 200,
      textAlign: "center",
      fontSize: 20,
      fontFamily: Fonts.OSEXTRALIGHT,
      color: "#fff",
    },
  });
