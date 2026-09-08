import type { HomeLeagueId, MY_TEAMS_SECTION_ID } from "constants/leagues";
import type { MMAFight } from "hooks/MMAHooks/useMMAEvents";

import type { BaseballGame } from "./baseball/baseball";
import type { BasketballGame } from "./basketball/basketball";
import type { FootballGame } from "./football/football";
import type { HockeyGame } from "./hockey/hockey";
import type { SoccerGame } from "./soccer/soccer";
import type { TennisMatch } from "./tennis/tennis";

export type LeagueGame =
  | BasketballGame
  | FootballGame
  | BaseballGame
  | HockeyGame
  | SoccerGame
  | TennisMatch
  | MMAFight;

export type HomeLeagueSource = {
  id: HomeLeagueId;
  games: readonly LeagueGame[];
};

export type HomeGameItem = {
  key: string;
  league: HomeLeagueId;
  game: LeagueGame;
};

export type HomeGameSection = {
  id: HomeLeagueId | typeof MY_TEAMS_SECTION_ID;
  title: string;
  data: HomeGameItem[];
};
