export const LEAGUE_TABS = {
  nba: [
    "scores",
    "news",
    "standings",
    "playoffs",
    "stats",
    "draft",
    "awards",
    "forum",
  ],

  wnba: ["scores", "news", "standings", "draft", "awards", "forum"],

  gleague: ["scores", "news", "forum"],

  nfl: [
    "scores",
    "news",
    "standings",
    "playoffs",
    "stats",
    "draft",
    "awards",
    "forum",
  ],

  ufl: ["scores", "news", "standings", "stats", "forum"],

  mlb: ["scores", "news", "standings", "stats", "awards", "forum"],

  nhl: ["scores", "news", "standings", "stats", "awards", "forum"],

  cfb: [
    "scores",
    "news",
    "standings",
    "stats",
    "playoffs",
    "recruits",
    "awards",
    "forum",
  ],

  cbb: [
    "scores",
    "news",
    "standings",
    "stats",
    "bracket",
    "recruits",
    "awards",
    "forum",
  ],

  wcbb: ["scores", "news", "standings", "stats", "bracket", "awards", "forum"],

  cb: ["scores", "news", "standings", "forum"],

  sb: ["scores", "news", "standings", "forum"],

  ufc: ["fights", "news", "champions", "forum"],

  atp: ["scores", "news", "forum"],

  wta: ["scores", "news", "forum"],

  mls: ["scores", "news", "standings", "forum"],

  epl: ["scores", "news", "standings", "forum"],

  europa: ["scores", "news", "standings", "forum"],

  champions: ["scores", "news", "standings", "forum"],

  bundesliga: ["scores", "news", "standings", "forum"],

  leaguescup: ["scores", "news", "standings", "forum"],

  fifa: ["scores", "news", "standings", "forum"],

  f1: ["scores", "news", "standings", "forum"],

  nascarpremier: ["scores", "news", "standings", "forum"],

  nascarsecondary: ["scores", "news", "standings", "forum"],

  nascartruck: ["scores", "news", "standings", "forum"],

  fifaf: ["scores", "news", "standings", "forum"],

  fifaw: ["scores", "news", "standings", "forum"],
} as const;

export const TEAM_TABS = {
  nba: ["schedule", "news", "roster", "depth", "stats", "standings", "forum"],

  wnba: ["schedule", "news", "roster", "stats", "standings", "forum"],

  nfl: ["schedule", "news", "roster", "depth", "stats", "standings", "forum"],

  mlb: ["schedule", "news", "roster", "stats", "standings", "forum"],

  cb: ["schedule", "news", "standings", "forum"],

  sb: ["schedule", "news", "standings", "forum"],

  nhl: ["schedule", "news", "roster", "stats", "standings", "forum"],

  cfb: ["schedule", "news", "roster", "stats", "standings", "forum"],

  ufl: ["schedule", "news", "standings", "forum"],

  cbb: ["schedule", "news", "roster", "stats", "standings", "forum"],

  wcbb: ["schedule", "news", "roster", "stats", "standings", "forum"],

  socc: ["schedule", "news", "roster"],
} as const;

export type League = keyof typeof LEAGUE_TABS;
export type Team = keyof typeof TEAM_TABS;

export type LeagueTab<L extends League> = (typeof LEAGUE_TABS)[L][number];

export type TeamTab<T extends Team> = (typeof TEAM_TABS)[T][number];

export function isLeague(value: string): value is League {
  return value in LEAGUE_TABS;
}

export function isTeam(value: string): value is Team {
  return value in TEAM_TABS;
}
export function normalizeLeagueParam(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  return String(rawValue || "").trim();
}
