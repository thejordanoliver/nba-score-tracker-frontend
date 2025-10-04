// app/player/nfl/[id].tsx
import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import PlayerHeader from "components/NFL/Player/PlayerHeader";
import SeasonStatCard from "components/player/SeasonStatCard";
import { players as allPlayers } from "constants/nflPlayers";
import { getTeamInfo } from "constants/teamsNFL";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useMemo } from "react";
import { ScrollView, useColorScheme, View } from "react-native";

export default function NFLPlayerDetailScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = useColorScheme() === "dark";

  // Find player from constants
  const player = useMemo(
    () => allPlayers.find((p) => p.id === Number(id)),
    [id]
  );
  const fullName = player?.name ?? "Player";

  // Get team logo/color from constants
  const teamObj = player?.teamId ? getTeamInfo(player.teamId) : null;
  const isTeamAvailable = !!teamObj;

  const goBack = () => router.back();

  // Memoized avatar URL (from player constants or fallback)
  const avatarUrl = player?.image;

  // Map NFL player to PlayerHeader-compatible shape
  const mappedPlayer = player
    ? {
        first_name: player.name.split(" ")[0] || "",
        last_name: player.name.split(" ").slice(1).join(" ") || "",
        college: player.college ?? undefined, // must be undefined if missing
        height: player.height ?? undefined,
        weight: player.weight ?? undefined,
        birth_date: player.birth_date ?? undefined, // ✅ pass actual birth date
        position: player.position ?? undefined,
        jersey_number: player.number?.toString() ?? undefined,
        age: player.age ?? undefined,
      }
    : null;
 
  useLayoutEffect(() => {
 

    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle
          playerName={fullName}
          logo={
            isTeamAvailable
              ? teamObj?.logo
              : require("assets/Football/NFL_Logos/NFL.png")
          }
          logoLight={teamObj?.logoLight}
          teamColor={isTeamAvailable ? teamObj?.color : "#1D428A"} // fallback NFL blue
          onBack={goBack}
          isTeamScreen={!!teamObj}
          teamCode={teamObj?.code}
          isPlayerScreen={true}
          league="NFL"
        />
      ),
    });
  }, [navigation, fullName, teamObj, isTeamAvailable, isDark]);

  if (!player) {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? "#1d1d1d" : "#fff" }} />
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Player header */}
      {mappedPlayer && (
        <PlayerHeader
          player={mappedPlayer}
          avatarUrl={avatarUrl}
          isDark={isDark}
          teamColor={teamObj?.color}
          teamSecondaryColor={teamObj?.secondaryColor}
          team_name={teamObj?.code}
          age={player.age ?? 0} // pass function separately
        />
      )}
      {/* Season stats */}
      {player && (
        <View style={{ paddingHorizontal: 12, marginTop: 24 }}>
          <SeasonStatCard
            playerId={player.id}
            teamColor={teamObj?.secondaryColor}
            teamColorDark={teamObj?.secondaryColor}
          />
        </View>
      )}
    </ScrollView>
  );
}
