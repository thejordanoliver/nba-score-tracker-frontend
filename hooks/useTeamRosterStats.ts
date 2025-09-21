// hooks/useTeamRosterStats.ts
import { useEffect, useState } from "react";
import axios from "axios";

const API_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;

type Player = {
  id: number;
  firstname: string;
  lastname: string;
  birth: { date: string };
  height: string;
  weight: string;
  college: string;
  nba: { start: number; pro: number };
  leag: string;
  headshot_url?: string;
  active: boolean;
};

type PlayerStat = {
  player: { id: number; firstname: string; lastname: string };
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
  plusMinus: string;
};

type AggregatedStats = {
  playerId: number;
  name: string;
  headshot_url?: string;
  gamesPlayed: number;
  minutesPlayed: number;
  totalPoints: number;
  totalRebounds: number;
  totalAssists: number;
  totalSteals: number;
  totalBlocks: number;
  totalTurnovers: number;
  totalFouls: number;
  totalFGM: number;
  totalFGA: number;
  totalFGP: number;
  total3PM: number;
  total3PA: number;
  total3PP: number;
  totalFTM: number;
  totalFTA: number;
  totalFTP: number;
  totalOffReb: number;
  totalDefReb: number;
  plusMinus: number;
};

const API_HEADERS = {
  "x-rapidapi-key": API_KEY,
  "x-rapidapi-host": "api-nba-v1.p.rapidapi.com",
};

export function useTeamRosterStats(teamId: number, season = "2024") {
  const [rosterStats, setRosterStats] = useState<AggregatedStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!teamId) return;

    const fetchRosterAndStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const playersRes = await axios.get("https://api-nba-v1.p.rapidapi.com/players", {
          params: { team: teamId, season },
          headers: API_HEADERS,
        });

        const players: Player[] = playersRes.data.response;

        const statPromises = players.map(async (player) => {
          try {
            const statsRes = await axios.get<{ response: PlayerStat[] }>(
              "https://api-nba-v1.p.rapidapi.com/players/statistics",
              {
                params: { id: player.id, season },
                headers: API_HEADERS,
              }
            );

            const games = statsRes.data.response;
            if (!games.length) return null;

            const totals: AggregatedStats = {
              playerId: player.id,
              name: `${player.firstname} ${player.lastname}`,
              headshot_url: player.headshot_url,
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
              totalFGP: 0,
              totalFTM: 0,
              totalFTA: 0,
              totalFTP: 0,
              total3PM: 0,
              total3PA: 0,
              total3PP: 0,
              totalOffReb: 0,
              totalDefReb: 0,
              plusMinus: 0,
              minutesPlayed: 0,
            };

            games.forEach((g) => {
              totals.totalPoints += g.points ?? 0;
              totals.totalRebounds += g.totReb ?? 0;
              totals.totalAssists += g.assists ?? 0;
              totals.totalSteals += g.steals ?? 0;
              totals.totalBlocks += g.blocks ?? 0;
              totals.totalTurnovers += g.turnovers ?? 0;
              totals.totalFouls += g.pFouls ?? 0;
              totals.totalFGM += g.fgm ?? 0;
              totals.totalFGA += g.fga ?? 0;
              totals.totalFTM += g.ftm ?? 0;
              totals.totalFTA += g.fta ?? 0;
              totals.total3PM += g.tpm ?? 0;
              totals.total3PA += g.tpa ?? 0;
              totals.totalOffReb += g.offReb ?? 0;
              totals.totalDefReb += g.defReb ?? 0;

              if (g.plusMinus) {
                const parsed = parseInt(g.plusMinus, 10);
                totals.plusMinus += isNaN(parsed) ? 0 : parsed;
              }

              if (g.min) {
                const [min, sec] = g.min.split(":").map(Number);
                totals.minutesPlayed += (min || 0) + (sec || 0) / 60;
              }
            });

            return totals;
          } catch {
            return null;
          }
        });

        const results = await Promise.all(statPromises);
        const filtered = results.filter(Boolean) as AggregatedStats[];
        setRosterStats(filtered);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRosterAndStats();
  }, [teamId, season]);

  return { rosterStats, loading, error };
}
