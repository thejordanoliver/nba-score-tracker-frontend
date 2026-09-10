import type { BaseballGame } from "./baseball/baseball";
import type { BasketballGame } from "./basketball/basketball";
import type { FootballGame } from "./football/football";
import type { HockeyGame } from "./hockey/hockey";

export type ExploreWidgetType =
  | "nba_games"
  | "nfl_games"
  | "mlb_games"
  | "nhl_games"
  | "wnba_games"
  | "cbb_games"
  | "wcbb_games"
  | "cfb_games"
  | "favorite_games"
  | "favorite_teams"
  | "create_post"
  | "college_polls"
  | "standings";

export type ExploreWidgetSize = "small" | "medium" | "large";

export type ExploreWidgetConfig = {
  id: string;
  type: ExploreWidgetType;
  title: string;
  createdAt: number;
  size: ExploreWidgetSize;
  order: number;
  standingsLeague?: ExploreStandingsLeague;
  collegePollLeague?: ExploreCollegePollLeague;
  collegePollType?: ExploreCollegePollType;
};

export const EXPLORE_COLLEGE_POLL_LEAGUES = ["cfb", "cbb"] as const;

export type ExploreCollegePollLeague =
  (typeof EXPLORE_COLLEGE_POLL_LEAGUES)[number];

export const EXPLORE_COLLEGE_POLL_TYPES = [
  "ap",
  "coaches",
  "cfp",
  "fcs",
] as const;

export type ExploreCollegePollType =
  (typeof EXPLORE_COLLEGE_POLL_TYPES)[number];

export const EXPLORE_STANDINGS_LEAGUES = [
  "nba",
  "wnba",
  "nfl",
  "ufl",
  "mlb",
  "nhl",
] as const;

export type ExploreStandingsLeague =
  (typeof EXPLORE_STANDINGS_LEAGUES)[number];

export const EXPLORE_WIDGET_LEAGUES = [
  "nba",
  "wnba",
  "cbb",
  "wcbb",
  "mlb",
  "nfl",
  "cfb",
  "nhl",
] as const;

export type ExploreWidgetLeague = (typeof EXPLORE_WIDGET_LEAGUES)[number];

type ExploreWidgetGameBase = {
  key: string;
  gameId: string;
  favoriteTeamKeys: string[];
};

export type ExploreWidgetGame =
  | (ExploreWidgetGameBase & {
      sport: "basketball";
      league: "nba" | "wnba" | "cbb" | "wcbb";
      game: BasketballGame;
    })
  | (ExploreWidgetGameBase & {
      sport: "baseball";
      league: "mlb";
      game: BaseballGame;
    })
  | (ExploreWidgetGameBase & {
      sport: "football";
      league: "nfl" | "cfb";
      game: FootballGame;
    })
  | (ExploreWidgetGameBase & {
      sport: "hockey";
      league: "nhl";
      game: HockeyGame;
    });

export type ExploreWidgetFailure = {
  favoriteTeamKey: string;
  code: "upstream_unavailable" | "malformed_upstream_response";
};

export type ExploreWidgetsResponse = {
  version: 1;
  generatedAt: string;
  requestedLeagues: ExploreWidgetLeague[];
  favoriteTeamKeys: string[];
  games: ExploreWidgetGame[];
  failures: ExploreWidgetFailure[];
};

export type ExploreWidgetDataCache = {
  key: string;
  userId: number;
  fetchedAt: number;
  response: ExploreWidgetsResponse;
};
