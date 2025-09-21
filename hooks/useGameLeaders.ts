// hooks/useGameLeaders.ts
import { useEffect, useState } from "react";
import axios from "axios";

  const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export function useGameLeaders(
  gameId: string,
  homeTeamId: number,
  awayTeamId: number
) {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLeaders = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = `${API_URL}/api/player-stats/${gameId}`;

        const res = await axios.get(url);

        if (isMounted) {
          // Add teamType based on team IDs
          const playersWithTeamType = res.data.response.map((player: any) => ({
            ...player,
            teamType:
              player.team.id === homeTeamId
                ? "home"
                : player.team.id === awayTeamId
                ? "away"
                : undefined,
          }));

          setData(playersWithTeamType);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to fetch game leaders");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (gameId && homeTeamId && awayTeamId) {
      fetchLeaders();
    } else {
      setLoading(false);
      setData(null);
    }

    return () => {
      isMounted = false;
    };
  }, [gameId, homeTeamId, awayTeamId]);

  return {
    data,
    isLoading: loading,
    isError: !!error,
    error,
  };
}
