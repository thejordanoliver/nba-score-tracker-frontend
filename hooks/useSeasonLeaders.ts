import { useEffect, useState } from "react";
import axios from "axios";
import { PlayerLeader, STAT_CATEGORIES, StatCategory } from "types/stats";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type LeadersByStat = Partial<Record<StatCategory, PlayerLeader[]>>;

interface ApiResponse {
  stat: StatCategory;
  limit: number;
  minGames: number;
  season: number;
  leaders: PlayerLeader[];
}

interface UseSeasonLeadersOptions {
  season?: number;
  limit?: number;
  minGames?: number;
  baseUrl?: string;
}

export function useSeasonLeaders({
  season = 2024,
  limit = 5,
  minGames = 10,
  baseUrl = API_URL,
}: UseSeasonLeadersOptions = {}) {
  const [leaders, setLeaders] = useState<LeadersByStat>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchLeaders() {
      setLoading(true);
      setError(null);

      try {
        const responses = await Promise.all(
          STAT_CATEGORIES.map(async (stat) => {
            const { data } = await axios.get<ApiResponse>(`${baseUrl}/api/season-leaders`, {
              params: { stat, limit, minGames, season },
            });
            return { stat, leaders: data.leaders };
          })
        );

        if (!isCancelled) {
          const result: LeadersByStat = {};
          for (const { stat, leaders } of responses) {
            result[stat] = leaders;
          }
          setLeaders(result);
        }
      } catch (err) {
        if (!isCancelled) {
          if (axios.isAxiosError(err)) {
            setError(err.response?.data?.error || err.message);
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Unknown error");
          }
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchLeaders();
    return () => {
      isCancelled = true;
    };
  }, [season, limit, minGames, baseUrl]);

  return { leaders, loading, error };
}
