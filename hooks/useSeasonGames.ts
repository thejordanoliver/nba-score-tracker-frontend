// useSeasonGames.ts

import { APIGame, TeamRecord } from "types/types";
import axios from "axios";
import rateLimit from "axios-rate-limit";
import { useEffect, useRef, useState } from "react";
import { transformGameData } from "../utils/transformGameData";

type TransformedGame = ReturnType<typeof transformGameData>;

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.EXPO_PUBLIC_RAPIDAPI_HOST || "";

if (!RAPIDAPI_KEY || !RAPIDAPI_HOST) {
  console.warn("RapidAPI credentials are missing. Ensure they're set in .env");
}

const http = rateLimit(axios.create({}), {
  maxRequests: 2,
  perMilliseconds: 1000,
});

const getRecordString = (wins: number, losses: number) => `${wins}-${losses}`;

const SEASON_STAGE_DATES: Record<
  string,
  { playoffStart: string; playoffEnd: string }
> = {
  "2025": {
    playoffStart: "2025-04-20",
    playoffEnd: "2025-06-30",
  },
  "2024": {
    playoffStart: "2024-04-15",
    playoffEnd: "2024-06-30",
  },
};

const fetchTeamNicknames = async (): Promise<Record<number, string>> => {
  const res = await http.get<{ response: { id: number; nickname: string }[] }>(
    `https://${RAPIDAPI_HOST}/teams`,
    {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    }
  );

  const map: Record<number, string> = {};
  res.data.response.forEach((team: { id: number; nickname: string }) => {
    map[team.id] = team.nickname;
  });
  return map;
};

const fetchTeamStandings = async (
  season: string
): Promise<Record<string, TeamRecord>> => {
  try {
    const res = await http.get<{ response: any[] }>(
      `https://${RAPIDAPI_HOST}/standings`,
      {
        params: { season, league: "standard" },
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": RAPIDAPI_HOST,
        },
      }
    );

    const standingsMap: Record<string, TeamRecord> = {};

    res.data.response.forEach((team: any) => {
      const teamId = team.team?.id;
      const wins = team.win?.total ?? team.games?.wins;
      const losses = team.loss?.total ?? team.games?.losses;

      if (teamId != null && wins != null && losses != null) {
        standingsMap[String(teamId)] = {
          wins,
          losses,
          record: getRecordString(wins, losses),
        };
      }
    });

    return standingsMap;
  } catch (error) {
    console.error("Error fetching team standings:", error);
    throw error;
  }
};

const filterGames = (games: APIGame[]): APIGame[] => {
  const now = new Date();
  return games.filter((game) => {
    const gameDate = new Date(game.date.start);
    return !(game.status.long.toLowerCase() === "scheduled" && gameDate < now);
  });
};

const getSeasonStageDates = (season: string) => {
  return SEASON_STAGE_DATES[season] || SEASON_STAGE_DATES["2025"];
};

export function useSeasonGames(season: string) {
  const [games, setGames] = useState<TransformedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheRef = useRef<Map<string, TransformedGame[]>>(new Map());

  const refreshGames = async () => {
    try {
      setLoading(true);
      setError(null);

      if (cacheRef.current.has(season)) {
        setGames(cacheRef.current.get(season)!);
        return;
      }

      const [teamMap, standingsMap] = await Promise.all([
        fetchTeamNicknames(),
        fetchTeamStandings(season),
      ]);

      const res = await http.get<{ response: APIGame[] }>(
        `https://${RAPIDAPI_HOST}/games`,
        {
          params: { season, league: "standard" },
          headers: {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": RAPIDAPI_HOST,
          },
        }
      );

      const filteredGames = filterGames(res.data.response);

      const { playoffStart, playoffEnd } = getSeasonStageDates(season);
      const playoffStartDate = new Date(playoffStart);
      const playoffEndDate = new Date(playoffEnd);

      const seasonGames = filteredGames
        .map((game) => {
          const homeId = String(game.teams.home.id);
          const visitorId = String(game.teams.visitors.id);

          const homeRecord = standingsMap[homeId];
          const visitorRecord = standingsMap[visitorId];

          const isPlayoff =
            new Date(game.date.start) >= playoffStartDate &&
            new Date(game.date.start) <= playoffEndDate;

          const enrichedGame = {
            ...game,
            isPlayoff,
            date: {
              ...game.date,
              stage: isPlayoff ? 2 : 1,
            },
            teams: {
              home: {
                ...game.teams.home,
                name: teamMap[game.teams.home.id] ?? game.teams.home.name,
                ...homeRecord,
              },
              visitors: {
                ...game.teams.visitors,
                name:
                  teamMap[game.teams.visitors.id] ?? game.teams.visitors.name,
                ...visitorRecord,
              },
            },
            scores: {
              home: {
                ...game.scores.home,
              },
              visitors: {
                ...game.scores.visitors,
              },
            },
          };

          return transformGameData(enrichedGame, standingsMap);
        })
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      cacheRef.current.set(season, seasonGames);
      setGames(seasonGames);
    } catch (error) {
      console.error("Error fetching season games:", error);
      setError("Failed to fetch games");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshGames();
  }, [season]);

  return { games, loading, error, refreshGames };
}
