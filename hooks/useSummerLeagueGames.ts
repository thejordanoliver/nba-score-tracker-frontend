import axios from "axios";
import { teams } from "constants/teams";
import { useEffect, useRef, useState } from "react";
import type { GameStatus, summerGame } from "types/types";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const RATE_LIMIT_MS = 30 * 1000;

type ApiGame = {
  id: number;
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  stage: number | null;
  week: number | null;
  venue: string;
  status: {
    long: string;
    short: string;
    timer: string;
  };
  league: {
    id: number;
    name: string;
    type: string;
    season: number;
    logo: string;
  };
  country: {
    id: number;
    name: string;
    code: string;
    flag: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  scores: {
    home: {
      quarter_1: number | null;
      quarter_2: number | null;
      quarter_3: number | null;
      quarter_4: number | null;
      over_time: number | null;
      total: number | null;
    };
    away: {
      quarter_1: number | null;
      quarter_2: number | null;
      quarter_3: number | null;
      quarter_4: number | null;
      over_time: number | null;
      total: number | null;
    };
  };
};

function normalizeName(name: string) {
  return name.toLowerCase().replace("la ", "los angeles ").trim();
}

const teamsByFullName = Object.fromEntries(
  teams.map((team) => [normalizeName(team.fullName), team])
);

function validateAndFormatTimer(timer?: string): string | undefined {
  if (!timer) return undefined;

  const trimmed = timer.trim();
  if (!trimmed) return undefined;

  if (/^\d+$/.test(trimmed)) {
    const minutes = parseInt(trimmed, 10);
    if (isNaN(minutes) || minutes < 0) return undefined;
    return `${minutes}:00`;
  }

  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  return undefined;
}

function getQuarterScore(
  scores: ApiGame["scores"]["home"],
  quarter: number
): number | undefined {
  switch (quarter) {
    case 1:
      return scores.quarter_1 ?? undefined;
    case 2:
      return scores.quarter_2 ?? undefined;
    case 3:
      return scores.quarter_3 ?? undefined;
    case 4:
      return scores.quarter_4 ?? undefined;
    default:
      return undefined;
  }
}

function transformGames(data: ApiGame[]): summerGame[] {
  return data.map((game) => {
    const normalizedHomeName = normalizeName(game.teams.home.name);
    const normalizedAwayName = normalizeName(game.teams.away.name);

    const homeTeam = teamsByFullName[normalizedHomeName];
    const awayTeam = teamsByFullName[normalizedAwayName];

    const currentQuarterStr = game.status?.short || "";
    const currentQuarterNum =
      parseInt(currentQuarterStr.replace("Q", ""), 10) || undefined;

    const dateObj = new Date(game.date);

    const optionsTime: Intl.DateTimeFormatOptions = {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    const formattedTime = dateObj.toLocaleTimeString("en-US", optionsTime);
    const formattedMonthDay = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

    const status: GameStatus = {
      long: game.status.long,
      short: game.status.short,
      timer: game.status.timer ?? null,
    };

    const displayTime =
      status.long === "Not Started" || status.short === "NS"
        ? formattedMonthDay
        : formattedTime;

    return {
      id: game.id,
      date: game.date,
      time: displayTime,
      status,
      period: currentQuarterNum,
      clock: validateAndFormatTimer(game.status?.timer),
      timezone: game.timezone,
      homeScore:
        typeof game.scores?.home?.total === "number"
          ? game.scores.home.total
          : undefined,
      awayScore:
        typeof game.scores?.away?.total === "number"
          ? game.scores.away.total
          : undefined,
      home: {
        id: game.teams.home.id.toString(),
        name: homeTeam?.name || game.teams.home.name,
        logo: homeTeam?.logo || game.teams.home.logo,
        logoLight: homeTeam?.logoLight,
        fullName: homeTeam?.fullName,
      },
      away: {
        id: game.teams.away.id.toString(),
        name: awayTeam?.name || game.teams.away.name,
        logo: awayTeam?.logo || game.teams.away.logo,
        logoLight: awayTeam?.logoLight,
        fullName: awayTeam?.fullName,
      },
      currentHomeScore: getQuarterScore(
        game.scores.home,
        currentQuarterNum ?? 0
      ),
      currentAwayScore: getQuarterScore(
        game.scores.away,
        currentQuarterNum ?? 0
      ),
      scores: {
        home: {
          q1: game.scores.home.quarter_1 ?? undefined,
          q2: game.scores.home.quarter_2 ?? undefined,
          q3: game.scores.home.quarter_3 ?? undefined,
          q4: game.scores.home.quarter_4 ?? undefined,
          ot: game.scores.home.over_time ?? undefined,
          total: game.scores.home.total ?? undefined,
        },
        away: {
          q1: game.scores.away.quarter_1 ?? undefined,
          q2: game.scores.away.quarter_2 ?? undefined,
          q3: game.scores.away.quarter_3 ?? undefined,
          q4: game.scores.away.quarter_4 ?? undefined,
          ot: game.scores.away.over_time ?? undefined,
          total: game.scores.away.total ?? undefined,
        },
      },
      venue: game.venue,
      stage: game.stage ?? undefined,
      isHalftime: false,
      league: {
        name: game.league?.name,
      },
    };
  });
}

export function useSummerLeagueGames() {
  const [games, setGames] = useState<summerGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchGames = async () => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current < RATE_LIMIT_MS) {
      console.warn("Rate limit hit: please wait before refreshing again.");
      return;
    }

    try {
      setLoading(true);
      lastFetchTimeRef.current = now;

      const apiKey = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;

      const headers = {
        "x-api-key": apiKey,
      };

      const [mainRes, utahRes] = await Promise.all([
        axios.get(`${API_URL}/api/summer-league/games`, { headers }),
        axios.get(`${API_URL}/api/summer-league/utah/games`, { headers }),
      ]);

      const mainGames: ApiGame[] = Array.isArray(mainRes.data)
        ? mainRes.data
        : [];
      const utahGames: ApiGame[] = Array.isArray(utahRes.data)
        ? utahRes.data
        : [];

      const allGames = [...mainGames, ...utahGames];
      const transformed = transformGames(allGames);

      setGames(transformed);
      setError(null);
    } catch (err: any) {
      console.error("Axios error:", err);
      setError(err?.response?.data?.message || err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  return {
    games,
    loading,
    error,
    refreshGames: fetchGames,
  };
}
