import { useLiveSportsSubscription } from "hooks/useLiveSportsSubscription";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "utils/apiClient";
import { TeamInjury } from "../FootballHooks/useFootballGameDetails";

type TeamRecord = {
  type: string;
  summary: string;
  displayValue: string;
};

type Team = {
  id: string | number;
  espnId: string | number | null;
  guid: string;
  uid: string;
  location: string;
  name: string;
  fullName: string;
  shortName: string;
  code: string;
  homeAway: string;
  score: number;
  winner: boolean;
  record: string;
  records: TeamRecord[];
  possession: boolean;
  hits: number | null;
  errors: number | null;
  rank: number | null;
};

export type Venue = {
  id: string;
  guid: string;
  fullName: string;
  address: {
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  grass: boolean;
  images: {
    href: string;
    rel: string[];
  }[];
};

export type SeriesSummary = {
  type: string;
  title: string;
  summary: string;
  completed: boolean;
  totalCompetitions: number;
  competitors: {
    id: string;
    uid: string;
    wins: number;
    ties: number;
    href: string;
  }[];
};

export type Predictor = {
  header: string;
  homeTeam: {
    id: string;
    gameProjection: string;
    teamChanceLoss: string;
  };
  awayTeam: {
    id: string;
    gameProjection: string;
    teamChanceLoss: string;
  };
};

export type TeamStat = {
  name: string;
  displayValue: string;
};

export type PlayerStatItem = {
  key: string;
  name: string;
  label: string;
  description: string | null;
  value: string | number | null;
};

export type PlayerStatAthlete = {
  active: boolean | null;
  starter: boolean;
  batOrder: number | null;

  athlete: any;
  id: string | null;
  uid: string | null;
  guid: string | null;
  displayName: string;
  shortName: string;
  headshot: string | null;
  position: any | null;

  atBats: any[];
  stats: string[];
  statsByKey: Record<string, string | number | null>;
  statItems: PlayerStatItem[];
};

export type PlayerStatBlock = {
  type: string | null;
  names: string[];
  keys: string[];
  labels: string[];
  descriptions: string[];
  totals: string[];

  totalsByKey: Record<string, string | number | null>;
  totalItems: PlayerStatItem[];

  athletes: PlayerStatAthlete[];
};

export type PlayerStatsByTeam = {
  team: any;
  displayOrder: number | null;

  // Backward-compatible primary block
  type: string | null;
  names: string[];
  keys: string[];
  labels: string[];
  descriptions: string[];
  totals: string[];
  totalsByKey: Record<string, string | number | null>;
  athletes: PlayerStatAthlete[];

  // Full grouped stats
  statBlocks: PlayerStatBlock[];
  statBlocksByType: Record<string, PlayerStatBlock>;

  batting: PlayerStatBlock | null;
  pitching: PlayerStatBlock | null;
  fielding: PlayerStatBlock | null;
};

export type TeamRecords = {
  overall: string | null;
  home?: string | null;
  away?: string | null;
  conference?: string | null;
};

export type BaseballPlayType = {
  id: string;
  text: string;
  abbreviation?: string;
  alternativeText?: string;
  type: string;
};

export type BaseballPlayPeriod = {
  type: "Top" | "Bottom" | string;
  number: number;
  displayValue: string;
};

export type BaseballPlayCoordinate = {
  x: number;
  y: number;
};

export type BaseballPitchType = {
  id: string;
  text: string;
  abbreviation: string;
};

export type BaseballPitchCount = {
  balls: number;
  strikes: number;
};

export type BaseballBats = {
  type: string;
  abbreviation: string;
  displayValue: string;
};

export type BaseballPlayTeam = {
  id: number | string | null;
  espnId?: number | string | null;

  name?: string | null;
  fullName?: string | null;
  displayName?: string | null;
  shortName?: string | null;
  shortDisplayName?: string | null;

  abbreviation?: string | null;
  code?: string | null;
  location?: string | null;

  color?: string | null;
  alternateColor?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;

  established?: number | null;
  mlbId?: number | null;
};

export type BaseballPlayAthlete = {
  id: number | string | null;
  espnId?: number | string | null;

  teamId?: number | string | null;
  teamEspnId?: number | string | null;

  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  displayName?: string | null;
  shortName?: string | null;

  headshot?: string | null;
  jersey?: string | null;
  position?: string | null;
};

export type BaseballPlayParticipant = {
  athlete: BaseballPlayAthlete;

  type: "pitcher" | "batter" | "onFirst" | "onSecond" | "onThird" | string;

  teamId?: number | string | null;
  teamEspnId?: number | string | null;
};

export type BaseballBaseRunner = {
  athlete: {
    id: number | string | null;
  };
};

export type BaseballPlay = {
  id: string;
  sequenceNumber: string | number;

  type: BaseballPlayType;

  /**
   * Used on play-result entries.
   * Example: play-result -> single, ground-out, fly-out, etc.
   */
  alternativeType?: BaseballPlayType | null;

  alternativePlay?: string | null;

  text?: string | null;

  awayScore: number;
  homeScore: number;

  period: BaseballPlayPeriod;

  scoringPlay: boolean;
  scoreValue: number;

  team?: BaseballPlayTeam | null;

  participants?: BaseballPlayParticipant[] | null;

  wallclock?: string | null;

  atBatId?: string | null;
  batOrder?: number | null;

  bats?: BaseballBats | null;

  atBatPitchNumber?: number | null;

  pitchCoordinate?: BaseballPlayCoordinate | null;
  hitCoordinate?: BaseballPlayCoordinate | null;

  pitchType?: BaseballPitchType | null;
  pitchVelocity?: number | null;

  summaryType?: string | null;

  /**
   * Count before/around the play depending on the event.
   */
  pitchCount?: BaseballPitchCount | null;

  /**
   * Count after the event.
   */
  resultCount?: BaseballPitchCount | null;

  trajectory?: string | null;

  outs?: number | null;

  onFirst?: BaseballBaseRunner | null;
  onSecond?: BaseballBaseRunner | null;
  onThird?: BaseballBaseRunner | null;
};

export type BaseballSituationPlayer = {
  id: number | string | null;
  teamId: number | string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  displayName: string | null;
  shortName: string | null;
  headshot: string | null;
  jersey: string | null;
  position: string | null;
  summary: string | null;
};

export type BaseballSituation = {
  outs: number;
  balls: number;
  strikes: number;
  pitcher: BaseballSituationPlayer | null;
  batter: BaseballSituationPlayer | null;
  bases: {
    onFirst: boolean;
    onSecond: boolean;
    onThird: boolean;
  };
};

type BaseballLeaderStatistic = {
  name: string;
  displayName?: string | null;
  shortDisplayName?: string | null;
  abbreviation?: string | null;
  value?: string | number | null;
  displayValue?: string | null;
};

type BaseballLeaderAthlete = {
  id?: string | number | null;
  espnId?: string | number | null;
  teamId?: string | number | null;
  teamEspnId?: string | number | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  displayName?: string | null;
  shortName?: string | null;
  headshot?: string | null;
  jersey?: string | null;
  position?: string | null;
};

type BaseballLeaderEntry = {
  displayValue?: string | null;
  value?: string | number | null;
  mainStat?: {
    value?: string | number | null;
    displayValue?: string | null;
  } | null;
  athlete: BaseballLeaderAthlete;
  statistics?: BaseballLeaderStatistic[];
};

type BaseballLeaderCategory = {
  name: string;
  displayName?: string | null;
  leaders: BaseballLeaderEntry[];
};

type BaseballLeaderTeam = {
  team: {
    id: string | number;
    espnId?: string | number | null;
    displayName?: string | null;
    abbreviation?: string | null;
    logo?: string | null;
  };
  leaders: BaseballLeaderCategory[];
};

export type Score = {
  gameId: string;
  uid: string;
  date: string;
  lastUpdated: number;
  status: {
    id: string;
    name: string;
    state: string;
    completed: boolean;
    gameStatusDescription: string;
    gameStatusDetail: string;
    shortDetail: string;
    clock?: number | null;
    displayClock: string | null;
    period: number | null;
  };
  home: Team;
  away: Team;
  periodScores?: {
    period: number;
    home: number;
    away: number;
  }[];

  plays: BaseballPlay[];

  lastPlay: BaseballPlay | null;

  teamStats: {
    team: any;
    stats: TeamStat[];
  }[];

  situation: BaseballSituation;

  playerStats: PlayerStatsByTeam[];

  leaders: BaseballLeaderTeam[];
};

export type GameDetails = {
  playoffRound: string | number | null;
  seriesSummary: SeriesSummary | any | null;
  series?: SeriesSummary | any | null;
  playoffSeries?: any | null;
  isPostseason: boolean;
  seasonState: string | null;

  homeRank: number | null;
  awayRank: number | null;

  broadcast?: string | null;
  broadcasts?: string[];

  officials: any[];
  injuries: TeamInjury[];
  highlights: any[];
  neutralSite: boolean;
  headline?: string | null;

  predictor: Predictor | null;
  odds?: any;

  records: {
    home: TeamRecords;
    away: TeamRecords;
  };

  venue?: Venue | null;
};

export type BaseballGameDetailsResponse = {
  score: Score;
  details: GameDetails | null;
};

/* ---------------------------------- */
/* Hook                               */
/* ---------------------------------- */

export const useBaseballGameDetails = (
  league: string | undefined,
  gameId?: string | number | null,
) => {
  /*
   * Use null as the explicit empty state.
   * score and details will never be undefined.
   */
  const [score, setScore] = useState<Score | null>(null);
  const [details, setDetails] = useState<GameDetails | null>(null);

  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const skipFetch = !league || !gameId;

  /* ---------------------------------- */
  /* Fetch from /api/baseball/details   */
  /* ---------------------------------- */

  const fetchDetails = useCallback(
    async (silent = false) => {
      if (skipFetch) return;

      try {
        if (!silent) {
          setLoading(true);
        }

        setWarning(null);

        const params: Record<string, string | number | undefined> = {
          league,
          gameId: gameId ?? undefined,
        };

        const { data } = await apiClient.get<BaseballGameDetailsResponse>(
          "api/baseball/details",
          {
            params,
          },
        );

        if (!data?.score) {
          setScore(null);
          setDetails(null);
          setWarning("Game data unavailable");
          return;
        }

        setScore(data.score);
        setDetails(data.details ?? null);
        setLastRefresh(new Date());
      } catch (err: any) {
        console.warn(`[${league}] game details fetch failed`, err);

        setWarning(
          err?.response?.data?.message ??
            err?.message ??
            "Unable to refresh game data",
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [league, gameId, skipFetch],
  );

  /* ---------------------------------- */
  /* Reset when identifiers are missing */
  /* ---------------------------------- */

  useEffect(() => {
    if (!skipFetch) return;

    setScore(null);
    setDetails(null);
    setWarning(null);
    setLastRefresh(null);
    setLoading(false);
  }, [skipFetch]);

  /* ---------------------------------- */
  /* Initial fetch                      */
  /* ---------------------------------- */

  useEffect(() => {
    if (skipFetch) return;

    void fetchDetails(true);
  }, [skipFetch, fetchDetails]);

  useLiveSportsSubscription<BaseballGameDetailsResponse>({
    enabled: !skipFetch && score?.status.state === "in",
    kind: "game",
    payload: {
      sport: "baseball",
      league: league || "mlb",
      gameId: gameId || "",
    },
    onUpdate: (payload) => {
      if (!payload?.score) return;

      setScore(payload.score);
      setDetails(payload.details);
      setLastRefresh(new Date());
    },
  });

  /* ---------------------------------- */
  /* Manual refresh                     */
  /* ---------------------------------- */

  const refresh = useCallback(() => {
    if (skipFetch) return;

    void fetchDetails(false);
  }, [fetchDetails, skipFetch]);

  return {
    score,
    details,
    loading,
    warning,
    refresh,

    isLive: score?.status.state === "in",
    lastRefresh,

    battingStats:
      score?.playerStats.map((team) => ({
        team: team.team,
        batting: team.batting,
      })) ?? [],

    pitchingStats:
      score?.playerStats.map((team) => ({
        team: team.team,
        pitching: team.pitching,
      })) ?? [],
  };
};
