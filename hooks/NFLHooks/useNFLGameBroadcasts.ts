import axios from "axios";
import { useEffect, useState } from "react";

function parseDateString(d: string) {
  // If already YYYY-MM-DD or timestamp/ISO, just return new Date
  const isoMatch = /^\d{4}-\d{1,2}-\d{1,2}/.test(d);
  if (isoMatch) return new Date(d);

  // If MM/DD or M/D format, assume current year
  const mdMatch = /^(\d{1,2})\/(\d{1,2})$/.exec(d);
  if (mdMatch) {
    const year = new Date().getFullYear(); // or pass in season year
    const month = mdMatch[1].padStart(2, "0");
    const day = mdMatch[2].padStart(2, "0");
    return new Date(`${year}-${month}-${day}`);
  }

  // fallback
  const parsed = Date.parse(d);
  if (!isNaN(parsed)) return new Date(parsed);

  console.warn("Cannot parse date:", d);
  return null;
}

export const useNFLGameBroadcasts = (
  home: string,
  away: string,
  date: string | { date?: string; utc?: string; timestamp?: number } | undefined
) => {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!home || !away || !date) return;

    const fetchBroadcasts = async () => {
      setLoading(true);
      setError(null);

      try {
        // normalize target date
        let targetDate: Date | null = null;
        if (typeof date === "string") {
          targetDate = parseDateString(date);
        } else if (typeof date === "object") {
          targetDate = date.timestamp
            ? new Date(date.timestamp * 1000)
            : date.utc
              ? new Date(date.utc)
              : date.date
                ? new Date(date.date)
                : null;
        }
        if (!targetDate) return;

        const makeYMD = (d: Date) =>
          d.toISOString().slice(0, 10).replace(/-/g, "");
        const datesToCheck = [
          makeYMD(new Date(targetDate.getTime() - 24 * 60 * 60 * 1000)),
          makeYMD(targetDate),
          makeYMD(new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)),
        ];

        let foundGame: any = null;

        for (const yyyymmdd of datesToCheck) {
          const scoreboardUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${yyyymmdd}`;
          const scoreboardRes = await axios.get(scoreboardUrl);
          const games = scoreboardRes.data.events || [];

          const game = games.find((g: any) => {
            const competitors = g.competitions[0].competitors;
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

          if (game) {
            foundGame = game;
            break;
          }
        }

        if (!foundGame) {
          setError("Game not found on ESPN");
          setBroadcasts([]);
          return;
        }

        const gameId = foundGame.id;

        // Fetch the broadcasts from the scoreboard event itself
        const eventBroadcasts = foundGame.competitions?.[0]?.broadcasts || [];
        setBroadcasts(eventBroadcasts);
      } catch (err: any) {
        console.error("Error fetching broadcasts:", err);
        setError(err.message || "Failed to fetch broadcasts");
      } finally {
        setLoading(false);
      }
    };

    fetchBroadcasts();
  }, [home, away, date]);

  return { broadcasts, loading, error };
};
