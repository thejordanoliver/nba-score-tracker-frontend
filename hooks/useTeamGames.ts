import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import {
  RawNBAGame,
  transformGameData,
} from "../utils/transformGameData";
import { teams } from "../constants/teams";

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.EXPO_PUBLIC_RAPIDAPI_HOST || "";

interface ApiResponse<T> {
  response: T;
}

interface Standing {
  team: {
    id: number;
    name?: string;
  };
  win: {
    total: number;
  };
  loss: {
    total: number;
  };
}

export function useTeamGames(teamId?: string) {
  const [games, setGames] = useState<ReturnType<typeof transformGameData>[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchGames = useCallback(async () => {
    if (!teamId) return;

    setLoading(true);
    setError(null);

    try {
      const headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      };

      // Fetch games for the team
      const gamesRes = await axios.get<ApiResponse<RawNBAGame[]>>(
        `https://${RAPIDAPI_HOST}/games`,
        {
          params: { team: teamId, season: "2025" },
          headers,
        }
      );

      // Fetch standings for records
      const standingsRes = await axios.get<ApiResponse<Standing[]>>(
        `https://${RAPIDAPI_HOST}/standings`,
        {
          params: { season: "2025", league: "standard" },
          headers,
        }
      );

      const gamesData = gamesRes.data.response;
      const standingsData = standingsRes.data.response;

      // Map team IDs to their win-loss records
      const recordsMap: Record<string, { wins: number; losses: number }> = {};
      standingsData.forEach((standing) => {
        if (standing.team?.id) {
          recordsMap[standing.team.id.toString()] = {
            wins: standing.win.total,
            losses: standing.loss.total,
          };
        }
      });

      const now = new Date();
      const playoffStart = new Date("2026-04-20");
      const playoffEnd = new Date("2026-06-30");

      const statusCodeMap: Record<number, string> = {
        1: "Scheduled",
        2: "Final",
        3: "In Progress",
        4: "Postponed",
        5: "Delayed",
        6: "Canceled",
      };

      const filteredGames = gamesData.filter((game) => {
        const gameDate = new Date(game.date.start);
        const now = new Date();

        const statusShort =
          typeof game.status?.short === "number" ? game.status.short : -1;
        const status = statusCodeMap[statusShort] || "Unknown";

        const isValidStatus = Object.values(statusCodeMap).includes(status);

        const shouldHide =
          gameDate < now &&
          ["Scheduled", "Postponed", "Delayed"].includes(status);

        return isValidStatus && !shouldHide;
      });

      const enrichedGames = filteredGames.map((game) => {
        const homeTeamLocal = teams.find(
          (t) => t.id.toString() === game.teams.home.id.toString()
        );
        const visitorTeamLocal = teams.find(
          (t) => t.id.toString() === game.teams.visitors.id.toString()
        );

        const gameDate = new Date(game.date.start);
        const isPlayoff = gameDate >= playoffStart && gameDate <= playoffEnd;

        const stage = game.date.stage ?? 0;

        const enrichedGame: RawNBAGame = {
          ...game,
          date: {
            ...game.date,
            stage,
          },
          isPlayoff,
          teams: {
            home: {
              ...game.teams.home,
              name: homeTeamLocal?.name ?? game.teams.home.name,
              logo: homeTeamLocal?.logo ?? game.teams.home.logo ?? "",
            },
            visitors: {
              ...game.teams.visitors,
              name: visitorTeamLocal?.name ?? game.teams.visitors.name,
              logo: visitorTeamLocal?.logo ?? game.teams.visitors.logo ?? "",
            },
          },
          periods: game.periods,
          scores: game.scores,
        };

        return transformGameData(enrichedGame, recordsMap);
      });

      setGames(enrichedGames);
    } catch (err) {
      console.error("Failed to fetch team games or standings:", err);
      setError("Failed to fetch data.");
      setGames([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const refresh = useCallback(() => {
    if (!teamId) return;
    setRefreshing(true);
    fetchGames();
  }, [teamId, fetchGames]);

  return { games, loading, error, refresh, refreshing };
}
