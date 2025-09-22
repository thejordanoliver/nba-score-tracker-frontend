import { Team } from "types/types";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  Text,
  useColorScheme,
} from "react-native";
import { Fonts } from "constants/fonts";

type Props = {
  visible: boolean;
  team: Team;
  onClose: () => void;
  onGo: () => void;
  onRemove?: (teamId: string) => void; // optional remove callback
};

export default function TeamPreviewModal({
  visible,
  team,
  onClose,
  onGo,
  onRemove,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
  }, [visible]);

  const specialTeams = [
    "Brooklyn Nets",
    "Los Angeles Lakers",
    "Milwaukee Bucks",
    "Washington Wizards",
    "Golden State Warriors",
    "Denver Nuggets",
    "Dallas Mavericks",
    "Indiana Pacers",
    "Memphis Grizzlies",
    "Phoenix Suns",
    "San Antonio Spurs",
    "Utah Jazz",
    "Philadelphia 76ers",
    "New York Knicks",
    "New Orleans Pelicans",
    "Oklahoma City Thunder",
  ];

  const logoLightTeams = [
    "Houston Rockets",
    "Philadelphia 76ers",
    "Toronto Raptors",
    "Utah Jazz",
  ];

  const teamName = team?.fullName?.trim() ?? "";
  const useSecondary = specialTeams.includes(teamName);
  const useLogoLight = logoLightTeams.includes(teamName);
  const light = useLogoLight ? team?.logoLight : team?.logo;
  const baseColor = useSecondary
    ? team?.secondaryColor || "#444"
    : team?.color || "#444";

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <Pressable onPress={onClose} style={{ flex: 1 }}>
        <BlurView
          intensity={40}
          tint="dark"
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <LinearGradient
            colors={
              isDark
                ? [baseColor, "rgba(50,50,50,0.5)"]
                : [team.color || "#444", "rgba(200,200,200,0.4)"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.5 }}
            style={{
              marginTop: "auto",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 1.5,
            }}
          >
            <Animated.View
              style={{
                borderTopLeftRadius: 18.5,
                borderTopRightRadius: 18.5,
                overflow: "hidden",
                transform: [{ scale: scaleAnim }],
                backgroundColor: "transparent", // IMPORTANT: allow BlurView to shine through
              }}
            >
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={{
                  borderTopLeftRadius: 18.5,
                  borderTopRightRadius: 18.5,
                  paddingHorizontal: 20,
                  paddingVertical: 40,
                  backgroundColor: "rgba(255,255,255,0.05)", // optional subtle fog
                }}
              >
                <Image
                  source={isDark ? light : team.logo}
                  style={{ width: 60, height: 60, marginBottom: 10 }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: Fonts.OSSEMIBOLD,
                    color: isDark ? "#fff" : "#1d1d1d",
                  }}
                >
                  {team.fullName}
                </Text>
                <Text
                  style={{
                    marginBottom: 12,
                    fontFamily: Fonts.OSREGULAR,
                    color: isDark ? "#fff" : "#1d1d1d",
                  }}
                >
                  EST. {team.firstSeason}{" "}
                </Text>
                <Text
                  style={{
                    marginVertical: 12,
                    fontFamily: Fonts.OSEXTRALIGHT,
                    color: isDark ? "#fff" : "#1d1d1d",
                  }}
                >
                  Tap below to view team page
                </Text>

                <Pressable
                  onPress={onGo}
                  style={{
                    backgroundColor: isDark ? "#fff" : "#1d1d1d",
                    padding: 16,
                    borderRadius: 10,
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      color: isDark ? "#1d1d1d" : "#fff",
                      fontFamily: Fonts.OSSEMIBOLD,
                    }}
                  >
                    Go to Team
                  </Text>
                </Pressable>

                {onRemove && (
                  <Pressable
                    onPress={async () => {
                      if (onRemove) {
                        await onRemove(team.id);
                      }
                      onClose();
                    }}
                    style={{
                      backgroundColor: "#ff3b30",
                      padding: 16,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontFamily: Fonts.OSSEMIBOLD }}>
                      Remove from Favorites
                    </Text>
                  </Pressable>
                )}
              </BlurView>
            </Animated.View>
          </LinearGradient>
        </BlurView>
      </Pressable>
    </Modal>
  );
}
