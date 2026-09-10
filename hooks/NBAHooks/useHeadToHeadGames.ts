import { BasketballGame } from "@/types/basketball/basketball";
import { useEffect, useState } from "react";

import { apiClient } from "utils/apiClient";
import { getNBASeason } from "utils/dateUtils";

export interface HeadToHead {
  success: boolean;
  series: {
    team1: number;
    team2: number;
    team1Wins: number;
    team2Wins: number;
    totalGames: number;
  };
  games: BasketballGame[];
}

export function useHeadToHeadGames(team1: number, team2: number) {
  const [data, setData] = useState<HeadToHead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const season = getNBASeason();
  useEffect(() => {
    if (!team1 || !team2 || !season) return;

    setLoading(true);
    setError(null);

    const fetchGames = async () => {
      try {
        const res = await apiClient.get(
          `api/games/nba/matchups/${team1}/${team2}/${season}`,
        );

        // Return the raw API object
        setData(res.data);
      } catch (err: unknown) {
        console.error("Error fetching head-to-head games:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [team1, team2, season]);

  return { data, loading, error };
}
