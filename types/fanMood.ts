export type FanMoodLevel =
  | "furious"
  | "frustrated"
  | "mixed"
  | "optimistic"
  | "ecstatic";

export type FanMoodTrendDirection = "up" | "down" | "neutral";

export type FanMoodConfidence = "low" | "medium" | "high";

export type FanMoodData = {
  teamId: number | string;
  league: string;

  score: number;
  level: FanMoodLevel;

  trend: {
    direction: FanMoodTrendDirection;
    change: number;
  };

  confidence?: FanMoodConfidence;
  sampleSize?: number;

  updatedAt?: string | null;
};
