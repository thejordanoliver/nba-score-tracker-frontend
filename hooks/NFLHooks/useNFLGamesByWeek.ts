import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import type { Game, NFLGamesResponse, NFLGame } from "types/nfl";

const KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
const HOST = process.env.EXPO_PUBLIC_FOOTBALL_RAPIDAPI_HOST;

export function useNFLGamesByWeek() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeScores = (
    scores?: {
      total?: number;
      quarter_1?: number;
      quarter_2?: number;
      quarter_3?: number;
      quarter_4?: number;
      overtime?: number;
    }
  ): Record<string, number | null> => ({
    total: scores?.total ?? null,
    q1: scores?.quarter_1 ?? null,
    q2: scores?.quarter_2 ?? null,
    q3: scores?.quarter_3 ?? null,
    q4: scores?.quarter_4 ?? null,
    ot: scores?.overtime ?? null,
  });

  // make fetchGames reusable (for refresh)
  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get<NFLGamesResponse>(
        "https://api-american-football.p.rapidapi.com/games",
        {
          params: { league: "1", season: "2025" },
          headers: {
            "x-rapidapi-key": KEY,
            "x-rapidapi-host": HOST,
          },
        }
      );

      const mapped: Game[] = (response.data.response || []).map((g: NFLGame) => ({
        game: {
          id: Number(g.game.id),
          stage: "Regular Season",
          week: (g as any).game.week ?? "Week 1",
          date: {
            timezone: "UTC",
            date: new Date(g.game.date.timestamp * 1000)
              .toISOString()
              .split("T")[0],
            time: new Date(g.game.date.timestamp * 1000)
              .toISOString()
              .split("T")[1]
              .slice(0, 5),
            timestamp: g.game.date.timestamp,
          },
          venue: g.game.venue ?? { name: "", city: "" },
          status: {
            short: g.game.status.short,
            long: g.game.status.long,
            timer: g.game.status.timer ?? null,
          },
        },
        teams: g.teams,
        scores: {
          home: normalizeScores(g.scores?.home),
          away: normalizeScores(g.scores?.away),
        },
        league: {
          id: 1,
          name: "NFL",
          season: "2025",
          logo: "https://media.api-sports.io/american-football/leagues/1.png",
        },
      }));

      setGames(mapped);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const currentWeekGames = useMemo(() => {
    if (!games.length) return [];

    // group by week
    const weeks: Record<string, Game[]> = {};
    games.forEach((g) => {
      const week = g.game.week;
      if (!weeks[week]) weeks[week] = [];
      weeks[week].push(g);
    });

    // sort weeks numerically
    const sortedWeeks = Object.keys(weeks).sort((a, b) => {
      const numA = parseInt(a.replace("Week ", ""), 10);
      const numB = parseInt(b.replace("Week ", ""), 10);
      return numA - numB;
    });

    for (let i = 0; i < sortedWeeks.length; i++) {
      const week = sortedWeeks[i];
      const weekGames = weeks[week];

      // last game in this week
      const lastGame = weekGames.reduce((latest, g) =>
        g.game.date.timestamp > latest.game.date.timestamp ? g : latest
      );

      // unfinished games → current week
      const unfinished = weekGames.some(
        (g) =>
          g.game.status.short !== "FT" &&
          g.game.status.short !== "CANC" &&
          g.game.status.short !== "PST"
      );
      if (unfinished) return weekGames;

      // finished but still today → current week
      const lastGameEndDay = new Date(
        lastGame.game.date.timestamp * 1000
      ).toDateString();
      const today = new Date().toDateString();
      if (today === lastGameEndDay) return weekGames;

      // otherwise → move to next week
      if (i < sortedWeeks.length - 1) {
        return weeks[sortedWeeks[i + 1]];
      }
    }

    return [];
  }, [games]);

  return { games: currentWeekGames, loading, error, refreshGames: fetchGames };
}
