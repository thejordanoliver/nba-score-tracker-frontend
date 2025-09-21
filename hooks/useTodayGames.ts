// useTodayGames.ts
import axios from "axios";
import rateLimit from "axios-rate-limit";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { transformGameData } from "../utils/transformGameData";

type APIGame = {
  id: number;
  date: {
    start: string;
    stage: number; // ✅ Add this line
  };
  status: {
    long: string;
    short: string;
    clock?: string;
  };
  periods: {
    current: number;
    total: number;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    visitors: { id: number; name: string; logo: string };
  };
  scores: {
    home: { points: number | null };
    visitors: { points: number | null };
  };
};

type ExtendedAPIGame = APIGame & {
  teams: {
    home: APIGame["teams"]["home"] & {
      record: { wins: number; losses: number };
    };
    visitors: APIGame["teams"]["visitors"] & {
      record: { wins: number; losses: number };
    };
  };
};

type TransformedGame = ReturnType<typeof transformGameData>;

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.EXPO_PUBLIC_RAPIDAPI_HOST || "";

const http = rateLimit(axios.create({}), {
  maxRequests: 2,
  perMilliseconds: 1000,
});

const fetchTeamNicknames = async (): Promise<Record<number, string>> => {
  const res = await axios.get<{ response: { id: number; nickname: string }[] }>(
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

const fetchTeamStandings = async (): Promise<
  Record<number, { wins: number; losses: number }>
> => {
  const seasonYear = new Date().getFullYear();
  const res = await http.get<{ response: any[] }>(
    `https://${RAPIDAPI_HOST}/standings`,
    {
      params: { season: seasonYear },
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    }
  );

  const standingsMap: Record<number, { wins: number; losses: number }> = {};
  res.data.response.forEach((team: any) => {
    if (team.team?.id && team.win && team.loss) {
      standingsMap[team.team.id] = {
        wins: team.win.total,
        losses: team.loss.total,
      };
    }
  });

  return standingsMap;
};

export function useTodayGames() {
  const [games, setGames] = useState<TransformedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshGames = async () => {
    try {
      setLoading(true);
      setError(null);

      const [teamMap, standingsMap] = await Promise.all([
        fetchTeamNicknames(),
        fetchTeamStandings(),
      ]);

      // Current date/time in Eastern Time zone
      const todayET = DateTime.now().setZone("America/New_York");

      // Fetch games for today and tomorrow ET to cover all games that might fall into today ET
      const dateStrings = [
        todayET.toFormat("yyyy-MM-dd"),
        todayET.plus({ days: 10 }).toFormat("yyyy-MM-dd"),
      ];

      const allGames: TransformedGame[] = [];

      for (const date of dateStrings) {
        const res = await http.get<{ response: APIGame[] }>(
          `https://${RAPIDAPI_HOST}/games`,
          {
            params: { date },
            headers: {
              "X-RapidAPI-Key": RAPIDAPI_KEY,
              "X-RapidAPI-Host": RAPIDAPI_HOST,
            },
          }
        );

        const dayGames = res.data.response.map((game: APIGame) => {
          if (game.teams?.home && game.teams?.visitors) {
            game.teams.home.name =
              teamMap[game.teams.home.id] || game.teams.home.name;
            game.teams.visitors.name =
              teamMap[game.teams.visitors.id] || game.teams.visitors.name;

            const homeRecord = standingsMap[game.teams.home.id] || {
              wins: 0,
              losses: 0,
            };
            const visitorRecord = standingsMap[game.teams.visitors.id] || {
              wins: 0,
              losses: 0,
            };

            const extendedGame: ExtendedAPIGame & { isPlayoff: boolean } = {
              ...game,
              teams: {
                home: { ...game.teams.home, record: homeRecord },
                visitors: { ...game.teams.visitors, record: visitorRecord },
              },
              isPlayoff: false,
            };

            return transformGameData(extendedGame);
          }

          return transformGameData({
            ...(game as ExtendedAPIGame),
            isPlayoff: false,
          });
        }); // ✅ You were missing this

        allGames.push(...dayGames); // ✅ This must be outside the map()
      }

      // Filter games to only those starting on today in Eastern Time
      const filteredGames = allGames.filter((game) => {
        // Convert game start date to ET
        const gameStartET = DateTime.fromISO(game.date, {
          zone: "America/New_York",
        });

        // Check if the game's date matches today's date in ET
        return gameStartET.hasSame(todayET, "day");
      });

      setGames(filteredGames);
    } catch (error) {
      console.error("Error fetching weekly games:", error);
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
