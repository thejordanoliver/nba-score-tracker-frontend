import axios from "axios";
import { useEffect, useRef, useState } from "react";

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

export interface HistoricalGameOdds {
  id: string;
  commence_time: string;
  commence_time_local?: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Hook options
interface UseHistoricalOddsOptions {
  date?: string; // YYYY-MM-DD
  timestamp?: number;
  team1?: string;
  team2?: string;
  gameId?: string | number; // stable identifier
  skip?: boolean; // ✅ new flag to disable fetching
}

// Simple in-memory cache
const cache: Record<string, HistoricalGameOdds[]> = {};

export const useHistoricalOdds = (options: UseHistoricalOddsOptions) => {
  const { date, timestamp, team1, team2, gameId, skip } = options;

  const [data, setData] = useState<HistoricalGameOdds[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastParamsRef = useRef<string | null>(null);

  useEffect(() => {
    if (skip) return; // ✅ skip fetch if flag is true
    if (!date || !gameId) return;

    const params: Record<string, string> = { date };
    if (timestamp) params.timestamp = new Date(timestamp).toISOString();
    if (team1) params.team1 = team1;
    if (team2) params.team2 = team2;

    const key = JSON.stringify(params);

    if (cache[key]) {
      setData(cache[key]);
      setError(null);
      return;
    }

    if (lastParamsRef.current === key) return;
    lastParamsRef.current = key;

    const cancelSource = axios.CancelToken.source();

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/odds/historical`, {
          params,
          cancelToken: cancelSource.token,
        });
        const games: HistoricalGameOdds[] = res.data.games || [];
        cache[key] = games;
        setData(games);
        setError(null);
      } catch (err: any) {
        if (axios.isCancel(err)) return;
        setError(
          err.response?.data?.error || err.message || "Failed to fetch odds"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelSource.cancel("Component unmounted");
    };
  }, [date, timestamp, team1, team2, gameId, skip]);

  return { data, loading, error };
};
