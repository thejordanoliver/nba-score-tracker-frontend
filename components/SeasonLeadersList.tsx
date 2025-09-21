import { Fonts } from "constants/fonts";
import { teams } from "constants/teams"; // import your teams list
import { PlayerLeader } from "types/stats";
import { useRouter } from "expo-router";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import HeadingTwo from "./Headings/HeadingTwo";
import PlayerStatRow from "./SeasonLeaderCard";

interface SeasonLeadersListProps {
  leadersByStat: Partial<{
    points: PlayerLeader[];
    assists: PlayerLeader[];
    rebounds: PlayerLeader[];
    steals: PlayerLeader[];
    blocks: PlayerLeader[];
    tpm: PlayerLeader[];
    ftm: PlayerLeader[];
  }>;
  loading?: boolean;
  error?: string | null;
}

const STAT_DISPLAY_NAMES: Record<string, string> = {
  points: "Points",
  assists: "Assists",
  rebounds: "Rebounds",
  steals: "Steals",
  blocks: "Blocks",
  tpm: "Three Point",
  ftm: "Free Throw",
};

export default function SeasonLeadersList({
  leadersByStat,
  loading,
  error,
}: SeasonLeadersListProps) {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>Loading leaders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.infoText, { color: "red" }]}>
          Failed to load stats: {error}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={Object.entries(leadersByStat)}
      contentContainerStyle={{ paddingBottom: 100 }}
      keyExtractor={([stat]) => stat}
      renderItem={({ item: [stat, players] }) => (
        <>
          <View style={styles.categoryContainer}>
            <HeadingTwo>{STAT_DISPLAY_NAMES[stat] || stat} Leaders</HeadingTwo>
            <View style={styles.playersList}>
              {players?.map((player) => {
                const statKey = `avg_${stat}` as keyof PlayerLeader;
                const statValue = player[statKey] ?? "0";

                const fullName =
                  player.full_name ??
                  `${player.first_name} ${player.last_name}`;
                const headshotUrl =
                  player.headshot_url || "https://via.placeholder.com/40";

                // Use teamId to find team
                const teamObj = teams.find(
                  (t) => t.id.toString() === player.team_id?.toString()
                );
                const cleanTeam = teamObj?.fullName?.replace(/"/g, "") || "";
                return (
                  <TouchableOpacity
                    key={player.player_id}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (!teamObj) {
                        console.warn(
                          `No team found for teamId "${player.team_id}"`
                        );
                        return;
                      }
                      router.push({
                        pathname: "/player/[id]",
                        params: {
                          id: player.player_id.toString(),
                          teamId: teamObj.id.toString(),
                        },
                      });
                    }}
                  >
                    <PlayerStatRow
                      headshotUrl={headshotUrl}
                      fullName={fullName}
                      statNumber={statValue}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </>
      )}
    />
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    categoryContainer: {
      paddingHorizontal: 12,
      paddingTop: 6,
      paddingBottom: 12,
    },

    playersList: {
      gap: 12,
    },

    centered: {
      alignItems: "center",
      justifyContent: "center",
    },
    infoText: {
        fontFamily: Fonts.OSLIGHT,
                     fontSize: 16,
                     textAlign: "center",
                     marginTop: 20,
                     color: isDark ? "#aaa" : "#888"
    },
  });
