import { useEffect, useState } from "react";

interface GameStats {
  points: number;
  totReb: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
}

interface SeasonStats {
  season: string;
  games: GameStats[];
}

export function useHistoricalPlayerStats(seasons: string[]) {
  const [data, setData] = useState<SeasonStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistorical() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("http://YOUR_BACKEND_URL/api/historical-stats");
        if (!response.ok) {
          throw new Error("Failed to fetch historical stats");
        }
        const stats: SeasonStats[] = await response.json();

        // Filter to requested seasons
        const filtered = stats.filter((season) => seasons.includes(season.season));
        setData(filtered);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchHistorical();
  }, [seasons]);

  return { data, loading, error };
}
