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

export interface HistoricalNFLGameOdds {
  id: string;
  commence_time: string;
  commence_time_local?: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

interface UseHistoricalNFLOddsOptions {
  date?: string; // YYYY-MM-DD
  timestamp?: number;
  team1?: string;
  team2?: string;
  skip?: boolean;
    gameId?: string; // NEW

}

const cache: Record<string, HistoricalNFLGameOdds[]> = {};

export const useHistoricalNFLOdds = (options: UseHistoricalNFLOddsOptions) => {
  const { date, timestamp, team1, team2, skip } = options;

  const [data, setData] = useState<HistoricalNFLGameOdds[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastParamsRef = useRef<string | null>(null);

  useEffect(() => {
    if (skip || !date) return;
const params: Record<string, string> = {
  date,
  markets: "h2h,spreads,totals",
  regions: "us",
  oddsFormat: "american",
};

if (team1) params.team1 = team1;
if (team2) params.team2 = team2;
if (timestamp) params.timestamp = new Date(timestamp).toISOString();

    const key = JSON.stringify(params);

    // Return cached data if available
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
        const res = await axios.get(`${BASE_URL}/api/nfl/historical`, {
          params,
          cancelToken: cancelSource.token,
        });

        let games: HistoricalNFLGameOdds[] = res.data.games || [];

        // Optional: filter by timestamp ±2h client-side (if API doesn't support exact timestamp)
        if (timestamp) {
          const target = new Date(timestamp).getTime();
          games = games.filter((g) => {
            const commence = new Date(g.commence_time).getTime();
            return Math.abs(commence - target) <= 2 * 60 * 60 * 1000; // ±2h
          });
        }

        cache[key] = games;
        setData(games);
        setError(null);
      } catch (err: any) {
        if (axios.isCancel(err)) return;
        setError(
          err.response?.data?.error || err.message || "Failed to fetch NFL historical odds"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelSource.cancel("Component unmounted");
    };
  }, [date, timestamp, team1, team2, skip]);

  return { data, loading, error, hasData: data.length > 0 };
};
