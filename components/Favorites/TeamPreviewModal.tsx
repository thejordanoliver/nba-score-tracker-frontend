import { getWCBBTeamLogo } from "@/constants/teamsWCBB";
import { Team } from "@/types/types";
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
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
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
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = teamPreviewModalStyles(isDark);

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.85);
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
    }
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
    ? team?.secondaryColor || Colors.midTone
    : team?.color || Colors.midTone;

  const est =
    typeof team.established === "string" || typeof team.established === "number"
      ? team.established
      : "-";

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.container}>
        <BlurView intensity={40} tint="dark" style={styles.blurViewContainer}>
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
              <BlurView
                intensity={100}
                tint={"systemMaterial"}
                style={styles.blurViewWrapper}
              >
                {logo && (
                  <Image
                    source={logo}
                    style={styles.teamLogo}
                    resizeMode="contain"
                  />
                )}

                <Text
                  style={styles.teamName}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.5}
                >
                  {team.fullName ?? team.name ?? team.shortName}
                </Text>

                <Text style={styles.establishedText}>EST. {est}</Text>

                <Text style={styles.subText}>Tap below to view team page</Text>

                {/* Go To Team */}
                <Button onPress={onGo} style={styles.goButton} isDark={isDark}>
                  <Text style={styles.goText}>Go to Team</Text>
                </Button>

                {/* Remove Favorite */}
                {onRemove && currentUser && (
                  <Button
                    onPress={() => onRemove(team)}
                    style={styles.removeButton}
                    isDark={isDark}
                  >
                    <Text style={styles.removeText}>Remove from Favorites</Text>
                  </Button>
                )}
              </BlurView>
            </Animated.View>
          </LinearGradient>
        </BlurView>
      </Pressable>
    </Modal>
  );
}
