import { Colors } from "constants/styles";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import { customHeaderStyles } from "../../styles/CustomHeaderStyles";
import type { HeaderImageSource, HeaderTeamLike } from "./types";
import { resolveImage } from "./utils";

type TeamBackgroundProps = {
  insets: {
    top: number;
  };
  isDark: boolean;
  selectedTeam?: HeaderTeamLike | null;
  logo?: HeaderImageSource;
  teamColor?: string;
  isTeamScreen: boolean;
  isPlayerScreen?: boolean;
};

export function TeamBackground({
  insets,
  isDark,
  selectedTeam,
  logo,
  teamColor,
  isTeamScreen,
  isPlayerScreen,
}: TeamBackgroundProps) {
  const defaultBackgroundColor = isDark ? Colors.black : Colors.white;
  const { width } = useWindowDimensions();
  const styles = customHeaderStyles(isDark, width);

  if (!(isTeamScreen || isPlayerScreen)) {
    return (
      <View
        style={{
          ...StyleSheet.absoluteFill,
          backgroundColor: defaultBackgroundColor,
          zIndex: -1,
        }}
      />
    );
  }

  const selectedTeamLogo = resolveImage(
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
          ...StyleSheet.absoluteFill,
          backgroundColor: teamColor || defaultBackgroundColor,
          zIndex: -1,
        }}
      />

      {selectedTeamLogo ? (
        <Image source={selectedTeamLogo} style={styles.bgImage} />
      ) : null}
    </View>
  );
}
