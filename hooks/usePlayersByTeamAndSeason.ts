import { useEffect, useState } from "react";
import axios from "axios";
import playerImages from "../constants/players";
type Player = {
  id: number;
  name: string;
  pos: string;
  team: string;
  avatarUrl?: string;
};

interface ApiPlayer {
  id: number;
  firstname: string;
  lastname: string;
  leagues?: {
    standard?: {
      pos?: string;
      active?: boolean;
      jersey?: number | null;
    };
  };
  team?: string;        // If your API returns team info here
  avatarUrl?: string;   // If API returns avatar URL here
}

interface ApiResponse {
  response: ApiPlayer[];
}

type UsePlayersReturn = {
  players: Player[];
  loading: boolean;
  error: string | null;
};
const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.EXPO_PUBLIC_RAPIDAPI_HOST || "";
const usePlayersByTeamAndSeason = (teamId: string, season: string): UsePlayersReturn => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<ApiResponse>("https://api-nba-v1.p.rapidapi.com/players", {
          params: {
            team: teamId,
            season: season,
          },
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': RAPIDAPI_HOST,
          },
        });

        // Transform API data to match PlayerCard props
  

const transformedPlayers: Player[] = response.data.response.map(player => {
  const playerName = `${player.firstname} ${player.lastname}`;
  return {
    id: player.id,
    name: playerName,
    pos: player.leagues?.standard?.pos || "N/A",
    team: player.team || "Unknown",
    avatarUrl: playerImages[playerName] || undefined, // fallback to undefined
  };
});

        setPlayers(transformedPlayers);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [teamId, season]);

  return { players, loading, error };
};

export default usePlayersByTeamAndSeason;
