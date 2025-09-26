// types/nfl.ts

export type NFLTeam = {
  id: number | string;
  name: string;
  code: string;
  city: string;
  location: string;
  address?: string;
  coach: string;
  coachImage?: string;
  owner: string;
  stadium: string;
  established: number;
  logo: string;
  logoLight?: string;
  logo500x500: string;
  logoLight500x500?: string;
  country: {
    name: string;
    code: string;
    flag: string;
  };
  nickname: string;
  color?: string;
  latitude: number;
  longitude: number;
  stadiumImage: any;
  stadiumCapacity: string;
};

export type NFLGame = {
  game: {
    id: string;
    date: { timestamp: number };
    status: { short: string; long: string; timer?: string };
    venue?: { name: string; city: string };
  };
  teams: {
    home: NFLTeam;
    away: NFLTeam;
  };
  scores: {
    home?: {
      total?: number;
      quarter_1?: number;
      quarter_2?: number;
      quarter_3?: number;
      quarter_4?: number;
      overtime?: number;
    };
    away?: {
      total?: number;
      quarter_1?: number;
      quarter_2?: number;
      quarter_3?: number;
      quarter_4?: number;
      overtime?: number;
    };
  };
};

export type Stadium = {
  name: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  stadiumCapacity?: string;
  stadiumImage: any;
};

export type NFLGamesResponse = {
  results: number;
  response: NFLGame[];
};

export type Game = {
  game: {
    id: string; // ✅
    stage: string;
    week: string;
    date: {
      timezone: string;
      date: string;
      time: string;
      timestamp: number;
    };
    venue: {
      name: string;
      city: string;
    };
    status: {
      short: string;
      long: string;
      timer?: string | null; // allow null too
    };
  };
  league: {
    id: number;
    name: string;
    season: string;
    logo: string;
  };
  teams: {
    home: NFLTeam;
    away: NFLTeam;
  };
  scores: {
    home: Record<string, number | null>;
    away: Record<string, number | null>;
  };
};

export interface RawNFLGame {
  id: string | number;
  date: string; // ISO string
  time?: string; // "HH:mm" optional
  status: {
    short: string;
    long: string;
    timer?: string | null;
  };
  venue?: {
    name: string;
    city: string;
  };
  week?: string;
  stage?: string;
  teams: {
    home: { id: string; name: string; logo?: string };
    away: { id: string; name: string; logo?: string };
  };
  scores: {
    home?: Record<string, any>;
    away?: Record<string, any>;
  };
  league?: {
    id?: number;
    name?: string;
    season?: string;
    logo?: string;
  };
}
