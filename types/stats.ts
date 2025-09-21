export const STAT_CATEGORIES = [
  "points",
  "assists",
  "rebounds",
  "steals",
  "blocks",
  "tpm",
  "ftm",
] as const;export type StatCategory = typeof STAT_CATEGORIES[number];

export interface PlayerLeader {
  player_id: number;
  team_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  headshot_url?: string;
  avg_points?: string;
  avg_assists?: string;
  avg_rebounds?: string;
  avg_steals?: string;
  avg_blocks?: string;
  games_played: number;
  avg_three_pointers: string;
  avg_free_throws: string;
}