export type TennisLeague = "atp" | "wta";

export type TennisStatus = {
  state: string | null;
  name: string | null;
  description: string | null;
  detail: string | null;
  shortDetail: string | null;
  period: number | null;
  completed: boolean;
};

export type TennisSetScore = {
  set: number;
  value: number | null;
  displayValue: string | null;
  tiebreak: number | null;
  winner: boolean | null;
};

export type TennisAthlete = {
  id: string | null;
  guid: string | null;
  displayName: string | null;
  shortName: string | null;
  fullName: string | null;
  flag: string | null;
  country: string | null;
};

export type TennisCompetitor = {
  id: string | null;
  uid: string | null;
  type: string | null;
  order: number | null;
  homeAway: string | null;
  displayName: string;
  shortName: string;
  flag: string | null;
  flags: string[];
  country: string | null;
  rank: number | null;
  winner: boolean | null;
  serving: boolean;
  score: number;
  linescores: TennisSetScore[];
  athletes: TennisAthlete[];
};

export type TennisDivision = {
  id: string | null;
  name: string;
  slug: string;
};

export type TennisMatch = {
  id: string;
  uid: string | null;
  eventId: string;
  tournamentId: string;
  tournamentName: string;
  tournamentShortName: string;
  major: boolean;
  league: TennisLeague;
  date: string | null;
  startDate: string | null;
  timestamp: number | null;
  timeValid: boolean;
  recent: boolean;
  status: TennisStatus;
  division: TennisDivision;
  round: {
    id: string | null;
    name: string;
  };
  format: {
    bestOf: number | null;
  };
  venue: {
    name: string | null;
    court: string | null;
  };
  competitors: TennisCompetitor[];
  broadcasts: string[];
  broadcast: string | null;
  note: string | null;
  suspended: boolean;
};

export type TennisTournament = {
  id: string;
  uid: string | null;
  name: string;
  shortName: string;
  date: string | null;
  endDate: string | null;
  major: boolean;
  venue: string | null;
  timeZone: string | null;
  status: TennisStatus;
  divisions: TennisDivision[];
  matchCount: number;
};

export type TennisScoreboardResponse = {
  league: {
    id: string;
    uid: string;
    key: TennisLeague;
    code: TennisLeague;
    name: string;
    label: string;
    slug: string;
    sport: "tennis";
    sportPath: "tennis";
    espnLeague: TennisLeague;
  };
  date: string;
  season: unknown;
  tournaments: TennisTournament[];
  matches: TennisMatch[];
  count: number;
  availableDivisions: TennisDivision[];
  provider: {
    name: string;
    fetchedAt: string;
  };
};
