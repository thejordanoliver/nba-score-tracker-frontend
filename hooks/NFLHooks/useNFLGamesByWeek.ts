import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Game } from "types/nfl";

type WeekObject = {
  stage: string;       // "Pre Season", "Regular Season", "Playoffs", "Super Bowl"
  weekNumber: number;  // numeric week for preseason/regular season, 1-4 for playoffs
  label?: string;      // e.g., "Wild Card", "Divisional" (needed for playoffs)
};

type UseNFLGamesByWeekParams = {
  week: WeekObject;
  date?: string;
};

const KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
const HOST = process.env.EXPO_PUBLIC_FOOTBALL_RAPIDAPI_HOST;

export const useNFLGamesByWeek = ({ week, date }: UseNFLGamesByWeekParams) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        "https://api-american-football.p.rapidapi.com/games",
        {
          params: { league: "1", season: 2025 },
          headers: { "x-rapidapi-key": KEY, "x-rapidapi-host": HOST },
        }
      );

      if (response.data?.response) {
        const filtered = response.data.response.filter((g: any) => {
          const apiStage = g.game.stage; // e.g., "Regular Season" or "Post Season"
          const apiWeek = g.game.week;   // e.g., "1", "2", "Wild Card", etc.

          if (week.stage === "Pre Season" || week.stage === "Regular Season") {
            const apiWeekNumber = parseInt(apiWeek.replace(/[^\d]/g, ""), 10);
            return apiStage === week.stage && apiWeekNumber === week.weekNumber;
          }

          // Playoffs / Super Bowl
          if (week.stage === "Playoffs" || week.stage === "Super Bowl") {
            return (
              apiStage === "Post Season" &&
              week.label &&
              apiWeek.toLowerCase() === week.label.toLowerCase()
            );
          }

          return false;
        });

        setGames(filtered);
      } else {
        setGames([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch games");
    } finally {
      setLoading(false);
    }
  }, [week]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return { games, loading, error, refresh: fetchGames };
};
