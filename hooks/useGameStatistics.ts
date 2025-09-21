import { useEffect, useState } from "react";
import axios from "axios";
import { loadGameStats, saveGameStats } from "utils/gameStatsStorage";

export type TeamStat = {
  team: {
    id: number;
    name: string;
    nickname: string;
    code: string;
    logo: string;
  };
  statistics: {
    fastBreakPoints: number;
    pointsInPaint: number;
    biggestLead: number;
    secondChancePoints: number;
    pointsOffTurnovers: number;
    longestRun: number;
    points: number;
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
    plusMinus: string;
    min: string;
  };
};

const API_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;


export function useGameStatistics(gameId: number) {
  const [data, setData] = useState<TeamStat[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);

        const cached = await loadGameStats(gameId);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }

        const res = await axios.get("https://api-nba-v1.p.rapidapi.com/games/statistics", {
          params: { id: gameId },
          headers: {
            "x-rapidapi-key": API_KEY,
            "x-rapidapi-host": "api-nba-v1.p.rapidapi.com",
          },
        });

        setData(res.data.response);
        saveGameStats(gameId, res.data.response);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch game statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [gameId]);

  return { data, loading, error };
}
