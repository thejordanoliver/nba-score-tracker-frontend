import axios from "axios";
import { DateTime } from "luxon";
import { useEffect, useRef, useState } from "react";
import { transformGameData } from "../utils/transformGameData";

type DBGame = {
  game_id: number;
  date: string; // ISO string (UTC)
  status_long: string;
  status_short: string;
  period_current: number;
  period_total: number;
  home_team: any;
  away_team: any;
  home_score: number | null;
  away_score: number | null;
  raw_data: any;
};

type TransformedGame = ReturnType<typeof transformGameData>;

const SEASON_STAGE_DATES: Record<
  string,
  {
    playoffStart: string;
    playoffEnd: string;
    finalsStart: string;
    finalsEnd: string;
  }
> = {
  "2025": {
    playoffStart: "2025-04-20",
    playoffEnd: "2025-06-04",
    finalsStart: "2025-06-05",
    finalsEnd: "2025-06-30",
  },
};

const getSeasonStageDates = (season: string) => {
  return (
    SEASON_STAGE_DATES[season] || {
      playoffStart: "2025-04-20",
      playoffEnd: "2025-06-04",
      finalsStart: "2025-06-05",
      finalsEnd: "2025-06-30",
    }
  );
};

const toEasternDateTime = (isoDate: string): Date => {
  const dt = DateTime.fromISO(isoDate, { zone: "utc" }).setZone(
    "America/New_York"
  );
  return dt.toJSDate();
};

const toEasternMidnightDate = (isoDate: string): Date => {
  const dt = DateTime.fromISO(isoDate, { zone: "utc" })
    .setZone("America/New_York")
    .startOf("day");
  return dt.toJSDate();
};

// ✅ Normalize team objects coming from DB
const normalizeTeam = (team: any) => {
  if (!team) return null;

  return {
    id: team.id,
    code: team.code,
    logo: team.logo,
    name: team.name ?? team.nickname,
    nickname: team.nickname ?? team.name,
    wins: team.wins ?? 0,
    losses: team.losses ?? 0,
    record: team.record ?? "0-0",
  };
};

export function useSeasonGames(season: string) {
  const [games, setGames] = useState<TransformedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, TransformedGame[]>>(new Map());

  const refreshGames = async () => {
    try {
      setLoading(true);
      setError(null);

      if (cacheRef.current.has(season)) {
        setGames(cacheRef.current.get(season)!);
        setLoading(false);
        return;
      }

      const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
      const response = await axios.get<{ games: DBGame[] }>(
        `${BASE_URL}/api/nba-season/seasons/${season}/games`
      );

      const dbGames = response.data.games;

      const { playoffStart, playoffEnd, finalsStart, finalsEnd } =
        getSeasonStageDates(season);

      const playoffStartDate = toEasternMidnightDate(playoffStart);
      const playoffEndDate = toEasternMidnightDate(playoffEnd);
      const finalsStartDate = toEasternMidnightDate(finalsStart);
      const finalsEndDate = toEasternMidnightDate(finalsEnd);

      const nowETMidnight = DateTime.now()
        .setZone("America/New_York")
        .startOf("day");

      const seasonGames = dbGames
        .filter((game) => {
          const gameDateMidnightET = toEasternMidnightDate(game.date);
          const noScore = game.home_score === null && game.away_score === null;

          const hasValidTeams =
            game.home_team?.id !== null && game.away_team?.id !== null;

          return (
            (gameDateMidnightET >= nowETMidnight.toJSDate() || !noScore) &&
            hasValidTeams
          );
        })
        .map((game) => {
          const gameDateET = toEasternDateTime(game.date);
          const gameDateMidnightET = toEasternMidnightDate(game.date);

          let stage = 1;
          if (
            gameDateMidnightET >= playoffStartDate &&
            gameDateMidnightET <= playoffEndDate
          ) {
            stage = 2;
          } else if (
            gameDateMidnightET >= finalsStartDate &&
            gameDateMidnightET <= finalsEndDate
          ) {
            stage = 3;
          }

          const isPlayoff = stage >= 2;

          const gameLike = {
            ...game.raw_data,
            date: {
              ...game.raw_data.date,
              start: gameDateET.toISOString(),
              stage,
            },
            status: {
              long: game.status_long,
              short: game.status_short,
            },
            periods: {
              current: game.period_current,
              total: game.period_total,
              endOfPeriod: false,
            },
            teams: {
              home: normalizeTeam(game.home_team),
              visitors: normalizeTeam(game.away_team),
            },
            scores: {
              home: {
                ...game.raw_data?.scores?.home,
                points: game.home_score,
                linescore: game.raw_data?.scores?.home?.linescore ?? [],
              },
              visitors: {
                ...game.raw_data?.scores?.visitors,
                points: game.away_score,
                linescore: game.raw_data?.scores?.visitors?.linescore ?? [],
              },
            },
            isPlayoff,
          };

          return transformGameData(gameLike, {});
        })
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      cacheRef.current.set(season, seasonGames);
      setGames(seasonGames);
    } catch (err) {
      console.error("Error fetching season games:", err);
      setError("Failed to fetch games");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshGames();
  }, [season]);

  return { games, loading, error, refreshGames };
}
