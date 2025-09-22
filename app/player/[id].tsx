import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import GameCard from "components/Games/GameCard";
import HeadingTwo from "components/Headings/HeadingTwo";
import PlayerHeader from "components/player/PlayerHeader";
import PlayerStatTable from "components/player/PlayerStatTable";
import SeasonStatCard from "components/player/SeasonStatCard";
import players from "constants/players"; // player image map
import { useLastTeamGame } from "hooks/useLastTeamGame";
import axios from "axios";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { teams } from "../../constants/teams";
import type { Game } from "../../types/types";
import { DBPlayer } from "../../types/types";
// Extend Team type locally to include optional 'record' property
type TeamWithRecord = (typeof teams)[number] & { record?: string };

const BASE_API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function PlayerDetailScreen() {
  const params = useLocalSearchParams();
  const playerIdParam = Array.isArray(params.id) ? params.id[0] : params.id; // read `id` param here
  const teamIdParam = Array.isArray(params.teamId)
    ? params.teamId[0]
    : params.teamId;

  const parsedPlayerId = parseInt(playerIdParam ?? "", 10);
  const sanitizedTeamId = String(teamIdParam ?? "")
    .replace(/"/g, "")
    .trim();

  // Cast teamObj as TeamWithRecord so .record is allowed
  const teamObj = teams.find((t) => String(t.id) === sanitizedTeamId) as
    | TeamWithRecord
    | undefined;
  const isDark = useColorScheme() === "dark";
  const teamNumericId = parseInt(sanitizedTeamId, 10);

  // Use the updated hook - it returns a `Game | null`
  const { lastGame: teamLastGame, loading: teamGameLoading } =
    useLastTeamGame(teamNumericId);

  const router = useRouter();
  const navigation = useNavigation();
  const [player, setPlayer] = useState<DBPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const goBack = () => router.back();

  function getApiBaseUrl() {
    if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

    if (Platform.OS === "android") {
      // Android emulator localhost workaround
      return "http://10.0.2.2:4000";
    }

    // iOS simulator or web fallback
    return BASE_API_URL;
  }

  const API_URL = getApiBaseUrl();

  useEffect(() => {
    if (isNaN(parsedPlayerId)) {
      setError("Invalid player ID");
      setLoading(false);
      return;
    }

    const fetchPlayer = async () => {
      setLoading(true);
      try {
        const resp = await axios.get<{ player: DBPlayer }>(
          `${API_URL}/api/players/player-id/${parsedPlayerId}`
        );
        setPlayer(resp.data.player);
      } catch (err: any) {
        setError(err.message || "Failed to load player data.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [parsedPlayerId]);

  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return null;
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const fullName = player
    ? `${player.first_name} ${player.last_name}`
    : "Player Details";

  const avatarUrl = player?.headshot_url || players[fullName];

  // Memoize styles based on dark mode
  const dynamicStyles = useMemo(() => {
    return StyleSheet.create({
      scrollView: {
        backgroundColor: isDark ? "#1d1d1d" : "#fff",
      },
      containerBorder: {
        borderBottomColor: isDark ? "#444" : "#ccc",
      },
      textColor: {
        color: isDark ? "#fff" : "#000",
      },
      nameColor: {
        color: isDark ? "#fff" : teamObj?.color,
      },
      errorTextColor: {
        color: isDark ? "red" : "darkred",
      },
      avatarBorder: {
        borderRightColor: isDark ? "#444" : "#ddd",
      },
      avatarBackground: {
        backgroundColor: isDark ? "#444" : "#ddd",
      },
      jerseyText: {
        color: isDark ? "#fff" : teamObj?.color,
      },
    });
  }, [isDark, teamObj]);

  useLayoutEffect(() => {
    const isTeamAvailable = !!teamObj;

    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle
          playerName={fullName}
          logo={
            isTeamAvailable ? teamObj?.logo : require("../../assets/Logos/NBA.png")
          }
          logoLight={teamObj?.logoLight}
          teamColor={isTeamAvailable ? teamObj?.color : "#1D428A"} // NBA blue
          onBack={goBack}
          isTeamScreen={!!teamObj}
          teamCode={teamObj?.code} // 👈 add this
          isPlayerScreen={true} // 👈 Add this
        />
      ),
    });
  }, [navigation, fullName, teamObj, isDark]);

  const initial = player ? player.first_name[0]?.toUpperCase() : "?";

  // teamLastGame already matches the Game type
  // so you can pass it directly to GameCard, no need to transform deeply
  // but you can enhance missing logo or record fields here if you want

  // Find away team with extended type
  const awayTeamObj = teams.find((t) => t.id === teamLastGame?.away.id) as
    | TeamWithRecord
    | undefined;

  const enrichedLastGame: Game | null = teamLastGame
    ? {
        ...teamLastGame,
        home: {
          ...teamLastGame.home,
          logo: teamObj?.logo || "", // or find in teams by ID
          record: teamObj?.record || "",
        },
        away: {
          ...teamLastGame.away,
          logo: awayTeamObj?.logo || "",
          record: awayTeamObj?.record || "",
        },
      }
    : null;

  const seasons = useMemo(() => {
    const start = player?.nba_start || 2015;
    return Array.from(
      { length: new Date().getFullYear() - start + 1 },
      (_, i) => (start + i).toString()
    );
  }, [player]);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
      {player && (
        <PlayerHeader
          player={player}
          avatarUrl={avatarUrl}
          isDark={isDark}
          teamColor={teamObj?.color} // primary team color
          teamSecondaryColor={teamObj?.secondaryColor} // secondary team color
          team_name={teamObj?.name} // team name string
          calculateAge={calculateAge}
        />
      )}

      {!loading && !error && player && (
        <View style={{ paddingHorizontal: 12, marginTop: 24 }}>
          <SeasonStatCard
            playerId={parsedPlayerId}
            teamColor={teamObj?.secondaryColor}
            teamColorDark={teamObj?.secondaryColor}
          />
        </View>
      )}
      {!teamGameLoading && enrichedLastGame && (
        <>
          <View style={{ paddingHorizontal: 12, marginTop: 24 }}>
            <HeadingTwo>Last Game</HeadingTwo>
            <GameCard game={enrichedLastGame} isDark={isDark} />
          </View>

          <View style={{ paddingHorizontal: 12, marginTop: 24 }}>
            <HeadingTwo>Career Stats</HeadingTwo>
            <PlayerStatTable playerId={parsedPlayerId} seasons={seasons} />
          </View>
        </>
      )}
    </ScrollView>
  );
}
