import { apiClient } from "@/utils/apiClient";
import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { PlayerLeader, StatCategory } from "types/stats";


type LeadersByStat = Partial<Record<StatCategory, PlayerLeader[]>>;

interface ApiResponse {
  season: string;
  perMode: string;
  seasonType: string;
  leaderboards: LeadersByStat;
}

export function useSeasonLeaders({ enabled = true }: { enabled?: boolean } = {}) {
  const [leaders, setLeaders] = useState<LeadersByStat>({});
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let isCancelled = false;

    async function fetchLeaders() {
      setLoading(true);
      setError(null);

      try {
        const { data } = await apiClient.get<ApiResponse>(
          `api/leaders/nba/leaders`,
        );

        if (!isCancelled) {
          setLeaders(data.leaderboards);
        }
      } catch (err) {
        if (!isCancelled) {
          if (isAxiosError(err)) {
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
  }, [enabled]);

  return { leaders, loading, error };
}
