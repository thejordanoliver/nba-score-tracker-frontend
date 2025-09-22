import { useEffect, useState } from "react";
import axios from "axios";


const KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY

export function useNFLTeamStats(gameId: string | number) {
  const [stats, setStats] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          "https://api-american-football.p.rapidapi.com/games/statistics/teams",
          {
            params: { id: gameId },
            headers: {
              "x-rapidapi-key": KEY,
              "x-rapidapi-host": "api-american-football.p.rapidapi.com",
            },
          }
        );
        setStats(response.data.response || []);

      } catch (err: any) {
        setError(err.message || "Failed to fetch team stats");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gameId]);

  return { stats, loading, error };
}
