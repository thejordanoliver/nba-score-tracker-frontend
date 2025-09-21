import axios from "axios";
import { useEffect, useState } from "react";

type Team = {
  id: number;
  name: string;
  code: string;
};

export type Game = {
  id: number;
  stage: number;
  status: { long: string };
  teams: { home: Team; visitors: Team };
  scores: {
    home: { points: number };
    visitors: { points: number };
  };
  gameNumber?: number;
  seriesRecord?: string; // e.g. "3-3"
  seriesSummary?: string; // e.g. "TeamA leads series 3-2" or "Series tied 3-3"
};

type SeriesKey = string;

type ApiGameRaw = {
  id: number;
  stage: number;
  status: { long: string };
  teams: {
    home: { id: number; name: string; code: string };
    visitors: { id: number; name: string; code: string };
  };
  scores: {
    home: { points: number };
    visitors: { points: number };
  };
  date: { start: string };
};

type ApiResponse = {
  response: ApiGameRaw[];
};

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.EXPO_PUBLIC_RAPIDAPI_HOST || "";

function getSeriesKey(stage: number, team1Id: number, team2Id: number): string {
  const [low, high] =
    team1Id < team2Id ? [team1Id, team2Id] : [team2Id, team1Id];
  return `stage-${stage}-team${low}-team${high}`;
}

export function useFetchPlayoffGames(
  team1Id: number,
  team2Id: number,
  seasonStartYear: number
) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGames() {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get<ApiResponse>(
          "https://api-nba-v1.p.rapidapi.com/games",
          {
            params: { season: seasonStartYear },
            headers: {
              "x-rapidapi-key": RAPIDAPI_KEY,
              "x-rapidapi-host": RAPIDAPI_HOST,
            },
          }
        );

        const allGamesRaw = response.data.response;

        // Define playoff range (adjust dates if needed)
        const playoffStart = new Date(`${seasonStartYear + 1}-04-15`);
        const playoffEnd = new Date(`${seasonStartYear + 1}-07-01`);

        // Filter playoff games between these two teams in stage 3
        const filteredGames = allGamesRaw.filter((game) => {
          const gameDate = new Date(game.date.start);
          return (
            game.stage === 3 &&
            gameDate >= playoffStart &&
            gameDate <= playoffEnd &&
            ((game.teams.home.id === team1Id && game.teams.visitors.id === team2Id) ||
              (game.teams.home.id === team2Id && game.teams.visitors.id === team1Id)) &&
            (typeof game.scores.home?.points === "number" || game.status.long === "Scheduled")
          );
        });

        // Group games by series key
        const gamesBySeries = new Map<SeriesKey, ApiGameRaw[]>();
        for (const game of filteredGames) {
          const key = getSeriesKey(
            game.stage,
            game.teams.home.id,
            game.teams.visitors.id
          );
          if (!gamesBySeries.has(key)) gamesBySeries.set(key, []);
          gamesBySeries.get(key)!.push(game);
        }

        const mappedGames: Game[] = [];

        for (const seriesGames of gamesBySeries.values()) {
          // Sort games by date ascending
          seriesGames.sort(
            (a, b) =>
              new Date(a.date.start).getTime() -
              new Date(b.date.start).getTime()
          );

          let winsA = 0;
          let winsB = 0;

          const teamA =
            seriesGames[0].teams.home.id < seriesGames[0].teams.visitors.id
              ? seriesGames[0].teams.home
              : seriesGames[0].teams.visitors;

          const teamB =
            teamA.id === seriesGames[0].teams.home.id
              ? seriesGames[0].teams.visitors
              : seriesGames[0].teams.home;

          seriesGames.forEach((game, index) => {
            const home = game.teams.home;
            const visitors = game.teams.visitors;
            const homeScore = game.scores.home.points ?? 0;
            const visitorScore = game.scores.visitors.points ?? 0;
            const finished = game.status.long === "Finished";

            // Count wins only for finished games
            if (finished) {
              const winnerId = homeScore > visitorScore ? home.id : visitors.id;
              if (winnerId === teamA.id) winsA += 1;
              else if (winnerId === teamB.id) winsB += 1;
            }

            // Compose series summary after this game
            let seriesSummary = "";
            if (winsA >= 4 || winsB >= 4) {
              const winner = winsA >= 4 ? teamA : teamB;
              const loserWins = Math.min(winsA, winsB);
              seriesSummary = `${winner.code} won the series 4-${loserWins}`;
            } else if (winsA === winsB) {
              seriesSummary =
                winsA === 0
                  ? `Series between ${teamA.code} and ${teamB.code} not started`
                  : `Series tied ${winsA}-${winsB}`;
            } else {
              const leader = winsA > winsB ? teamA : teamB;
              seriesSummary = `${leader.code} leads series ${Math.max(winsA, winsB)}-${Math.min(winsA, winsB)}`;
            }

            mappedGames.push({
              id: game.id,
              stage: game.stage,
              status: game.status,
              teams: {
                home: { id: home.id, name: home.name, code: home.code },
                visitors: { id: visitors.id, name: visitors.name, code: visitors.code },
              },
              scores: {
                home: { points: homeScore },
                visitors: { points: visitorScore },
              },
              gameNumber: index + 1, // correct game number within series
              seriesRecord: `${winsA}-${winsB}`,
              seriesSummary,
            });
          });
        }

        setGames(mappedGames);
      } catch (e) {
        setError("Failed to fetch playoff games");
        setGames([]);
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, [team1Id, team2Id, seasonStartYear]);

  return { games, loading, error };
}

export function usePlayoffSeries(games: Game[]) {
  return games; // optional summarization if needed
}
