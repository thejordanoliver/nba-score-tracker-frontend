import { Game } from "types/types";
import axios from "axios";
import rateLimit from "axios-rate-limit";
import { useEffect, useState } from "react";
import {
  RawNBAGame,
  transformGameData,
} from "../utils/transformGameData";

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.EXPO_PUBLIC_RAPIDAPI_HOST || "";

// Create rate-limited axios instance
const http = rateLimit(axios.create({}), {
  maxRequests: 2,
  perMilliseconds: 1000,
});

// Type for team response
type TeamResponse = { id: number; nickname: string };

// Fetch team nicknames
const fetchTeamNicknames = async (): Promise<Record<number, string>> => {
  const res = await http.get<{ response: TeamResponse[] }>(
    `https://${RAPIDAPI_HOST}/teams`,
    {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    }
  );

  const map: Record<number, string> = {};
  res.data.response.forEach(({ id, nickname }: TeamResponse) => {
    map[id] = nickname;
  });

  return map;
};

// Type for standings API response
type StandingTeam = {
  team: { id: number };
  win?: { total: number };
  loss?: { total: number };
  games?: { wins: number; losses: number };
};

const fetchTeamStandings = async (): Promise<
  Record<string, { wins: number; losses: number }>
> => {
  const today = new Date();
  const seasonYear =
    today.getMonth() < 7 ? today.getFullYear() - 1 : today.getFullYear();

  const res = await http.get<{ response: StandingTeam[] }>(
    `https://${RAPIDAPI_HOST}/standings`,
    {
      params: { season: seasonYear, league: "standard" },
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    }
  );

  const standingsMap: Record<string, { wins: number; losses: number }> = {};
  res.data.response.forEach((team: StandingTeam) => {
    const teamId = team.team.id.toString();
    const wins = team.win?.total ?? team.games?.wins ?? 0;
    const losses = team.loss?.total ?? team.games?.losses ?? 0;
    standingsMap[teamId] = { wins, losses };
  });

  return standingsMap;
};

// Hook to fetch weekly games
export function useWeeklyGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshGames = async () => {
    try {
      setLoading(true);
      setError(null);

      const [teamNicknames, teamStandings] = await Promise.all([
        fetchTeamNicknames(),
        fetchTeamStandings(),
      ]);

      const today = new Date();
      const dateStrings: string[] = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        return date.toISOString().split("T")[0];
      });

      const allGames: Game[] = [];

      for (const date of dateStrings) {
        const res = await http.get<{ response: RawNBAGame[] }>(
          `https://${RAPIDAPI_HOST}/games`,
          {
            params: { date },
            headers: {
              "X-RapidAPI-Key": RAPIDAPI_KEY,
              "X-RapidAPI-Host": RAPIDAPI_HOST,
            },
          }
        );

        const dayGames = res.data.response.map((game: RawNBAGame) => {
          // Override team names with nicknames if available
          game.teams.home.name =
            teamNicknames[game.teams.home.id] || game.teams.home.name;
          game.teams.visitors.name =
            teamNicknames[game.teams.visitors.id] || game.teams.visitors.name;

          // Use playoff logic based on date
          const gameDate = new Date(game.date.start);
          const playoffStart = new Date("2025-04-20");
          const playoffEnd = new Date("2025-06-30");
          const isPlayoff = gameDate >= playoffStart && gameDate <= playoffEnd;

          (game as any).isPlayoff = isPlayoff;

          return transformGameData(game, teamStandings);
        });

        allGames.push(...dayGames);
      }

      setGames(allGames);
    } catch (err) {
      console.error("Error fetching weekly games:", err);
      setError("Failed to fetch games");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshGames();
  }, []);

  return { games, loading, error, refreshGames };
}
