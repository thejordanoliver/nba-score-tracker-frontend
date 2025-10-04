import { Fonts } from "constants/fonts";
import { Image, StyleSheet, Text, View } from "react-native";

type Props = {
  player: {
    first_name: string;
    last_name: string;
    college?: string;
    height?: string;
    weight?: string;
    birth_date?: string;
    position?: string;
    jersey_number?: string;
  };
  avatarUrl?: string;
  isDark: boolean;
  teamColor?: string;
  teamSecondaryColor?: string; // new optional prop for secondary color
  team_name?: string;
  age?: number;
};

export default function PlayerHeader({
  player,
  avatarUrl,
  isDark,
  teamColor,
  teamSecondaryColor,
  team_name,
  age,
}: Props) {
  const initial = player?.first_name?.[0]?.toUpperCase() || "?";

  const useWhiteTextTeams = [
    "cin",
    "bal",

  ];

  const getPrimaryTextColor = (
    isDark: boolean,
    teamName?: string,
    teamColor?: string
  ): string => {
    const normalizedTeamName = teamName?.trim().toLowerCase() ?? "";

    if (isDark && useWhiteTextTeams.includes(normalizedTeamName)) {
      return secondaryTextColor;
    }

    return teamColor ?? (isDark ? "#fff" : "#000");
  };

  const primaryTextColor = getPrimaryTextColor(isDark, team_name, teamColor);

  // Use secondary color only in dark mode, fallback white; else black in light mode
  const getSecondaryTextColor = (
    isDark: boolean,
    teamName?: string,
    teamSecondaryColor?: string
  ): string => {
    const normalizedTeamName = teamName?.trim().toLowerCase() ?? "";

    if (isDark) {
      if (useWhiteTextTeams.includes(normalizedTeamName)) {
        return "#fff";
      }
      return teamSecondaryColor ?? "#fff";
    }

    return "#1d1d1d"; // light mode
  };

  const secondaryTextColor = getSecondaryTextColor(
    isDark,
    team_name,
    teamSecondaryColor
  );

  const dividerColor = isDark ? "#444" : "#ddd";
  const avatarBg = isDark ? "#444" : "#ddd";

  return (
    <View style={styles.playerHeader}>
      <View
        style={[styles.avatarContainer, { borderRightColor: dividerColor }]}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={[styles.avatar, { backgroundColor: avatarBg }]}
            accessibilityLabel={`${player.first_name} ${player.last_name} photo`}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initial}>{initial}</Text>
          </View>
        )}
        <View style={styles.jerseyNumber}>
          <Text
            style={[
              styles.jersey,
              { color: isDark ? secondaryTextColor : primaryTextColor },
            ]}
          >
            {player.position ?? "N"} #{player.jersey_number ?? "?"}
          </Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text
          style={[
            styles.name,
            { color: isDark ? secondaryTextColor : primaryTextColor },
          ]}
        >
          {player.first_name}
        </Text>
        <Text
          style={[
            styles.name,
            { color: isDark ? secondaryTextColor : primaryTextColor },
          ]}
        >
          {player.last_name}
        </Text>

        <Text
          style={[styles.playerInfo, { color: isDark ? "#fff" : "#1d1d1d" }]}
        >
          <Text
            style={{
              fontFamily: Fonts.OSMEDIUM,
              color: isDark ? secondaryTextColor : primaryTextColor,
            }}
          >
            School:{" "}
          </Text>
          {player.college || "Unknown"}
        </Text>

        <Text
          style={[styles.playerInfo, { color: isDark ? "#fff" : "#1d1d1d" }]}
        >
          <Text
            style={{
              fontFamily: Fonts.OSMEDIUM,
              color: isDark ? secondaryTextColor : primaryTextColor,
            }}
          >
            Height:{" "}
          </Text>
          {player.height ?? "?"}
        </Text>

        <Text
          style={[styles.playerInfo, { color: isDark ? "#fff" : "#1d1d1d" }]}
        >
          <Text
            style={{
              fontFamily: Fonts.OSMEDIUM,
              color: isDark ? secondaryTextColor : primaryTextColor,
            }}
          >
            Weight:{" "}
          </Text>
          {player.weight ?? "?"} lbs
        </Text>

        <Text
          style={[styles.playerInfo, { color: isDark ? "#fff" : "#1d1d1d" }]}
        >
          <Text
            style={{
              fontFamily: Fonts.OSMEDIUM,
              color: isDark ? secondaryTextColor : primaryTextColor,
            }}
          >
            Age:{" "}
          </Text>
          {age != null ? `${age} years old` : "Unknown"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  playerHeader: {
    marginTop: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  avatarContainer: {
    marginRight: 20,
    paddingRight: 20,
    borderRightWidth: 1,
    alignItems: "center",
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  avatarPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#888",
    justifyContent: "center",
    alignItems: "center",
  },
  initial: {
    fontSize: 48,
    color: "#fff",
    fontWeight: "bold",
  },
  jerseyNumber: {
    flexDirection: "row",
    justifyContent: "center",
  },
  jersey: {
    fontSize: 36,
    fontFamily: Fonts.OSBOLD,
    textAlign: "center",
  },
  infoContainer: {
    justifyContent: "center",
  },
  name: {
    fontSize: 24,
    fontFamily: Fonts.OSBOLD,
  },
  playerInfo: {
    fontFamily: Fonts.OSLIGHT,
  },
});
