import axios from "axios";
import { useEffect, useState } from "react";

export const useNFLGameOfficialsAndInjuries = (
  away: string,
  home: string,
  date: string | { date?: string; utc?: string; timestamp?: number } | undefined
) => {
  const [officials, setOfficials] = useState<any[]>([]);
  const [injuries, setInjuries] = useState<any[]>([]);
  const [previousDrives, setPreviousDrives] = useState<any[]>([]);
  const [currentDrives, setCurrentDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!home || !away || !date) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // normalize target date
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

        // create array of YYYYMMDD values for [day before, day of, day after]
        const makeYMD = (d: Date) =>
          d.toISOString().slice(0, 10).replace(/-/g, "");
        const datesToCheck = [
          makeYMD(new Date(targetDate.getTime() - 24 * 60 * 60 * 1000)),
          makeYMD(targetDate),
          makeYMD(new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)),
        ];

        let foundGame: any = null;

        // loop over possible dates until we find a match
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
          setOfficials([]);
          setInjuries([]);
          setCurrentDrives([]);
          setPreviousDrives([]);
          return;
        }

        const gameId = foundGame.id;

        // 3. Fetch summary for that gameId
        const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${gameId}`;
        const { data: summary } = await axios.get(summaryUrl);

        // ✅ Officials + Injuries
        setOfficials(summary?.gameInfo?.officials ?? []);
        setInjuries(summary?.injuries ?? []);
        setPreviousDrives(summary?.drives?.previous ?? []);
        setCurrentDrives(summary?.drives?.current ?? []);
      } catch (err: any) {
        console.error("Error fetching game data:", err);
        setError(err.message || "Failed to fetch officials/injuries");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [away, home, date]);

  return { officials, injuries, currentDrives, previousDrives, loading, error };
};
