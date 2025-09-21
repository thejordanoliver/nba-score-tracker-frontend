import axios from "axios";
import { useEffect, useState } from "react";

type PlayerStat = {
  game: { date: string };
  points: number;
  min: string;
  fgm: number;
  fga: number;
  fgp: string;
  ftm: number;
  fta: number;
  ftp: string;
  tpm: number;
  tpa: number;
  tpp: string;
  offReb: number;
  defReb: number;
  totReb: number;
  assists: number;
  pFouls: number;
  steals: number;
  turnovers: number;
  blocks: number;
  plusMinus?: string;
};

type SeasonStat = {
  season: string;
  games: PlayerStat[];
};

const cache = new Map<string, SeasonStat[]>();

export function usePlayerStatsBySeason(playerId: number, seasons: string[]) {
  const [data, setData] = useState<SeasonStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cacheKey = `${playerId}-${seasons.join(",")}`;

  useEffect(() => {
    if (!playerId || !seasons?.length) return;

    const fetchAll = async () => {
      // Use cached data if available
      if (cache.has(cacheKey)) {
        setData(cache.get(cacheKey)!);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const allStats: SeasonStat[] = [];

        for (const season of seasons) {
          const res = await axios.get<{ response: PlayerStat[] }>(
            "https://api-nba-v1.p.rapidapi.com/players/statistics",
            {
              params: { id: playerId.toString(), season },
              headers: {
                "X-RapidAPI-Key": process.env.EXPO_PUBLIC_RAPIDAPI_KEY!,
                "X-RapidAPI-Host": "api-nba-v1.p.rapidapi.com",
              },
            }
          );

          if (res.data.response.length > 0) {
            allStats.push({
              season,
              games: res.data.response,
            });
          }
        }

        // Cache result
        cache.set(cacheKey, allStats);
        setData(allStats);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [cacheKey, playerId, seasons]);

  return { data, loading, error };
}
