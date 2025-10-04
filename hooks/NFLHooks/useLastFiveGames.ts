import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { teams } from "constants/teamsNFL";

type ApiResponse = {
  response: any[];
};

type GameResult = {
  id: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  isHome: boolean;
  won: boolean;
  teamLogo: any;
  opponentId: number;
  opponent: string;
  opponentLogo: any;
  opponentLogoLight?: any;
};

export const useLastFiveGames = (teamId: number) => {
  const [games, setGames] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fallbackLogo = require("assets/Football/NFL_Logos/NFL.png");

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });

  const teamsMap = useMemo(() => {
    const map = new Map<number, { logo: any; logoLight?: any; code: string }>();
    teams.forEach((t) =>
      map.set(Number(t.id), {
        logo: t.logo,
        logoLight: t.logoLight,
        code: t.code,
      })
    );
    return map;
  }, []);

  useEffect(() => {
    const fetchLastGames = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get<ApiResponse>(
          "https://api-american-football.p.rapidapi.com/games",
          {
            params: { team: teamId, season: 2025 },
            headers: {
              "X-RapidAPI-Key": process.env.EXPO_PUBLIC_RAPIDAPI_KEY!,
              "X-RapidAPI-Host": "api-american-football.p.rapidapi.com",
            },
          }
        );

        const recentGames = response.data.response
          .filter((g) => g.game.status.long === "Finished")
          .sort(
            (a, b) => b.game.date.timestamp - a.game.date.timestamp
          )
          .slice(0, 5)
          .map((g) => {
            const isHome = g.teams.home.id === teamId;
            const homeScore = g.scores.home.total ?? 0;
            const awayScore = g.scores.away.total ?? 0;

            const won =
              (isHome && homeScore > awayScore) ||
              (!isHome && awayScore > homeScore);

            const opponentId = isHome ? g.teams.away.id : g.teams.home.id;
            const teamData = teamsMap.get(teamId);
            const opponentData = teamsMap.get(opponentId);

            return {
              id: g.game.id,
              date: formatDate(g.game.date.date),
              homeTeam: g.teams.home.name,
              awayTeam: g.teams.away.name,
              homeScore,
              awayScore,
              isHome,
              won,
              teamLogo: teamData?.logo || fallbackLogo,
              opponentId,
              opponent: opponentData?.code || "UNK",
              opponentLogo: opponentData?.logo || fallbackLogo,
              opponentLogoLight: opponentData?.logoLight,
            };
          });

        setGames(recentGames);
      } catch (err) {
        console.error("Error fetching last games", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (teamId) fetchLastGames();
  }, [teamId, teamsMap]);

  return { games, loading, error };
};
