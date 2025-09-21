import axiosOriginal from "axios";
import rateLimitOriginal from "axios-rate-limit";
import { useEffect, useState } from "react";
import { transformGameData } from "../utils/transformGameData";

type APIGame = {
  id: number;
  date: {
    start: string;
    stage: number; // add this here
  };
  status: {
    long: string;
    short: string;
    clock?: string;
    halftime?: boolean; // <-- added
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
  isPlayoff: boolean; // <--- add this property

  teams: {
    home: APIGame["teams"]["home"] & {
      record: { wins: number; losses: number };
    };
    visitors: APIGame["teams"]["visitors"] & {
      record: { wins: number; losses: number };
    };
  };
};

export type TransformedGame = ReturnType<typeof transformGameData>;

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.EXPO_PUBLIC_RAPIDAPI_HOST || "";

const axiosInstance = axiosOriginal.create({}); // <-- fixed here with empty config object

const http = rateLimitOriginal(axiosInstance, {
  maxRequests: 2,
  perMilliseconds: 1000,
});

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
  res.data.response.forEach(
    (team: {
      team?: { id: number };
      win: { total: number };
      loss: { total: number };
    }) => {
      if (team.team?.id && team.win && team.loss) {
        standingsMap[team.team.id] = {
          wins: team.win.total,
          losses: team.loss.total,
        };
      }
    }
  );

  return standingsMap;
};

export function useLiveGames() {
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

      const res = await http.get<{ response: APIGame[] }>(
        `https://${RAPIDAPI_HOST}/games`,
        {
          params: { live: "all" },
          headers: {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": RAPIDAPI_HOST,
          },
        }
      );

      const liveGames = res.data.response.map((game: APIGame) => {
        if (game.status.long === "Halftime") {
          game.status.halftime = true;
        } else {
          game.status.halftime = false;
        }

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

          const extendedGame: ExtendedAPIGame = {
            ...game,
            isPlayoff: false, // Add this
            teams: {
              home: { ...game.teams.home, record: homeRecord },
              visitors: { ...game.teams.visitors, record: visitorRecord },
            },
          };

          return transformGameData(extendedGame);
        }

        return transformGameData({
          ...game,
          isPlayoff: false, // Add this
        } as ExtendedAPIGame);
      });

      setGames(liveGames);
    } catch (error) {
      console.error("Error fetching live games:", error);
      setError("Failed to fetch live games");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const fetchAndSetInterval = async () => {
      await refreshGames();

      // Check if there are live games before polling
      if (games.length > 0) {
        interval = setInterval(refreshGames, 30000);
      }
    };

    fetchAndSetInterval();

    return () => clearInterval(interval);
  }, []);

  return { games, loading, error, refreshGames };
}
