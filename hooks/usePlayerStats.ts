import { useEffect, useState } from "react";
import axios from "axios";

type PlayerStat = {
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
  plusMinus: string; // optional to aggregate
};

type AggregatedStats = {
  gamesPlayed: number;
  totalPoints: number;
  totalRebounds: number;
  totalAssists: number;
  totalSteals: number;
  totalBlocks: number;
  totalTurnovers: number;
  totalFouls: number;
  totalFGM: number;
  totalFGA: number;
  totalFTM: number;
  totalFTA: number;
  total3PM: number;
  total3PA: number;
  minutesPlayed: number;
};

export function usePlayerStats(playerId: number, season = "2024") {
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!playerId) return;

    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
   const response = await axios.request<{ response: PlayerStat[] }>({
  method: "GET",
  url: "https://api-nba-v1.p.rapidapi.com/players/statistics",
  params: { id: playerId.toString(), season },
  headers: {
    "x-rapidapi-key": "5ce63285f3msh422b3ebd5978062p13acf6jsn31927b93628c",
    "x-rapidapi-host": "api-nba-v1.p.rapidapi.com",
  },
});

const games = response.data.response || [];


        let totals: AggregatedStats = {
          gamesPlayed: games.length,
          totalPoints: 0,
          totalRebounds: 0,
          totalAssists: 0,
          totalSteals: 0,
          totalBlocks: 0,
          totalTurnovers: 0,
          totalFouls: 0,
          totalFGM: 0,
          totalFGA: 0,
          totalFTM: 0,
          totalFTA: 0,
          total3PM: 0,
          total3PA: 0,
          minutesPlayed: 0,
        };

        games.forEach((g) => {
          totals.totalPoints += g.points || 0;
          totals.totalRebounds += g.totReb || 0;
          totals.totalAssists += g.assists || 0;
          totals.totalSteals += g.steals || 0;
          totals.totalBlocks += g.blocks || 0;
          totals.totalTurnovers += g.turnovers || 0;
          totals.totalFouls += g.pFouls || 0;
          totals.totalFGM += g.fgm || 0;
          totals.totalFGA += g.fga || 0;
          totals.totalFTM += g.ftm || 0;
          totals.totalFTA += g.fta || 0;
          totals.total3PM += g.tpm || 0;
          totals.total3PA += g.tpa || 0;

          // Parse minutes like "17" or "32:10"
          if (g.min) {
            const parts = g.min.split(":").map(Number);
            const minutes = parts[0] || 0;
            const seconds = parts[1] || 0;
            totals.minutesPlayed += minutes + seconds / 60;
          }
        });

        setAggregatedStats(totals);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [playerId, season]);

  return { aggregatedStats, loading, error };
}
