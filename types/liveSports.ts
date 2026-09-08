export type LiveSport =
  | "football"
  | "basketball"
  | "baseball"
  | "hockey"
  | "soccer"
  | "mma"
  | "racing"
  | "tennis";

export type LiveSubscriptionKind = "game" | "scoreboard";

export type LiveFeedType =
  | "scoreboard"
  | "teamSchedule"
  | "teamLatest"
  | "nbaPlayoffs"
  | "eventList";

export type LiveGameSubscriptionInput = {
  sport: LiveSport;
  league: string;
  gameId: string | number;
};

export type LiveScoreboardSubscriptionInput = {
  sport: LiveSport;
  league: string;
  feed?: LiveFeedType;
  date?: string | number | null;
  dates?: string | number | null;
  season?: string | number | null;
  seasonType?: string | number | null;
  seasontype?: string | number | null;
  week?: string | number | null;
  conferenceId?: string | number | null;
  groupId?: string | number | null;
  groups?: string | number | null;
  teamId?: string | number | null;
  limit?: string | number | null;
};

export type LiveSubscriptionInput =
  | LiveGameSubscriptionInput
  | LiveScoreboardSubscriptionInput;

export type LiveUpdateEnvelope<TPayload = unknown> = {
  kind: LiveSubscriptionKind;
  sport: LiveSport;
  league: string;
  feed?: LiveFeedType | null;
  gameId?: string | number | null;
  params?: Record<string, string>;
  subscriptionKey: string;
  payload: TPayload;
  emittedAt: string;
};

export type LiveSubscriptionReady = {
  ok: boolean;
  alreadySubscribed?: boolean;
  kind?: LiveSubscriptionKind;
  sport?: LiveSport;
  league?: string;
  feed?: LiveFeedType | null;
  gameId?: string | number | null;
  params?: Record<string, string>;
  subscriptionKey?: string;
  subscriberCount?: number;
  error?: string;
};
