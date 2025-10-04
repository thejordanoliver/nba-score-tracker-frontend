import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { teams } from "../../constants/teams"; // NBA
import { teams as nflteams } from "../../constants/teamsNFL"; // NFL

type Props = {
  favoriteTeamIds: string[]; // e.g., ["NBA:17", "NFL:13"]
};

export default function FavoritesScroll({ favoriteTeamIds }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getStyles(isDark);

  const favoriteTeams = favoriteTeamIds
    .map((fav) => {
      const [league, id] = fav.split(":");
      let team;
      if (league === "NBA") team = teams.find((t) => t.id === id);
      if (league === "NFL") team = nflteams.find((t) => String(t.id) === id);
      if (!team) return null;
      return { ...team, league: league as "NBA" | "NFL" };
    })
    .filter(Boolean);

  return (
    <View style={styles.favoritesWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.favorites}
      >
        {favoriteTeams.map((team) => (
          <Pressable
            key={`${team?.league}-${team?.id}`}
            style={({ pressed }) => [
              styles.teamIcon,
              pressed && { opacity: 0.6 },
            ]}
            onPress={() => {
              if (!team) return;

              const route =
                team.league === "NFL" ? "/team/nfl/[teamId]" : "/team/[teamId]";

              router.push({
                pathname: route,
                params: { teamId: team.id.toString() },
              });
            }}
          >
            <View
              style={[
                styles.logoWrapper,
                {
                  backgroundColor: isDark
                    ? team?.color || "#333"
                    : team?.color || "#eee",
                },
              ]}
            >
              <Image
                source={
                  isDark && team?.logoLight
                    ? team?.logoLight
                    : team?.logoLight || team?.logo
                }
                style={styles.logo}
              />
            </View>
            <Text style={styles.teamLabel}>{team?.name}</Text>
          </Pressable>
        ))}

        {/* Add or Edit favorites button */}
        <Pressable
          onPress={() => router.push("/edit-favorites")}
          accessibilityRole="button"
          accessibilityLabel={
            favoriteTeams.length === 0
              ? "Add favorite teams"
              : "Edit favorite teams"
          }
        >
          <View style={styles.teamIcon}>
            <View style={styles.editIcon}>
              <Ionicons
                name={favoriteTeams.length === 0 ? "add" : "create"}
                size={32}
                color={isDark ? "#000" : "#fff"}
              />
            </View>
            <Text style={styles.teamLabel}>
              {favoriteTeams.length === 0 ? "Add teams" : "Edit"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

export const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? "#1d1d1d" : "#fff" },
    favoritesWrapper: { padding: 0 },
    favorites: {
      flexDirection: "row",
      marginBottom: 20,
      paddingBottom: 0,
      paddingTop: 24,
      paddingHorizontal: 16,
    },
    teamIcon: { alignItems: "center", marginRight: 16, marginBottom: 0 },
    logoWrapper: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderWidth: 0.5,
      borderColor: isDark ? "#fff" : "#1d1d1d",
    },
    logo: { width: 50, height: 50, resizeMode: "contain" },
    editIcon: {
      backgroundColor: isDark ? "#fff" : "#1d1d1d",
      width: 80,
      height: 80,
      borderRadius: 100,
      justifyContent: "center",
      alignItems: "center",
    },
    teamLabel: {
      marginTop: 4,
      fontSize: 12,
      color: isDark ? "#ccc" : "#1d1d1d",
      fontFamily: "Oswald_400Regular",
    },
    heading: {
      fontSize: 24,
      fontFamily: "Oswald_500Medium",
      marginBottom: 8,
      marginTop: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#444" : "#ccc",
      color: isDark ? "#fff" : "#1d1d1d",
    },
    emptyText: {
      textAlign: "center",
      color: isDark ? "#aaa" : "#999",
      marginTop: 20,
      fontSize: 14,
    },
  });
