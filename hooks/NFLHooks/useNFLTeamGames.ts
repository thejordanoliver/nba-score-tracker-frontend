import { Game } from "types/nfl";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export function useNFLTeamGames(
  teamId: string | number,
  season = "2025",
  league = "1",
  fetchAll = false // new flag
) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    if (!teamId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(`${BASE_URL}/api/gamesNFL/team/${teamId}`, {
        params: { season, league, all: fetchAll ? 1 : 0 },
      });


      const games = res.data.response || [];

      games.forEach((g: Game, i: number) => {
        const ts = g?.game?.date?.timestamp;
        if (ts) {
          const utc = new Date(ts * 1000);
          console.log(
            `Game[${i}] → timestamp: ${ts}, UTC: ${utc.toISOString()}, Local: ${utc.toString()}`
          );
        }
      });

      setGames(games);
    } catch (err: any) {
      console.error("Error fetching NFL team games:", err.message);
      setError("Failed to load team games");
    } finally {
      setLoading(false);
    }
  }, [teamId, season, league, fetchAll]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const refreshGames = useCallback(() => fetchGames(), [fetchGames]);

  return { games, loading, error, refreshGames };
}
