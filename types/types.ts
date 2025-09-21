// types.ts

// types/types.ts (backend User)
export type BackendUser = {
  id: number;
  username: string;
  full_name: string;
  email: string;
  profile_image?: string;
  // ...
};

// types/forum.ts (forum User)
export type ForumUser = {
  id: string;
  username: string;
  name: string; // display name
  avatar: string; // URL
};

export type User = {
  id: number;
  username: string;
  full_name: string;
  email: string;
  profile_image?: string;
  banner_image?: string | null; // add this
  bio?: string | null;
  favorites?: string[];
};

export type Follow = {
  followersCount: number;
  followingCount: number;
  isDark: boolean;
  currentUserId: string;
  targetUserId: string;
  onFollowersPress: () => void;
  onFollowingPress: () => void;
};

export type PlayerStats = {
  playerId: number;
  name: string;
  gamesPlayed: number;
  minutesPlayed: number;
  totalPoints: number;
  totalRebounds: number;
  totalAssists: number;
  totalSteals: number;
  totalBlocks: number;
  totalTurnovers: number;
  totalFouls: number;
  totalFGM: number;
  totalFGA: number;
  totalFGP: number; // string percentage if you want, else calculate per game
  total3PM: number;
  total3PA: number;
  total3PP: number; // 3-point percentage if you want
  totalFTM: number;
  totalFTA: number;
  totalFTP: number; // free throw percentage
  totalOffReb: number;
  totalDefReb: number;
  plusMinus: number;
};

export type PlayerInfo = {
  player_id: number;
  first_name: string;
  last_name: string;
  jersey_number: string;
  headshot_url?: string;
  active?: boolean;
};

export type Props = {
  rosterStats: PlayerStats[];
  playersDb: PlayerInfo[];
  teamId: string; // Add this
};

export type Team = {
  id: string;
  name: string;
  fullName?: string;
  logo?: any;
  logo_filename?: any;
  logoLight?: any;
  constantBlack?: string;
  constantLogoLight?: any;
  color?: string;
  first_season?: string;
  firstSeason?: string;
  transparent_color?: string;
  secondary_color?: string;
  secondaryColor?: string;
  record?: string;
  wins?: number;
  losses?: number;
  code?: string;
  current_season_record?: string;
  coach?: string;
  coach_image?: string;
  city?: string;
  state?: string;
  arena_name?: string;
  all_time_record?: string;
  primary_color?: string;
  championships?: number[];
  conference_championships?: string[]; // or number[]
  conference?: string;
};

export type Arena = {
  name: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

export type Game = {
  id: number;
  date: string;
  time: string;
  
  status:
    | "Scheduled"
    | "Final"
    | "In Progress"
    | "Canceled"
    | "Delayed"
    | "Postponed";
  home: Team;
  away: Team;

  code?: string;
  homeScore?: number;
  awayScore?: number;
  period?: string;
  clock?: string;
  isPlayoff?: boolean;
  stage?: number;
  isHalftime?: boolean;
  linescore?: {
    home: string[];
    away: string[];
  };
  periods?: {
    current: number;
    total: number;
    endOfPeriod: boolean;
  };
  arena?: {
    name: string;
    city: string;
    state?: string;
    country?: string;
    capacity?: number;
  };
};

export type GameStatus = {
  long: string;
  short: string;
  timer: string | null;
};

type QuarterScores = {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  total: number;
  over_time?: number | null;
};

export interface summerGame {
  id: number;
  date: string;
  time: string;
  status: GameStatus;
  period?: number;
  clock?: string;
  timezone?: string;
  homeScore?: number;
  awayScore?: number;
  isHalftime?: boolean;
  stage?: number;
  league?: {
    name: string;
  };
  home: {
    id: string;
    name: string;
    record?: string;
    logo?: any;
    code?: string;
    fullName?: string;
    logoLight?: any;
  };
  away: {
    id: string;
    name: string;
    record?: string;
    logo?: any;
    code?: string;
    fullName?: string;
    logoLight?: any;
  };
  venue?: string;
  currentHomeScore?: number;
  currentAwayScore?: number;
  scores?: {
    home: {
      q1?: number;
      q2?: number;
      q3?: number;
      q4?: number;
      ot?: number;
      total?: number;
    };
    away: {
      q1?: number;
      q2?: number;
      q3?: number;
      q4?: number;
      ot?: number;
      total?: number;
    };
  };
}

export interface GameOddsCardProps {
  team1: {
    name: string;
    record: string;
    logo: any;
    open: string;
    spread: string;
    total: string;
    moneyline: string;
    isAway: boolean;
  };
  team2: {
    name: string;
    record: string;
    logo: any;
    open: string;
    spread: string;
    total: string;
    moneyline: string;
    isAway: boolean;
  };
}

export type DBPlayer = {
  id: number;
  player_id: number;
  name: string;
  first_name: string;
  last_name: string;
  team_id: number;
  position: string;
  headshot_url: string;
  jersey_number: string;
  weight: string;
  height: string;
  birth_date: string;
  college: string;
  active: boolean;
  nba_start: number;
  nba_pro: number;
};

export type APIGame = {
  id: number;
  date: { start: string };
  status: {
    long: string;
    short: string;
    clock?: string;
  };
  periods: {
    current: number;
    total: number;
    endOfPeriod: boolean;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      logoLight: any;
    };
    visitors: {
      id: number;
      name: string;
      logo: string;
      logoLight: any;
    };
  };
  scores: {
    home: {
      points: number | null;
      win?: number;
      loss?: number;
      series?: { win: number; loss: number };
      linescore?: string[];
    };
    visitors: {
      points: number | null;
      win?: number;
      loss?: number;
      series?: { win: number; loss: number };
      linescore?: string[];
    };
  };
};

export type TeamRecord = {
  wins: number;
  losses: number;
  record: string;
};

export type PlayerResult = {
  id: number;
  player_id: number;
  name: string;
  avatarUrl: string;
  position: string;
  team_id: number;
  type: "player";
};

export type TeamResult = {
  id: number;
  name: string;
  nickname: string;
  city: string;
  logo_filename: string;
  type: "team";
};

export type UserResult = {
  id: number;
  username: string;
  profileImageUrl: string;
  type: "user";
};


export type ResultItem = PlayerResult | TeamResult | UserResult;
