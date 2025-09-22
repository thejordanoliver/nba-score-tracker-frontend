// app/player/nfl/[id].tsx
import React, { useLayoutEffect } from "react";
import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useColorScheme, View } from "react-native";
import { useNFLPlayer } from "hooks/NFLHooks/useNFLPlayer";
import { getNFLTeamsLogo } from "constants/teamsNFL";

export default function NFLPlayerDetailScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = useColorScheme() === "dark";

  // ✅ destructure hook return
const { player, loading, error } = useNFLPlayer(id);
const fullName = player?.name ?? "Player";
const teamObj = player?.team ? getNFLTeamsLogo(player.team.id, isDark) : null;

  const isTeamAvailable = !!teamObj;

  const goBack = () => {
    router.back();
  };

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
          teamColor={isTeamAvailable ? teamObj?.color : "#1D428A"}
          onBack={goBack}
          isTeamScreen={!!teamObj}
          isPlayerScreen={true}
        />
      ),
    });
  }, [navigation, fullName, teamObj, isTeamAvailable, isDark]);

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: isDark ? "#1d1d1d" : "#fff" }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#1d1d1d" : "#fff" }}>
      {/* TODO: player detail UI */}
    </View>
  );
}
