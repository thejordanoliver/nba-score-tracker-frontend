// hooks/useNFLPlayers.ts
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { NFLPlayer } from "types/nfl";

interface UseNFLPlayersProps {
  teamId: string;
  season?: string;
}

const KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;

export const useNFLPlayers = ({ teamId, season = "2025" }: UseNFLPlayersProps) => {
  const [players, setPlayers] = useState<NFLPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ define fetchPlayers once, memoized
  const fetchPlayers = useCallback(async () => {
    if (!teamId) return;

    setLoading(true);
    setError(null);

    try {
      const options = {
        method: "GET",
        url: "https://api-american-football.p.rapidapi.com/players",
        params: { team: teamId, season },
        headers: {
          "x-rapidapi-key": KEY,
          "x-rapidapi-host": "api-american-football.p.rapidapi.com",
        },
      };

      const response = await axios.request(options);
      const data = response.data.response as NFLPlayer[];
      setPlayers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch players.");
    } finally {
      setLoading(false);
    }
  }, [teamId, season]);

  // ✅ run once when teamId/season changes
  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  return { players, loading, error, refresh: fetchPlayers };
};
