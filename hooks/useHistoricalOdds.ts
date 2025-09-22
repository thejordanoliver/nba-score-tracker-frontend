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

interface UseHistoricalOddsOptions {
  date?: string; // YYYY-MM-DD
  timestamp?: number;
  team1?: string;
  team2?: string;
  gameId?: string | number;
  skip?: boolean;
}

// In-memory cache
const cache: Record<string, HistoricalGameOdds[]> = {};

export const useHistoricalOdds = (options: UseHistoricalOddsOptions) => {
  const { date, timestamp, team1, team2, gameId, skip } = options;

  const [data, setData] = useState<HistoricalGameOdds[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastParamsRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (skip) return;
    if (!date || !gameId) return;
    if (!BASE_URL) {
      setError("API base URL not set");
      return;
    }

    const params: Record<string, string> = { date };
    if (timestamp) params.timestamp = new Date(timestamp).toISOString();
    if (team1) params.team1 = team1;
    if (team2) params.team2 = team2;

    const key = JSON.stringify({ ...params, gameId });

    if (cache[key]) {
      setData(cache[key]);
      setError(null);
      return;
    }

    if (lastParamsRef.current === key) return;
    lastParamsRef.current = key;

    const cancelSource = axios.CancelToken.source();

    const fetchData = async () => {
      const currentId = ++requestIdRef.current;
      setLoading(true);

      try {
        const res = await axios.get(`${BASE_URL}/api/odds/historical`, {
          params,
          cancelToken: cancelSource.token,
        });

        if (currentId !== requestIdRef.current) return;

        const games: HistoricalGameOdds[] = Array.isArray(res.data?.games)
          ? res.data.games
          : [];

        cache[key] = games;
        setData(games);

        // ✅ don’t treat empty array as error
        setError(null);
      } catch (err: any) {
        if (axios.isCancel(err)) return;
        setError(
          err.response?.data?.error || err.message || "Failed to fetch odds"
        );
      } finally {
        if (currentId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelSource.cancel("Component unmounted");
    };
  }, [date, timestamp, team1, team2, gameId, skip]);

  const refetch = () => {
    lastParamsRef.current = null;
    setError(null);
    setData([]);
    setLoading(false);
  };

  return { data, loading, error, refetch };
};
