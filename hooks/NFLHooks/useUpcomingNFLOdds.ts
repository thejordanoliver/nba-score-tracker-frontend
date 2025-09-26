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

export interface UpcomingNFLGameOdds {
  id: string;
  commence_time: string;
  commence_time_local?: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

interface UseUpcomingNFLOddsOptions {
  timestamp?: string | number;
  team1?: string;
  team2?: string;
}

const cache: Record<string, UpcomingNFLGameOdds[]> = {};

export const useUpcomingNFLOdds = ({
  timestamp,
  team1,
  team2,
}: UseUpcomingNFLOddsOptions) => {
  const [data, setData] = useState<UpcomingNFLGameOdds[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastParamsRef = useRef<string | null>(null);

  useEffect(() => {
    const normalizedTs = timestamp
      ? new Date(timestamp).toISOString()
      : undefined;

    const params: Record<string, string> = {};
    if (normalizedTs) params.timestamp = normalizedTs;
    if (team1) params.team1 = team1;
    if (team2) params.team2 = team2;
    params.markets = "h2h,spreads,totals";
    params.bookmakers = "betmgm";

    const key = JSON.stringify(params);

    if (cache[key]) {
      setData(cache[key]);
      setError(null);
      return;
    }

    if (lastParamsRef.current === key) return;
    lastParamsRef.current = key;

    let cancelSource: CancelTokenSource | null = axios.CancelToken.source();

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/nfl/upcoming`, {
          params,
          cancelToken: cancelSource?.token,
        });

        const games: UpcomingNFLGameOdds[] = res.data.games || [];
        cache[key] = games;
        setData(games);
        setError(null);
      } catch (err: any) {
        if (axios.isCancel(err)) return;
        setError(err.response?.data?.error || "Failed to fetch NFL upcoming odds");
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
