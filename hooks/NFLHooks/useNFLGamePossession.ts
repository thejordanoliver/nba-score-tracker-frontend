import axios from "axios";
import { teamIdMap } from "constants/teamsNFL";
import { useEffect, useState, useRef, useCallback } from "react";

// Flip map: ESPN team ID → internal team ID
const espnToInternal: Record<string, number> = Object.fromEntries(
  Object.entries(teamIdMap).map(([internal, espn]) => [espn, Number(internal)])
);

export type Athlete = {
  id: string;
  fullName: string;
  displayName: string;
  shortName: string;
  headshot?: string;
  jersey?: string;
  position?: string;
};

export type PlayObject = {
  id: string;
  text: string;
  type?: { text?: string; abbreviation?: string };
  scoreValue?: number;
  drive?: {
    description?: string;
    start?: { yardLine?: number; text?: string };
    timeElapsed?: { displayValue?: string };
  };
  statYardage?: number;
  athletesInvolved?: Athlete[];
};

export type NFLScore = {
  home: number;
  away: number;
  homeTeam: string;
  awayTeam: string;
  periodScores?: { period: number; home: number; away: number }[];
};

export const useNFLGamePossession = (
  home: string,
  away: string,
  date: string | { date?: string; utc?: string; timestamp?: number } | undefined
) => {
  const [possessionTeamId, setPossessionTeamId] = useState<number | undefined>();
  const [shortDownDistanceText, setShortDownDistanceText] = useState<string | undefined>();
  const [downDistanceText, setDownDistanceText] = useState<string | undefined>();
  const [displayClock, setDisplayClock] = useState<string | undefined>();
  const [period, setPeriod] = useState<string | undefined>();
  const [lastPlay, setLastPlay] = useState<string | PlayObject | undefined>();
  const [homeTimeouts, setHomeTimeouts] = useState<number | undefined>();
  const [awayTimeouts, setAwayTimeouts] = useState<number | undefined>();
  const [score, setScore] = useState<NFLScore | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gameStatusDescription, setGameStatusDescription] = useState<string | undefined>();
  const [gameStatusDetail, setGameStatusDetail] = useState<string | undefined>();
  const [gameStatusShortDetail, setGameStatusShortDetail] = useState<string | undefined>();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(
    async (isPolling = false) => {
      if (!isPolling) setLoading(true);
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
          throw new Error("Game not found on ESPN");
        }

        const competition = game.competitions[0];
        if (!competition) throw new Error("No competition data found");

        const gameState = competition.status?.type?.state; // "pre", "in", "post"

        // Only update possession if the game is in-progress
        if (gameState !== "in") {
          console.log(`[NFL Possession] Game is not live (state = ${gameState}), skipping updates`);
          return;
        }

        // --- Extract in-progress status description ---
        const statusObj = competition.status?.type;
        setGameStatusDescription(statusObj?.description);
        setGameStatusDetail(statusObj?.detail);
        setGameStatusShortDetail(statusObj?.shortDetail);

        // Extract possession
        const espnPossessionId: string | undefined = competition.situation?.possession;
        setPossessionTeamId(espnPossessionId ? espnToInternal[espnPossessionId] : undefined);

        // Down & distance
        setShortDownDistanceText(competition.situation?.shortDownDistanceText);
        setDownDistanceText(competition.situation?.downDistanceText);

        // Timeouts
        setHomeTimeouts(competition.situation?.homeTimeouts);
        setAwayTimeouts(competition.situation?.awayTimeouts);

        // Display clock & period
        setDisplayClock(competition.status?.displayClock);
        setPeriod(competition.status?.period);

        // Last play
        if (competition.situation?.lastPlay) {
          setLastPlay(competition.situation.lastPlay as PlayObject);
        } else if (competition.status?.lastPlay) {
          setLastPlay(competition.status.lastPlay as string);
        } else {
          setLastPlay(undefined);
        }

        // --- Extract scores including period/line scores ---
        const competitors = competition.competitors || [];
        const homeComp = competitors.find((c: any) => c.homeAway === "home");
        const awayComp = competitors.find((c: any) => c.homeAway === "away");

        if (homeComp && awayComp) {
          const maxPeriods = Math.max(
            homeComp.linescores?.length ?? 0,
            awayComp.linescores?.length ?? 0
          );

          const periodScores = Array.from({ length: maxPeriods }, (_, idx) => ({
            period: idx + 1,
            home: homeComp.linescores?.[idx]?.value ?? 0,
            away: awayComp.linescores?.[idx]?.value ?? 0,
          }));

          setScore({
            home: Number(homeComp.score),
            away: Number(awayComp.score),
            homeTeam: homeComp.team.displayName,
            awayTeam: awayComp.team.displayName,
            periodScores,
          });
        }
      } catch (err: any) {
        console.error("[NFL Possession] Error fetching possession:", err);
        setError(err.message || "Failed to fetch possession");
        setPossessionTeamId(undefined);
        setShortDownDistanceText(undefined);
        setDownDistanceText(undefined);
        setDisplayClock(undefined);
        setPeriod(undefined);
        setLastPlay(undefined);
        setHomeTimeouts(undefined);
        setAwayTimeouts(undefined);
        setScore(undefined);
        setGameStatusDescription(undefined);
        setGameStatusDetail(undefined);
        setGameStatusShortDetail(undefined);
      } finally {
        setLoading(false);
      }
    },
    [home, away, date]
  );

  // Initial fetch & setup polling
  useEffect(() => {
    if (!home || !away || !date) return;

    fetchData(); // fetch immediately on mount

    intervalRef.current = setInterval(() => {
      fetchData(true);
    }, 30000); // every 1 minute

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [home, away, date, fetchData]);

  // Pull-to-refresh function
  const refresh = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  return {
    possessionTeamId,
    shortDownDistanceText,
    downDistanceText,
    displayClock,
    period,
    lastPlay,
    homeTimeouts,
    awayTimeouts,
    score,
    loading,
    error,
    gameStatusDescription,
    gameStatusDetail,
    gameStatusShortDetail,
    refresh, // 👈 expose refresh for pull-to-refresh
  };
};
