import { Colors } from "constants/styles";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import { customHeaderStyles } from "../../styles/CustomHeaderStyles";
import type { HeaderImageSource, HeaderTeamLike } from "./types";
import { resolveImage } from "./utils";
type ConferenceBackgroundProps = {
  insets: {
    top: number;
  };
  isDark: boolean;
  selectedTeam?: HeaderTeamLike | null;
  logo?: HeaderImageSource;
  conferenceColor?: string;
  isConferenceScreen: boolean;
};

export function ConferenceBackground({
  insets,
  isDark,
  selectedTeam,
  logo,
  conferenceColor,
  isConferenceScreen,
}: ConferenceBackgroundProps) {
  const defaultBackgroundColor = isDark ? Colors.black : Colors.white;
  const { width } = useWindowDimensions();
  const styles = customHeaderStyles(isDark, width);

  if (!isConferenceScreen) {
    return (
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: defaultBackgroundColor,
          zIndex: -1,
        }}
      />
    );
  }

  const conferenceLogoSource = resolveImage(
    selectedTeam?.logoLight ?? selectedTeam?.logo ?? logo,
  );

  return (
    <View
      style={{
        position: "absolute",
        top: insets.top,
        height: 56,
        width: "100%",
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: conferenceColor || defaultBackgroundColor,
          zIndex: -1,
        }}
      />

      {conferenceLogoSource ? (
        <Image source={conferenceLogoSource} style={styles.bgImage} />
      ) : null}
    </View>
  );
}
