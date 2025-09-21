import { useEffect, useState, useRef } from "react";
import axios, { CancelTokenSource } from "axios";

export interface Bookmaker {
  key: string;
  title: string;
  markets: {
    key: string;
    outcomes: {
      name: string;
      price: number;
      point?: number;
    }[];
  }[];
}

export interface UpcomingGameOdds {
  id: string;
  commence_time: string;
  commence_time_local?: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

interface UseUpcomingOddsOptions {
  timestamp?: string | number; // ISO string or epoch
  team1?: string; // abbreviation or full
  team2?: string;
}

const cache: Record<string, UpcomingGameOdds[]> = {};

export const useUpcomingOdds = ({ timestamp, team1, team2 }: UseUpcomingOddsOptions) => {
  const [data, setData] = useState<UpcomingGameOdds[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastParamsRef = useRef<string | null>(null);

  useEffect(() => {
    // ✅ normalize timestamp
    const normalizedTs = timestamp
      ? new Date(timestamp).toISOString()
      : undefined;

    const params: Record<string, string> = {};
    if (normalizedTs) params.timestamp = normalizedTs;
    if (team1) params.team1 = team1;
    if (team2) params.team2 = team2;

    // ✅ consistent cache key
    const key = JSON.stringify(params);

    // Return cached data if available
    if (cache[key]) {
      setData(cache[key]);
      setError(null);
      return;
    }

    // Prevent refetch if params unchanged
    if (lastParamsRef.current === key) return;
    lastParamsRef.current = key;

    let cancelSource: CancelTokenSource | null = axios.CancelToken.source();

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/odds/upcoming`, {
          params,
          cancelToken: cancelSource?.token,
        });

        const games = res.data.games || [];
        cache[key] = games;
        setData(games);
        setError(null);
      } catch (err: any) {
        if (axios.isCancel(err)) return;
        setError(err.response?.data?.error || "Failed to fetch upcoming odds");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelSource?.cancel("Component unmounted");
    };
  }, [timestamp, team1, team2]);

  return { data, loading, error };
};
