import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { teams } from "../constants/teams"; // adjust path if needed

type ApiGame = {
  id: number;
  date: { start: string };
  status: { long: string };
  teams: {
    home: { id: number; code: string };
    visitors: { id: number; code: string };
  };
  scores: {
    home: { points: number };
    visitors: { points: number };
  };
};

type ApiResponse = {
  response: ApiGame[];
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
  opponentLogoLight?: any; // added light logo here
};

export const useLastFiveGames = (teamId: number) => {
  const [games, setGames] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fallbackLogo = require("../assets/Logos/NBA.png");

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });

  const teamsMap = useMemo(() => {
    const map = new Map<
      number,
      { logo: any; logoLight?: any; code: string }
    >();
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
          `https://api-nba-v1.p.rapidapi.com/games`,
          {
            params: { team: teamId, season: 2024 },
            headers: {
              "X-RapidAPI-Key": process.env.EXPO_PUBLIC_RAPIDAPI_KEY!,
              "X-RapidAPI-Host": "api-nba-v1.p.rapidapi.com",
            },
          }
        );

        const recentGames = response.data.response
          .filter((g) => g.status.long === "Finished")
          .sort(
            (a, b) =>
              new Date(b.date.start).getTime() -
              new Date(a.date.start).getTime()
          )
          .slice(0, 5)
          .map((g) => {
            const isHome = g.teams.home.id === teamId;
            const won =
              (isHome && g.scores.home.points > g.scores.visitors.points) ||
              (!isHome && g.scores.visitors.points > g.scores.home.points);

            const opponentId = isHome
              ? g.teams.visitors.id
              : g.teams.home.id;

            const teamData = teamsMap.get(teamId);
            const opponentData = teamsMap.get(opponentId);

            return {
              id: g.id,
              date: formatDate(g.date.start),
              homeTeam: g.teams.home.code,
              awayTeam: g.teams.visitors.code,
              homeScore: g.scores.home.points,
              awayScore: g.scores.visitors.points,
              isHome,
              won,
              teamLogo: teamData?.logo || fallbackLogo,
              opponentId,
              opponent: opponentData?.code || "UNK",
              opponentLogo: opponentData?.logo || fallbackLogo,
              opponentLogoLight: opponentData?.logoLight, // <-- added here
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
