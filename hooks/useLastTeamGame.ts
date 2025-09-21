import { teams } from "constants/teams";
import axios from "axios";
import { useEffect, useState } from "react";
import type { Game } from "types/types";

type GameApiResponse = {
  id: number;
  date: { start: string };
  teams: {
    home: { id: number; name: string };
    visitors: { id: number; name: string };
  };
  scores: {
    home: { points: number };
    visitors: { points: number };
  };
  status: { long: string };
};

export function useLastTeamGame(teamId: number) {
  const [lastGame, setLastGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLastGame = async () => {
      setLoading(true);
      try {
        const response = await axios.get<{ response: GameApiResponse[] }>(
          "https://api-nba-v1.p.rapidapi.com/games",
          {
            params: {
              team: teamId,
              season: "2024",
            },
            headers: {
              "X-RapidAPI-Key": process.env.EXPO_PUBLIC_RAPIDAPI_KEY!,
              "X-RapidAPI-Host": "api-nba-v1.p.rapidapi.com",
            },
          }
        );

        const games = response.data.response;

        // Filter finished games only
        const completedGames = games.filter((g) => g.status.long === "Finished");

        // Sort descending by date
        const sorted = completedGames.sort(
          (a, b) => new Date(b.date.start).getTime() - new Date(a.date.start).getTime()
        );

        const last = sorted[0] ?? null;

        if (last) {
          // Find local team info (note: your `teams` array uses string IDs)
          const homeTeamLocal = teams.find((t) => t.id === String(last.teams.home.id));
          const visitorsTeamLocal = teams.find((t) => t.id === String(last.teams.visitors.id));

          if (!homeTeamLocal || !visitorsTeamLocal) {
            throw new Error("Local team info missing");
          }

          // Construct the Game object matching your type
          const enrichedGame: Game = {
            id: last.id,
            date: last.date.start,
            time: new Date(last.date.start).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }),
            status:
              last.status.long === "Finished"
                ? "Final"
                : (last.status.long as Game["status"]),
            home: homeTeamLocal,
            away: visitorsTeamLocal,
            homeScore: last.scores.home.points,
            awayScore: last.scores.visitors.points,
            // Optionally add other props from your Game type if available
          };

          setLastGame(enrichedGame);
        } else {
          setLastGame(null);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch last game.");
      } finally {
        setLoading(false);
      }
    };

    if (!teamId) return;

    fetchLastGame();
  }, [teamId]);

  return { lastGame, loading, error };
}
