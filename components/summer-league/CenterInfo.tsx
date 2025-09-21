import { Fonts } from "constants/fonts";
import { Text, useColorScheme, View } from "react-native";
import { getStyles } from "../../../../Downloads/nba-score-tracker/styles/SLGameCard.styles";

type CenterInfoProps = {
  isFinal: boolean;
  broadcastNetworks?: string;
  showLiveInfo: boolean;
  period: number | string;
  clock?: string | null;
  formattedDate: string;
  isDark: boolean;
  startTime?: string; // Optional start time (for not started games)
};

export default function CenterInfo({
  isFinal,
  broadcastNetworks,
  showLiveInfo,
  period,
  clock,
  formattedDate,
  isDark,
  startTime,
}: CenterInfoProps) {
  // Use color scheme hook if isDark prop not provided
  const dark = isDark ?? useColorScheme() === "dark";
  const styles = getStyles(dark);

  return (
    <View style={{ alignItems: "center" }}>
      {/* Show "Final" when game is finished */}
      {isFinal && (
        <Text
          style={{
            fontSize: 20,
            fontFamily: Fonts.OSBOLD,
            color: dark ? "#ff5555" : "#cc0000",
            marginTop: 6,
          }}
        >
          Final
        </Text>
      )}

      {/* Optional broadcast network info */}
      {broadcastNetworks && (
        <Text
          style={{
            fontSize: 12,
            fontFamily: Fonts.OSREGULAR,
            color: dark ? "#aaa" : "#444",
            marginTop: 4,
            textAlign: "center",
          }}
        >
          {broadcastNetworks}
        </Text>
      )}

      {/* Show live game period and clock if live */}
      {showLiveInfo && clock ? (
        <>
          <Text
            style={{
              fontSize: 18,
              fontFamily: Fonts.OSMEDIUM,
              color: dark ? "#fff" : "#000",
              marginTop: 4,
            }}
          >
            {typeof period === "number" ? `Q${period}` : period}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontFamily: Fonts.OSMEDIUM,
              color: dark ? "#fff" : "#000",
            }}
          >
            {clock}
          </Text>
        </>
      ) : (
        <>
          {/* Otherwise show date */}
          <Text style={styles.date}>{formattedDate}</Text>
          {/* Show start time if provided and game hasn't started */}
          {startTime && <Text style={styles.time}>{startTime}</Text>}
        </>
      )}
    </View>
  );
}
