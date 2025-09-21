// types.ts

import { ImageSourcePropType } from "react-native";

export interface Team {
  id: number | string;
  code: string;
  logo?: ImageSourcePropType | string | null;
  logoLight?: ImageSourcePropType | string | null;
  current_season_record?: string;
}

export interface Division {
  name: string;
  rank: number;
  win: number;
  loss: number;
  gamesBehind?: number;
}

export interface Conference {
  name: string;
  win: number;
  loss: number;
}

export interface WinLossDetail {
  home: number;
  away: number;
  total: number;
}



export type TeamStanding = {
  league: string;
  season: number;
  team: {
    id: number;
    name: string;
    nickname: string;
    code: string;
    logo: string;
    logoLight?: string | null;
  };
  conference: {
    name: string;
    rank: number;
    win: number;
    loss: number;
  };
  division: {
    name: string;
    rank: number;
    win: number;
    loss: number;
    gamesBehind: string | null;
  };
  win: {
    home: number;
    away: number;
    total: number;
    percentage: string;
    lastTen: number;
  };
  loss: {
    home: number;
    away: number;
    total: number;
    percentage: string;
    lastTen: number;
  };
  gamesBehind: string | null;
  streak: number;
  winStreak: boolean;
  tieBreakerPoints: number | null;
    statusCode?: string | null;

};