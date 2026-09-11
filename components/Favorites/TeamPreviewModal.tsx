import { getWCBBTeamLogo } from "@/constants/teamsWCBB";
import { Team } from "@/types/types";
import { supportsLiquidGlass } from "@/utils/glass";
import { Colors } from "constants/styles";
import { getNBATeamLogo } from "constants/teams";
import { getCBBTeamLogo } from "constants/teamsCBB";
import { getCFBTeamLogo } from "constants/teamsCFB";
import { getMLBTeamLogo } from "constants/teamsMLB";
import { getNFLTeamLogo } from "constants/teamsNFL";
import { getNHLTeamLogo } from "constants/teamsNHL";
import { getWNBATeamLogo } from "constants/teamsWNBA";
import { usePreferences } from "contexts/PreferencesContext";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Animated, Easing, Image, Modal, Pressable, Text } from "react-native";
import { teamPreviewModalStyles } from "styles/TeamStyles/TeamPreviewModalStyles";
import Button from "../Buttons/Button";
type Props = {
  visible: boolean;
  team: Team;
  onClose: () => void;
  onGo: () => void;
  onRemove?: (team: Team) => void;
  currentUser?: boolean;
};
export default function TeamPreviewModal({
  visible,
  team,
  onClose,
  onGo,
  onRemove,
  currentUser,
}: Props) {
  const liquid = supportsLiquidGlass();
  const [scaleAnim] = useState(() => new Animated.Value(0.85));
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = teamPreviewModalStyles(isDark);
  useEffect(() => {
    if (!visible) {
      return;
    }
    scaleAnim.setValue(0.85);
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  }, [scaleAnim, visible]);
  const isNBA = team.league === "nba";
  const isWNBA = team.league === "wnba";
  const isWCBB = team.league === "wcbb";
  const isCBB = team.league === "cbb";
  const isMLB = team.league === "mlb";
  const isNFL = team.league === "nfl";
  const isCFB = team.league === "cfb";
  const isNHL = team.league === "nhl";
  const logo =
    team.id == null
      ? null
      : isCBB
        ? getCBBTeamLogo(team.id, isDark)
        : isWCBB
          ? getWCBBTeamLogo(team.id, isDark)
          : isNBA
            ? getNBATeamLogo(team.id, isDark)
            : isWNBA
              ? getWNBATeamLogo(team.id, isDark)
              : isCFB
                ? getCFBTeamLogo(team.id, isDark)
                : isNFL
                  ? getNFLTeamLogo(team.id, isDark)
                  : isMLB
                    ? getMLBTeamLogo(team.id, isDark)
                    : isNHL
                      ? getNHLTeamLogo(team.id, isDark)
                      : null;
  const baseColor = isDark
    ? team.secondaryColor || Colors.midTone
    : team.color || Colors.midTone;
  const established =
    typeof team.established === "string" || typeof team.established === "number"
      ? team.established
      : "-";
  const innerContent = (
    <>
      {logo && (
        <Image source={logo} style={styles.teamLogo} resizeMode="contain" />
      )}
      <Text style={styles.teamName}>
        {team.fullName ?? team.name ?? team.shortName}
      </Text>
      <Text style={styles.establishedText}> EST. {established} </Text>
      <Button onPress={onGo} style={styles.goButton} isDark={isDark}>
        <Text style={styles.goText}> Go to Team </Text>
      </Button>
      {onRemove && currentUser && (
        <Button
          onPress={() => onRemove(team)}
          style={styles.removeButton}
          isDark={isDark}
        >
          <Text style={styles.removeText}> Remove from Favorites </Text>
        </Button>
      )}
    </>
  );
  const teamCard = (
    <LinearGradient
      colors={
        isDark
          ? [baseColor, "rgba(50,50,50,0.5)"]
          : [team.color || Colors.midTone, Colors.transparentMidTone]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.5 }}
      style={styles.linearGradient}
    >
      <Animated.View
        style={{
          borderTopLeftRadius: 18.5,
          borderTopRightRadius: 18.5,
          overflow: "hidden",
          transform: [{ scale: scaleAnim }],
          backgroundColor: "transparent",
        }}
      >
        {liquid ? (
          <GlassView style={styles.blurViewWrapper} glassEffectStyle="clear">
            {innerContent}
          </GlassView>
        ) : (
          <BlurView intensity={100} style={styles.blurViewWrapper}>
            {innerContent}
          </BlurView>
        )}
      </Animated.View>
    </LinearGradient>
  );
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} style={styles.container}>
        <BlurView intensity={40} style={styles.blurViewContainer}>
          {teamCard}
        </BlurView>
      </Pressable>
    </Modal>
  );
}
