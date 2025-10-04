// components/FavoriteTeamsList.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, Text, useColorScheme, View } from "react-native";
import { LongPressGestureHandler, State } from "react-native-gesture-handler";
import type { Team } from "types/types"; // Team type should include `league: "NBA" | "NFL"`
import TeamPreviewModal from "./../Team/TeamPreviewModal";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
type TeamWithLeague = Team & { league: "NBA" | "NFL" };

type Props = {
  favoriteTeams: TeamWithLeague[];
  isGridView: boolean;
  styles: any;
  itemWidth?: number;
  isCurrentUser: boolean;
  username?: string;
};

const FavoriteTeamsList = ({
  favoriteTeams,
  isGridView,
  styles,
  isCurrentUser,
  username,
}: Props) => {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const [favorites, setFavorites] = useState<TeamWithLeague[]>(
    favoriteTeams.map((t) => ({ ...t, league: (t as any).league || "NBA" })) // default to NBA if missing
  );
  const [previewTeam, setPreviewTeam] = useState<TeamWithLeague | null>(null);

  const [modalVisible, setModalVisible] = useState(false);

  const handleLongPress = (team: TeamWithLeague) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPreviewTeam(team);
    setModalVisible(true);
  };

  const handleGoToTeam = () => {
    if (previewTeam) {
      router.push(`/team/${previewTeam.id}`);
      setModalVisible(false);
    }
  };

  const handleRemoveFavorite = async (team: TeamWithLeague) => {
    try {
      const key = `${team.league}:${team.id}`;
      // Update local favorites list immediately
      const updated = favorites.filter((t) => `${t.league}:${t.id}` !== key);
      setFavorites(updated);
      setModalVisible(false);
      setPreviewTeam(null);

      // Save updated favorites IDs to AsyncStorage
      const keysOnly = updated.map((t) => `${t.league}:${t.id}`);
      await AsyncStorage.setItem("favorites", JSON.stringify(keysOnly));

      // Update backend if username available
      if (username) {
        try {
          const response = await axios.patch(
            `${API_URL}/api/users/${username}/favorites`,
            { favorites: keysOnly }
          );
          console.log("Backend favorites update response:", response.data);
        } catch (error: unknown) {
          if (axios.isAxiosError(error)) {
            console.error(
              "Failed to update favorites on backend:",
              error.response?.data || error.message
            );
          } else if (error instanceof Error) {
            console.error("Unexpected error:", error.message);
          } else {
            console.error("Unknown error:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error in handleRemoveFavorite:", error);
    }
  };

  useEffect(() => {
    setFavorites(favoriteTeams);
  }, [favoriteTeams]);

  return (
    <>
      {previewTeam && (
        <TeamPreviewModal
          visible={modalVisible}
          team={previewTeam}
          onClose={() => setModalVisible(false)}
          onGo={handleGoToTeam}
          onRemove={() => handleRemoveFavorite(previewTeam)}
        />
      )}

      <View
        style={[
          isGridView ? styles.teamGrid : {},
          { columnGap: isGridView ? 6 : 0 },
          { rowGap: isGridView ? 8 : 0 },
          { justifyContent: "flex-start" },
        ]}
      >
        {favorites.map((team) => {
          const split = team.fullName?.split(" ");
          const city = split?.slice(0, -1).join(" ");
          const nickname = split?.at(-1) || "";

          return (
            <LongPressGestureHandler
              key={`${team.league}:${team.id}`}
              minDurationMs={300}
              onHandlerStateChange={({ nativeEvent }) => {
                if (nativeEvent.state === State.ACTIVE) {
                  handleLongPress(team);
                }
              }}
            >
              <Pressable
                key={`${team?.league}-${team?.id}`}
                style={({ pressed }) => [
                  pressed && { opacity: 0.6 },
                  isGridView ? { width: "32%" } : { width: "100%" },
                ]}
                onPress={() => {
                  if (!team) return;

                  const route =
                    team.league === "NFL"
                      ? "/team/nfl/[teamId]"
                      : "/team/[teamId]";

                  router.push({
                    pathname: route,
                    params: { teamId: team.id.toString() },
                  });
                }}
              >
                <View style={{ width: "100%" }}>
                  <View
                    style={[
                      styles.teamItem,
                      {
                        backgroundColor: team.color,
                        flexDirection: isGridView ? "column" : "row",
                        justifyContent: isGridView ? "center" : "flex-start",
                        alignItems: "center",
                        height: isGridView ? 130 : "auto",
                        marginBottom: isGridView ? 0 : 8,
                        paddingHorizontal: 12,
                        paddingVertical: isGridView ? 20 : 12,
                      },
                    ]}
                  >
                    <Image
                      source={
                        isDark && team.logoLight
                          ? team.logoLight
                          : team.logoLight || team.logo
                      }
                      style={[
                        styles.teamLogo,
                        isGridView ? { marginBottom: 8 } : { marginRight: 10 },
                      ]}
                    />
                    {isGridView ? (
                      <View style={{ alignItems: "center" }}>
                        <Text
                          style={[
                            styles.teamName,
                            { fontSize: 12, textAlign: "center" },
                          ]}
                        >
                          {city}
                        </Text>
                        <Text
                          style={[
                            styles.teamName,
                            { fontSize: 12, textAlign: "center", marginTop: 2 },
                          ]}
                        >
                          {nickname}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.teamName,
                          { textAlign: "left", fontSize: 14, marginLeft: 10 },
                        ]}
                      >
                        {team.fullName}
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
            </LongPressGestureHandler>
          );
        })}
      </View>

      {isCurrentUser && (
        <View style={{ width: "100%" }}>
          <Pressable onPress={() => router.push("/edit-favorites")}>
            <View
              style={[
                styles.editButton,
                {
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Text style={styles.editText}>Edit Teams</Text>
              <Ionicons
                style={styles.editIcon}
                name="create"
                size={20}
                color={isDark ? "#000" : "#fff"}
              />
            </View>
          </Pressable>
        </View>
      )}
    </>
  );
};

export default FavoriteTeamsList;
