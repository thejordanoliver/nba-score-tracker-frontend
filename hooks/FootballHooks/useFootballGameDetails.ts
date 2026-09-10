import { useLiveSportsSubscription } from "hooks/useLiveSportsSubscription";
import { useCallback, useEffect, useState } from "react";
import type { Highlight, Venue } from "types/types";
import { apiClient } from "utils/apiClient";
import type { Predictor } from "../BasketballHooks/useBasketballGameDetails";

export type Athlete = {
  id?: string | number | null;
  espnId?: string | number | null;
  uid?: string;
  guid?: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  displayName?: string | null;
  shortName?: string | null;
  headshot?: string | null;
  jersey?: string | null;
  position?: string | null;
  links?: unknown[];
};

export type FootballId = string | number | null | undefined;

export type TeamRecord = {
  type: string;
  summary?: string;
  displayValue?: string;
};

export type Team = {
  id: number;
  espnId: number;
  guid: string;
  uid: string;
  location: string;
  name: string;
  shortName: string;
  code: string;
  color: string;
  secondaryColor: string;
  logo: string | null;
  homeAway: string;
  score: number;
  winner: boolean;
  record: string;
  records: TeamRecord[];
  possession: boolean;
  rank: number | null;
  timeouts: number | null;
  timeoutsUsed: number | null;
};

export type Injury = {
  status: string;
  date?: string;
  athlete: Athlete;
  type?: {
    id?: string;
    name?: string;
    description?: string;
    abbreviation?: string;
  };
  details?: {
    fantasyStatus?: {
      description?: string;
      abbreviation?: string;
      displayDescription?: string;
    };
    type?: string;
    location?: string;
    detail?: string;
    side?: string;
    returnDate?: string;
  };
};

export type TeamInjury = {
  team: Team;
  injuries: Injury[];
};

export type FootballTeamReference = {
  id?: FootballId;
  espnId?: FootballId;
  uid?: string | null;
  guid?: string | null;
  location?: string | null;
  name?: string | null;
  shortName?: string | null;
  displayName?: string | null;
  abbreviation?: string | null;
  code?: string | null;
  color?: string | null;
  secondaryColor?: string | null;
  logo?: string | null;
  homeAway?: string | null;
};

export type FootballPlayTeamParticipant = FootballTeamReference & {
  team?: FootballTeamReference | null;
  type?: string | null;
  order?: number | string | null;
};

/* ---------------------------------- */
/* LEADER TYPES                       */
/* ---------------------------------- */

export type LeaderMainStat = {
  value?: string | number | null;
  label?: string | null;
};

export type LeaderEntry = {
  athlete: Athlete;
  stats?: (string | number | null)[];
  value?: string | number | null;
  displayValue?: string | null;
  mainStat?: LeaderMainStat;
  summary?: string | null;
};

export type LeaderCategory = {
  name: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  leaders: LeaderEntry[];
};

export type TeamLeaders = {
  team: Team;
  leaders: LeaderCategory[];
};

/* ---------------------------------- */
/* PLAY TYPES                         */
/* ---------------------------------- */

export type FootballClock = {
  value?: number | string | null;
  displayValue?: string | null;
};

export type FootballPeriod = {
  type?: string | null;
  number?: number | string | null;
};

export type FootballPlayPosition = {
  period?: FootballPeriod | null;
  clock?: FootballClock | null;
  yardLine?: number | null;
  yardsToEndzone?: number | string | null;
  text?: string | null;
  possessionText?: string | null;
  down?: number | string | null;
  distance?: number | null;
  downDistanceText?: string | null;
  shortDownDistanceText?: string | null;
  team?: FootballTeamReference | null;
};

export type FootballScoringType = {
  name?: string | null;
  displayName?: string | null;
  abbreviation?: string | null;
};

export type FootballPlayAthlete = Omit<Athlete, "headshot" | "position"> & {
  headshot?: string | { href?: string | null } | null;
  position?:
    | string
    | {
        abbreviation?: string | null;
        displayName?: string | null;
        name?: string | null;
      }
    | null;
};

export type FootballPlayParticipant = {
  athlete?: FootballPlayAthlete | null;
  teamId?: FootballId;
  type?: string | null;
  stats?: (string | number | null)[];
  playStatistics?: {
    $ref?: string | null;
  } | null;
};

export type PlayObject = {
  id?: FootballId;
  sequenceNumber?: FootballId;
  sequence?: FootballId;
  text?: string | null;
  shortText?: string | null;

  type?: {
    id?: FootballId;
    text?: string | null;
    abbreviation?: string | null;
  };

  team?: FootballTeamReference | null;
  teamParticipants?: FootballPlayTeamParticipant[];

  scoreValue?: number | string | null;
  scoringType?: FootballScoringType | null;
  scoringPlay?: boolean | null;

  description?: string | null;
  timeElapsed?: {
    displayValue?: string | null;
  };

  statYardage?: number | string | null;

  // Add these:
  yardsAfterCatch?: number | string | null;
  isTurnover?: boolean | null;
  isPenalty?: boolean | null;

  athletesInvolved?: Athlete[];
  participants?: FootballPlayParticipant[];
  start?: FootballPlayPosition | null;
  end?: FootballPlayPosition | null;
  period?: FootballPeriod | null;
  clock?: FootballClock | null;
  result?: string | null;
  shortDisplayResult?: string | null;
  displayResult?: string | null;
  yards?: number | string | null;
  awayScore?: number | string | null;
  homeScore?: number | string | null;
};

export type FootballDrive = {
  id?: FootballId;
  sequenceNumber?: FootballId;
  sequence?: FootballId;
  description?: string | null;
  result?: string | null;
  shortDisplayResult?: string | null;
  displayResult?: string | null;
  team?: FootballTeamReference | null;
  teamParticipants?: FootballPlayTeamParticipant[];
  start?: FootballPlayPosition | null;
  end?: FootballPlayPosition | null;
  timeElapsed?: {
    displayValue?: string | null;
  };
  yards?: number | string | null;
  isScore?: boolean | null;
  offensivePlays?: number | string | null;
  plays?: PlayObject[] | null;
};

/* ---------------------------------- */
/* SCORING PLAY TYPES                 */
/* ---------------------------------- */

export type ScoringPlay = {
  id: string;
  type: {
    id: string;
    text: string;
    abbreviation: string;
  };
  text: string;
  awayScore: number;
  homeScore: number;
  period: {
    number: number;
  };
  clock: {
    value: number;
    displayValue: string;
  };
  team: {
    id: string | number;
    uid?: string;
    displayName?: string;
    abbreviation?: string;
    logo?: string;
  };
  scoringType: {
    name: string;
    displayName: string;
    abbreviation: string;
  };
};

export type ScoringPlays = ScoringPlay[];

/* ---------------------------------- */
/* BOX SCORE TYPES                    */
/* ---------------------------------- */

export type TeamBoxScoreStat = {
  name: string;
  displayValue: string;
  value: number | string;
  label: string;
};

export type BoxScoreAthleteStat = {
  athlete: Athlete;
  stats: string[];
};

export type BoxScoreStatCategory = {
  name: string;
  keys?: string[];
  text?: string;
  labels?: string[];
  descriptions?: string[];
  athletes?: BoxScoreAthleteStat[];
  totals?: string[];
};

export type BoxScoreTeam = {
  team: Team;
  statistics: TeamBoxScoreStat[];
  displayOrder?: number;
  homeAway?: "home" | "away";
};

export type BoxScorePlayerTeam = {
  team: Team;
  statistics: BoxScoreStatCategory[];
  displayOrder?: number;
};

export type BoxScore = {
  teams: BoxScoreTeam[];
  players: BoxScorePlayerTeam[];
};

/* ---------------------------------- */
/* SCORE TYPES                        */
/* ---------------------------------- */

export type GameStatus = {
  id: string;
  name: string;
  state: "pre" | "in" | "post";
  completed: boolean;
  gameStatusDescription: string;
  gameStatusDetail: string;
  shortDetail: string;
  clock: number | null;
  displayClock: string | null;
  period: number | null;
};

export type FootballDrives = {
  current?: FootballDrive[] | null;
  previous?: FootballDrive[] | null;
};

export type Score = {
  gameId: string;
  uid: string;
  date: string;
  lastUpdated?: number;

  status: GameStatus;

  home: Team;
  away: Team;

  periodScores?: {
    period: number;
    home: number;
    away: number;
  }[];
  scoringPlays: ScoringPlays;
  plays?: PlayObject[];
  lastPlay: PlayObject | null;

  drives: {
    previous: FootballDrive[];
    current: FootballDrive[];
  };

  boxScore?: BoxScore;

  teamStats?: {
    team: Team;
    stats: TeamBoxScoreStat[];
  }[];

  playerStats?: {
    team: Team;
    names: string[];
    keys: string[];
    labels: string[];
    athletes: BoxScoreAthleteStat[];
  }[];

  leaders?: TeamLeaders[];

  timeouts?: {
    home: number | null;
    away: number | null;
  };
};

export type TeamRecords = {
  overall?: string;
  home?: string;
  away?: string;
  road?: string;
  conference?: string;
  vsconf?: string;
};

export type Official = {
  fullName: string;
  displayName: string;
  position: {
    name: string;
    displayName: string;
    id: string;
  };
  order: number;
};

export type Details = {
  broadcast?: string | null;
  broadcasts?: string[];
  officials: Official[];
  injuries: TeamInjury[];
  highlights: Highlight[];
  neutralSite: boolean;
  venue: Venue | null;
  attendance: number | null;
  headline?: string | null;
  predictor?: Predictor | null;
};

export type FootballGameDetailsResponse = {
  score: Score;
  details: Details;
};

/* ---------------------------------- */
/* Hook                               */
/* ---------------------------------- */

export const useFootballGameDetails = (
  league: string | undefined,
  gameId?: string | number | null,
) => {
  const [score, setScore] = useState<Score | undefined>();
  const [details, setDetails] = useState<Details | undefined>();
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const skipFetch = !league || !gameId;

  /* ---------------------------------- */
  /* Request game details               */
  /* ---------------------------------- */

  const requestDetails = useCallback(async () => {
    if (!league || !gameId) {
      return null;
    }

    const params = {
      league,
      gameId,
    };

    const { data } = await apiClient.get<FootballGameDetailsResponse>(
      "api/football/details",
      {
        params,
      },
    );

    return data;
  }, [gameId, league]);

  /* ---------------------------------- */
  /* Initial fetch                      */
  /* ---------------------------------- */

  useEffect(() => {
    if (skipFetch) {
      return;
    }

    let isCancelled = false;

    void requestDetails()
      .then((data) => {
        if (isCancelled || !data) {
          return;
        }

        if (!data.score) {
          setWarning("Game data unavailable");
          return;
        }

        setScore(data.score);
        setDetails(data.details);
        setWarning(null);
        setLastRefresh(new Date());
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to refresh game data";

        console.warn(`[${league}] game details fetch failed`, error);

        setWarning(message);
      });

    return () => {
      isCancelled = true;
    };
  }, [league, requestDetails, skipFetch]);

  /* ---------------------------------- */
  /* Live updates                       */
  /* ---------------------------------- */

  useLiveSportsSubscription<FootballGameDetailsResponse>({
    enabled: !skipFetch && score?.status?.state === "in",
    kind: "game",
    payload: {
      sport: "football",
      league: league || "nfl",
      gameId: gameId || "",
    },
    onUpdate: (payload) => {
      if (!payload?.score) {
        return;
      }

      setScore(payload.score);
      setDetails(payload.details);
      setWarning(null);
      setLastRefresh(new Date());
    },
  });

  /* ---------------------------------- */
  /* Manual refresh                     */
  /* ---------------------------------- */

  const refresh = useCallback(() => {
    if (skipFetch) {
      return;
    }

    setLoading(true);
    setWarning(null);

    void requestDetails()
      .then((data) => {
        if (!data) {
          return;
        }

        if (!data.score) {
          setWarning("Game data unavailable");
          return;
        }

        setScore(data.score);
        setDetails(data.details);
        setLastRefresh(new Date());
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to refresh game data";

        console.warn(`[${league}] game details fetch failed`, error);

        setWarning(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [league, requestDetails, skipFetch]);

  return {
    score,
    details,
    loading,
    warning,
    refresh,
    isLive: score?.status?.state === "in",
    lastRefresh,
  };
};
