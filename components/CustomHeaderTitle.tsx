import TeamInfoBottomSheetNFL from "components/NFL/Team/TeamInfoModal"; // NFL
import TeamInfoBottomSheet from "components/Team/TeamInfoModal"; // NBA
import { Fonts } from "constants/fonts";
import { teams as nbaTeams } from "constants/teams";
import { teams as nflTeams } from "constants/teamsNFL";
import { Ionicons } from "@expo/vector-icons";
import { HeaderTitle } from "@react-navigation/elements";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

type CustomHeaderTitleProps = {
  title?: string;
  playerName?: string;
  tabName?: string;
  onLogout?: () => void;
  onSettings?: () => void;
  onBack?: () => void;
  onCalendarPress?: () => void;
  onToggleLayout?: () => void;
  isGrid?: boolean;
  logo?: any;
  logoLight?: any;
  teamColor?: string;
  isTeamScreen?: boolean;
  transparentColor?: string;
  onSearchToggle?: () => void;
  teamCode?: string;
  homeTeamCode?: string;
  awayTeamCode?: string;
  teamCoach?: string;
  teamHistory?: string;
  isPlayerScreen?: boolean;
  showBackButton?: boolean;
  league?: "NBA" | "NFL";
  isNeutralSite?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

export function CustomHeaderTitle({
  title,
  playerName,
  tabName,
  onLogout,
  onSettings,
  onBack,
  onCalendarPress,
  onToggleLayout,
  isGrid,
  logo,
  logoLight,
  teamColor,
  isTeamScreen = false,
  transparentColor,
  onSearchToggle,
  teamCode,
  homeTeamCode,
  awayTeamCode,
  teamCoach,
  teamHistory,
  isFavorite,
  onToggleFavorite,
  isPlayerScreen,
  showBackButton = true,
  isNeutralSite = false,
  league = "NBA",
}: CustomHeaderTitleProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedTeam =
    league === "NFL"
      ? nflTeams.find((t) => t.code === teamCode)
      : nbaTeams.find((t) => t.code === teamCode);

  const homeTeam =
    league === "NFL"
      ? nflTeams.find((t) => t.code === homeTeamCode)
      : nbaTeams.find((t) => t.code === homeTeamCode);

  const awayTeam =
    league === "NFL"
      ? nflTeams.find((t) => t.code === awayTeamCode)
      : nbaTeams.find((t) => t.code === awayTeamCode);

  const defaultBgColor = isDark ? "#1d1d1d" : "#fff";

  const textStyle: TextStyle = {
    fontFamily: "Oswald_400Regular",
    fontSize: 20,
    color: isDark ? "#fff" : "#1d1d1d",
    textAlign: "center",
  };

  const containerStyle: ViewStyle = {
    width,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  };

  const homeColor = homeTeam?.color || "#aaa";
  const awayColor = awayTeam?.color || "#666";

  const GameHeader = useMemo(() => {
    if (tabName !== "Game" || !homeTeam || !awayTeam) return null;

    const dividerText = isNeutralSite ? "vs" : "@";

    return (
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { flexDirection: "row", zIndex: -10 },
        ]}
      >
        {/* Gradient background */}
        <LinearGradient
          colors={[awayColor, awayColor, homeColor, homeColor]}
          locations={[0, 0.5, 0.5, 1]}
          start={{ x: 0, y: -2 }} // top-left
          end={{ x: 1.08, y: 1.2 }} // more vertical slope, still spans width
          style={{ ...StyleSheet.absoluteFillObject }}
        />

        {/* Away Team Content */}
        <View style={styles.teamHalfWrapper}>
          <View style={styles.teamHalfContent}>
            <Image
              source={
                league === "NFL"
                  ? ["NYG", "NYJ"].includes(awayTeam.code) // Giants/Jets always light
                    ? ((awayTeam as any).logoLight ?? awayTeam.logo)
                    : isDark
                      ? ((awayTeam as any).logoLight500x500 ??
                        (awayTeam as any).logoLight ??
                        awayTeam.logo)
                      : ((awayTeam as any).logo500x500 ?? awayTeam.logo)
                  : isDark
                    ? (awayTeam.logoLight ?? awayTeam.logo)
                    : awayTeam.logo
              }
              style={styles.bgLogo}
              resizeMode="contain"
            />
            <Text style={styles.teamCode}>{awayTeam.code}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.dividerWrapper}>
          <Text style={styles.dividerText}>{dividerText}</Text>
        </View>

        {/* Home Team Content */}
        <View style={styles.teamHalfWrapper}>
          <View style={styles.teamHalfContent}>
            <Image
              source={
                league === "NFL"
                  ? ["NYG", "NYJ"].includes(homeTeam.code)
                    ? ((homeTeam as any).logoLight ?? homeTeam.logo)
                    : isDark
                      ? ((homeTeam as any).logoLight500x500 ??
                        (homeTeam as any).logoLight ??
                        homeTeam.logo)
                      : ((homeTeam as any).logo500x500 ?? homeTeam.logo)
                  : isDark
                    ? (homeTeam.logoLight ?? homeTeam.logo)
                    : homeTeam.logo
              }
              style={styles.bgLogo}
              resizeMode="contain"
            />
            <Text style={styles.teamCode}>{homeTeam.code}</Text>
          </View>
        </View>
      </View>
    );
  }, [
    homeTeam,
    awayTeam,
    awayColor,
    homeColor,
    tabName,
    isDark,
    league,
    isNeutralSite,
  ]);

  return (
    <View style={{ paddingTop: insets.top, height: 56 + insets.top }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          height: insets.top,
          width: "100%",
          backgroundColor: defaultBgColor,
          zIndex: -1,
        }}
      />

      {isTeamScreen || isPlayerScreen ? (
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
              backgroundColor: teamColor || defaultBgColor,
              zIndex: -1,
            }}
          />
          {selectedTeam?.logo && (
            <Image
              source={selectedTeam.logo}
              style={{
                height: 200,
                width: "100%",
                resizeMode: "contain",
                opacity: 0.25,
                position: "absolute",
                top: -70,
                zIndex: 0,
              }}
            />
          )}
        </View>
      ) : (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: defaultBgColor,
            zIndex: -1,
          }}
        />
      )}

      <View style={[containerStyle, { zIndex: 2 }]}>
        {tabName === "Profile" ? (
          <TouchableOpacity onPress={onLogout}>
            <Ionicons
              name="log-out-outline"
              size={24}
              color={isDark ? "#fff" : "#1d1d1d"}
            />
          </TouchableOpacity>
        ) : showBackButton && onBack ? (
          <TouchableOpacity onPress={onBack}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={
                tabName === "Game"
                  ? "#fff"
                  : isTeamScreen
                    ? "#fff"
                    : isDark
                      ? "#fff"
                      : "#1d1d1d"
              }
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}

        {tabName === "Game" && GameHeader ? (
          GameHeader
        ) : playerName ? (
          <HeaderTitle style={textStyle}></HeaderTitle>
        ) : title ? (
          <HeaderTitle style={textStyle}>{title}</HeaderTitle>
        ) : (
          <View style={{ width: 36, height: 36 }} />
        )}

        {isTeamScreen ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {onToggleFavorite && (
              <TouchableOpacity
                onPress={onToggleFavorite}
                style={{ padding: 8, marginRight: 8 }}
              >
                <Ionicons
                  name={isFavorite ? "star" : "star-outline"}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            )}

            {!isPlayerScreen && (
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={{ padding: 8 }}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            )}

            {league === "NFL" ? (
              <TeamInfoBottomSheetNFL
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                teamId={selectedTeam?.id?.toString()}
              />
            ) : (
              <TeamInfoBottomSheet
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                teamId={selectedTeam?.id?.toString()}
              />
            )}
          </View>
        ) : tabName === "Profile" && onSettings ? (
          <TouchableOpacity onPress={onSettings}>
            <Ionicons
              name="settings-outline"
              size={24}
              color={isDark ? "#fff" : "#1d1d1d"}
            />
          </TouchableOpacity>
        ) : tabName === "League" && onCalendarPress ? (
          <TouchableOpacity onPress={onCalendarPress}>
            <Ionicons
              name="calendar-outline"
              size={24}
              color={isDark ? "#fff" : "#1d1d1d"}
            />
          </TouchableOpacity>
        ) : tabName === "Explore" && onSearchToggle ? (
          <TouchableOpacity onPress={onSearchToggle}>
            <Ionicons
              name="search"
              size={24}
              color={isDark ? "#fff" : "#1d1d1d"}
            />
          </TouchableOpacity>
        ) : onToggleLayout !== undefined ? (
          <TouchableOpacity onPress={onToggleLayout}>
            <Ionicons
              name={isGrid ? "list" : "grid"}
              size={22}
              color={isDark ? "#fff" : "#000"}
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  teamSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  teamLogo: {
    width: 24,
    height: 24,
    marginBottom: 2,
  },
  teamText: {
    color: "#fff",
    fontFamily: Fonts.OSBOLD,
    fontSize: 14,
  },
  teamHalf: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  teamHalfWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative", // container for skewed bg + content
    overflow: "hidden",
  },

  teamHalfAway: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ skewX: "10deg" }], // keep this
    width: width * 1.15,
    marginLeft: -width * 0.075,
  },

  teamHalfHome: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ skewX: "10deg" }], // change from -10deg to 10deg
    width: width * 1.15,
    marginLeft: -width * 0.075, // use same marginLeft so they align
  },

  teamHalfContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  bgLogo: {
    position: "absolute",
    width: "100%",
    height: 200,
    opacity: 0.15,
    alignSelf: "center",
    marginTop: 10,
  },
  teamCode: {
    color: "#fff",
    fontFamily: Fonts.OSBOLD,
    fontSize: 24,
    zIndex: 2,
  },
  dividerWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  dividerText: {
    color: "#fff",
    fontFamily: Fonts.OSBOLD,
    fontSize: 24,
  },
});