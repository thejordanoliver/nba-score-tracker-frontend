// components/GameDetails/GameInfo.tsx
import { Fonts } from "constants/fonts";
import { useESPNBroadcasts } from "hooks/useESPNBroadcasts";
import { matchBroadcastToGame } from "utils/matchBroadcast";
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
  broadcastNetworks?: string
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
  broadcastNetworks
}: GameInfoProps) {
  const getStyles = styles(isDark); // 👈 call function here

  const renderPlayoffInfo = () => {
    if (!playoffInfo) return null;

    if (Array.isArray(playoffInfo)) {
      return playoffInfo.map((line, index) => (
        <Text
          key={index}
          style={[getStyles.playoffText, { color: colors.text }]}
        >
          {line}
        </Text>
      ));
    }

    return (
      <Text style={[getStyles.playoffText, { color: colors.text }]}>
        {playoffInfo}
      </Text>
    );
  };


  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
  });

  return (
    <View style={getStyles.container}>
      {status === "Scheduled" && (
        <>
          <Text style={[getStyles.date]}>{date}</Text>
          <Text style={[getStyles.time, { color: colors.secondaryText }]}>
            {time}
          </Text>
        </>
      )}

      {status === "In Progress" && (
        <>
          <Text style={[getStyles.period, { color: isDark ? "#fff" : "#000" }]}>
            {period}
          </Text>
          {clock && (
            <Text
              style={[
                getStyles.clock,
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
          <Text style={[getStyles.final, { color: colors.finalText }]}>
            Final
          </Text>
          <Text style={[getStyles.date, { color: colors.secondaryText }]}>
            {formattedDate}
          </Text>
        </>
      )}
      {status === "Canceled" && (
        <>
          <Text style={[getStyles.final, { color: colors.finalText }]}>
            Canceled
          </Text>
          <Text style={[getStyles.date]}>{date}</Text>
        </>
      )}
      {status === "Postponed" && (
        <>
          <Text style={[getStyles.final, { color: colors.finalText }]}>
            Postponed
          </Text>
          <Text style={[getStyles.date, { color: colors.secondaryText }]}>
            {new Date(date).toLocaleDateString("en-US", {
              month: "numeric",
              day: "numeric",
            })}
          </Text>
        </>
      )}

        <Text
          style={{
            fontSize: 10,
            fontFamily: Fonts.OSREGULAR,
            color: colors.secondaryText,
            textAlign: "center",
            marginTop: 2,
          }}
        >
     {broadcastNetworks}
        </Text>
   
      {renderPlayoffInfo()}
    </View>
  );
}

const styles = (isDark: boolean) =>
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
      fontSize: 14,
      fontFamily: Fonts.OSREGULAR,
    },
    period: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 14,
    },
    clock: {
      fontSize: 14,
      fontFamily: Fonts.OSMEDIUM,

      marginTop: 4,
      textAlign: "center",
    },
    final: {
      fontSize: 14,

      fontFamily: Fonts.OSBOLD,
    },
    playoffText: {
      marginTop: 6,
      fontSize: 13,
      fontFamily: Fonts.OSSEMIBOLD,
      textAlign: "center",
    },
  });
