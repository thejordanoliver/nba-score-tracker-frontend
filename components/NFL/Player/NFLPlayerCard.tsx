// components/NFLPlayerCard.tsx
import { Fonts } from "constants/fonts";
import { teams } from "constants/teamsNFL";
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

export interface NFLPlayerCardProps {
  id: number;
  name: string;

  position?: string | null;
  team: string;
  avatarUrl?: string | null;
  number?: string | number | null;
}

export const NFLPlayerCard: React.FC<NFLPlayerCardProps> = ({
  id,
  name,
  position,
  team,
  avatarUrl,
  number,
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getStyles(isDark);

  const teamObj = teams.find((t) => t.name === team);
  const initial = name?.[0]?.toUpperCase() ?? "?";
  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/player/nfl/[id]",
          params: {
            id: id.toString(),
            teamId: teamObj?.id?.toString() ?? "0",
          },
        })
      }
    >
      <View style={styles.wrapper}>
        <View style={styles.nameContainer}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={[
                styles.avatar,
                { backgroundColor: isDark ? "#444" : "#ddd" },
              ]}
              accessibilityLabel={`Avatar for ${name}`}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.initial}>{initial}</Text>
            </View>
          )}
          <Text
            style={[styles.name, { color: isDark ? "#fff" : teamObj?.color }]}
          >
            {name}
          </Text>
        </View>
        <View style={styles.positionContainer}>
          {position && <Text style={styles.position}>{position}</Text>}
          {number != null && (
            <Text
              style={[
                styles.number,
                { color: isDark ? "#fff" : teamObj?.color },
              ]}
            >
              #{number}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: isDark ? "#2e2e2e" : "#eee",
      borderRadius: 8,
      height: 80,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 30,
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
    wrapper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flex: 1,
    },
    nameContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      height: 80,
      flex: 1,
    },
    positionContainer: {
      flexDirection: "row",
      alignItems: "center",
      width: 80,
      gap: 2,
    },
    divider: {
      width: 1,
      height: 60, // relative to container
      backgroundColor: isDark ? "#888" : "#888",
      marginHorizontal: 8,
      alignSelf: "center", // vertically centers the divider
    },

    name: {
      fontSize: 16,
      fontFamily: Fonts.OSBOLD,
      color: isDark ? "#fff" : "#1d1d1d",
    },
    number: {
      fontSize: 16,
      fontFamily: Fonts.OSBOLD,
      color: isDark ? "#fff" : "#1d1d1d",
    },
    position: {
      fontSize: 16,
      marginLeft: 4,
      color: isDark ? "#888" : "#888",
      fontFamily: Fonts.OSBOLD,
    },
  });

export default NFLPlayerCard;
