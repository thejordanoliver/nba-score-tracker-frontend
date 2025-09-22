import { Game } from "types/nfl";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export function useNFLWeeklyGames(season = "2025", league = "1") {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeeklyGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${BASE_URL}/api/gamesNFL/weekly`, {
        params: { season, league },
      });

      const games = res.data.response || [];

      setGames(games);
    } catch (err: any) {
      console.error("Error fetching weekly games:", err.message);
      setError(err.message || "Failed to fetch weekly games");
    } finally {
      setLoading(false);
    }
  }, [season, league]);

  useEffect(() => {
    fetchWeeklyGames();
  }, [fetchWeeklyGames]);

  return { games, loading, error, refetch: fetchWeeklyGames };
}
