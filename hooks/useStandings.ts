import { useEffect, useState } from "react";
import { teams } from "../constants/teams";
import { TeamStanding } from "types/standingsTypes";

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.EXPO_PUBLIC_RAPIDAPI_HOST || "";

export function useStandings(season = 2025) {
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const response = await fetch(
          `https://${RAPIDAPI_HOST}/standings?season=${season}&league=standard`,
          {
            method: "GET",
            headers: {
              "X-RapidAPI-Key": RAPIDAPI_KEY,
              "X-RapidAPI-Host": RAPIDAPI_HOST,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const json = await response.json();

        const enrichedStandings: TeamStanding[] = json.response.map(
          (teamData: any) => {
            // Find local team logos by id (stored as string in your teams)
            const localTeam = teams.find(
              (t) => Number(t.id) === teamData.team.id
            );

            return {
              league: teamData.league,
              season: teamData.season,
              team: {
                id: teamData.team.id,
                name: teamData.team.name,
                nickname: teamData.team.nickname,
                code: teamData.team.code,
                logo: localTeam?.logo ?? teamData.team.logo,
                logoLight: localTeam?.logoLight ?? null,
              },
              conference: {
                name: teamData.conference.name,
                rank: teamData.conference.rank,
                win: teamData.conference.win,
                loss: teamData.conference.loss,
              },
              division: {
                name: teamData.division.name,
                rank: teamData.division.rank,
                win: teamData.division.win,
                loss: teamData.division.loss,
                gamesBehind: teamData.division.gamesBehind,
              },
              win: {
                home: teamData.win.home,
                away: teamData.win.away,
                total: teamData.win.total,
                percentage: teamData.win.percentage,
                lastTen: teamData.win.lastTen,
              },
              loss: {
                home: teamData.loss.home,
                away: teamData.loss.away,
                total: teamData.loss.total,
                percentage: teamData.loss.percentage,
                lastTen: teamData.loss.lastTen,
              },
              gamesBehind: teamData.gamesBehind,
              streak: teamData.streak,
              winStreak: teamData.winStreak,
              tieBreakerPoints: teamData.tieBreakerPoints,
            };
          }
        );

        setStandings(enrichedStandings);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching standings:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [season]);

  return { standings, loading, error };
}
