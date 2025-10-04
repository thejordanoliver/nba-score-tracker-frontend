// types/nfl.ts

export interface NFLPlayer {
  id: number;
  name: string;
  birth_date?: string;
  age?: number | null;
  height?: string;
  weight?: string;
  college?: string | null;
  group?: string;
  position?: string;
  number?: number;
  salary?: string | null;
  experience?: number | null;
  image?: string;
  teamId: number;
}

export type NFLTeam = {
  id: number | string;
  espnID: string;
  name: string;
  fullName: string;
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
  color: string;
  secondaryColor: string;
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

export const emptyTeam: NFLTeam = {
  id: 0,
  espnID: "0",
  name: "Unknown",
  code: "UNK",
  city: "Unknown",
  location: "Unknown",
  coach: "Unknown",
  owner: "Unknown",
  stadium: "Unknown",
  established: 0,
  logo: "",
  logo500x500: "",
  country: {
    name: "Unknown",
    code: "UNK",
    flag: "",
  },
  fullName: "Unknown",
  color: "#000000",
  secondaryColor: "#FFFFFF",
  latitude: 0,
  longitude: 0,
  stadiumImage: null,
  stadiumCapacity: "",
};
