import { Colors } from "@/constants/styles";
import type { NotificationGameTeams } from "@/utils/notification-team-presentation";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

type Props = {
  teams: NotificationGameTeams;
  isDark: boolean;
  size?: number;
};

export function GameNotificationTeamLogos({
  teams,
  isDark,
  size = 30,
}: Props) {
  const visibleTeams = [teams.away, teams.home].filter(
    (team): team is NonNullable<typeof team> => Boolean(team),
  );

  return (
    <View style={styles.container} accessibilityElementsHidden>
      {visibleTeams.map((team, index) => (
        <View
          key={team.id}
          style={[
            styles.logoShell,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: index === 0 ? 0 : -Math.round(size * 0.28),
              backgroundColor: isDark ? Colors.black : Colors.white,
              borderColor: isDark ? Colors.darkGray : Colors.lightGray,
              zIndex: index + 1,
            },
          ]}
        >
          <Image
            source={team.logo}
            contentFit="contain"
            style={{ width: size - 6, height: size - 6 }}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoShell: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
