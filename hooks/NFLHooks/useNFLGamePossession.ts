import { teamIdMap } from "constants/teamsNFL";
import axios from "axios";
import { useEffect, useState } from "react";

// Flip map: ESPN team ID → internal team ID
const espnToInternal: Record<string, number> = Object.fromEntries(
  Object.entries(teamIdMap).map(([internal, espn]) => [espn, Number(internal)])
);

export const useNFLGamePossession = (
  home: string,
  away: string,
  date: string | { date?: string; utc?: string; timestamp?: number } | undefined
) => {
  const [possessionTeamId, setPossessionTeamId] = useState<number | undefined>();
  const [shortDownDistanceText, setShortDownDistanceText] = useState<string | undefined>();
  const [homeTimeouts, setHomeTimeouts] = useState<number | undefined>();
  const [awayTimeouts, setAwayTimeouts] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!home || !away || !date) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Normalize target date
        let targetDate: Date | null = null;
        if (typeof date === "string") targetDate = new Date(date);
        else if (typeof date === "object") {
          targetDate = date.timestamp
            ? new Date(date.timestamp * 1000)
            : date.utc
              ? new Date(date.utc)
              : date.date
                ? new Date(date.date)
                : null;
        }
        if (!targetDate) return;

        // Format YYYYMMDD in US Eastern Time
        const makeYMD = (d: Date) => {
          const usDate = d.toLocaleDateString("en-US", { timeZone: "America/New_York" });
          const [month, day, year] = usDate.split("/");
          return `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}`;
        };
        const yyyymmdd = makeYMD(targetDate);

        const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${yyyymmdd}`;
        const { data } = await axios.get(url);
        const games = data.events || [];

        // Find the matching game by home & away
        const game = games.find((g: any) => {
          const competitors = g.competitions?.[0]?.competitors || [];
          const teamNames = competitors.flatMap((c: any) => [
            c.team.abbreviation?.toLowerCase(),
            c.team.displayName?.toLowerCase(),
            c.team.shortDisplayName?.toLowerCase(),
            c.team.name?.toLowerCase(),
          ]);
          const normalize = (s: string) => s.toLowerCase();
          return (
            teamNames.some((n: string) => n && n.includes(normalize(home))) &&
            teamNames.some((n: string) => n && n.includes(normalize(away)))
          );
        });

        if (!game) {
          console.warn(`[NFL Possession] Game not found for ${home} vs ${away}`);
          setError("Game not found on ESPN");
          setPossessionTeamId(undefined);
          setShortDownDistanceText(undefined);
          setHomeTimeouts(undefined);
          setAwayTimeouts(undefined);
          return;
        }

        const competition = game.competitions[0];
        if (!competition) {
          console.warn("[NFL Possession] No competition data found");
          setPossessionTeamId(undefined);
          setShortDownDistanceText(undefined);
          setHomeTimeouts(undefined);
          setAwayTimeouts(undefined);
          return;
        }

        // Extract possession
        const espnPossessionId: string | undefined = competition.situation?.possession;
        if (espnPossessionId && espnToInternal[espnPossessionId]) {
          setPossessionTeamId(espnToInternal[espnPossessionId]);
        } else {
          setPossessionTeamId(undefined);
        }

        // Extract down & distance text
        setShortDownDistanceText(competition.situation?.shortDownDistanceText);

        // Extract timeouts
        setHomeTimeouts(competition.situation?.homeTimeouts);
        setAwayTimeouts(competition.situation?.awayTimeouts);

      } catch (err: any) {
        console.error("[NFL Possession] Error fetching possession:", err);
        setError(err.message || "Failed to fetch possession");
        setPossessionTeamId(undefined);
        setShortDownDistanceText(undefined);
        setHomeTimeouts(undefined);
        setAwayTimeouts(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // poll live games every 15s
    return () => clearInterval(interval);
  }, [home, away, date]);

  return { possessionTeamId, shortDownDistanceText, homeTimeouts, awayTimeouts, loading, error };
};
