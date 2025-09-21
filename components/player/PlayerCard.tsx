import { Fonts } from "constants/fonts";
import { teams } from "constants/teams"; // your teams list
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

export interface PlayerCardProps {
  id: number;
  playerId: number;
  name: string;
  position?: string | null;
  team: string;
  avatarUrl?: string | null;
  jerseyNumber?: string | number | null;
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#2e2e2e" : "#eee",
      borderRadius: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 30,
      paddingTop: 4,
    },
    avatarPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 30,
      backgroundColor: isDark ? "#444" : "#888",
      justifyContent: "center",
      alignItems: "center",
    },
    initial: {
      fontSize: 24,
      color: "#fff",
      fontFamily: Fonts.OSBOLD,
    },
    info: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginLeft: 12,
      height: "100%",
    },
    nameContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    name: {
      fontSize: 16,
      fontFamily: Fonts.OSBOLD,
    },
    jerseyNumber: {
      fontSize: 16,
      marginLeft: 6,
      fontFamily: Fonts.OSBOLD,
      color: isDark ? "#fff" : "#1d1d1d",
    },
    position: {
      fontSize: 16,
      color: isDark ? "#fff" : "#1d1d1d",
      fontFamily: Fonts.OSBOLD,
    },
  });

const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  playerId,
  position,
  team,
  avatarUrl,
  jerseyNumber,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getStyles(isDark);
  const router = useRouter();

  const cleanTeam = team.replace(/"/g, "");
  const teamObj = teams.find((t) => t.fullName === cleanTeam);

  const initial =
    typeof name === "string" && name.length > 0 ? name[0].toUpperCase() : "?";

  return (
    <Pressable
      style={styles.card}
      onPress={() => {
        if (!teamObj) {
          console.warn(`No team found for "${team}"`);
          return;
        }
        router.push({
          pathname: "/player/[id]",
          params: {
            id: playerId.toString(),
            teamId: teamObj.id.toString(),
          },
        });
      }}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.avatar, { backgroundColor: isDark ? "#444" : "#ddd" }]}
          accessibilityLabel={`Avatar for ${name}`}
        />
      ) : (
        <View
          style={styles.avatarPlaceholder}
          accessibilityLabel={`Initial placeholder for ${name}`}
        >
          <Text style={styles.initial}>{initial}</Text>
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.nameContainer}>
          <Text
            style={[
              styles.name,
              {
                color: isDark ? "#fff" : teamObj?.color,
              },
            ]}
          >
            {name}
          </Text>
        </View>
        {typeof jerseyNumber === "string" && /^\d+$/.test(jerseyNumber) && (
          <Text
            style={[
              styles.jerseyNumber,
              {
                color: isDark ? "#fff" : teamObj?.color,
              },
            ]}
          >
            #{jerseyNumber}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

export default PlayerCard;
