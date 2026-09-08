export const NOTIFICATION_TYPES = [
  "post_like",
  "post_comment",
  "comment_reply",
  "message",
  "badge",
  "new_follower",
  "game_starting",
  "game_touchdown",
  "game_quarter_end",
  "game_halftime",
  "game_close",
  "game_final",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationEntityType =
  | "post"
  | "comment"
  | "conversation"
  | "message"
  | "badge"
  | "game"
  | "profile";

export type NotificationDataValue =
  | string
  | number
  | boolean
  | null
  | NotificationDataValue[]
  | { [key: string]: NotificationDataValue };

export type NotificationData = Record<string, NotificationDataValue>;

export type AppNotification = {
  id: string;
  recipientUserId: number;
  actorUserId: number | null;
  type: NotificationType;
  entityType: NotificationEntityType;
  entityId: string | null;
  title: string;
  body: string;
  data: NotificationData;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
  archivedAt: string | null;
};

export type NotificationPage = {
  notifications: AppNotification[];
  nextCursor: string | null;
  hasMore: boolean;
  unreadCount: number;
};

export type NotificationTeamSport =
  | "basketball"
  | "football"
  | "baseball"
  | "hockey"
  | "soccer";

export type TeamNotificationSubscription = {
  sport: NotificationTeamSport;
  league: string;
  teamId: string;
  gameStartEnabled: boolean;
  touchdownEnabled: boolean;
  quarterEndEnabled: boolean;
  halftimeEnabled: boolean;
  closeGameEnabled: boolean;
  finalScoreEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GameNotificationSubscription = {
  sport: NotificationTeamSport;
  league: string;
  gameId: string;
  gameStartEnabled: boolean;
  touchdownEnabled: boolean;
  quarterEndEnabled: boolean;
  halftimeEnabled: boolean;
  closeGameEnabled: boolean;
  finalScoreEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeamNotificationSettings = Pick<
  TeamNotificationSubscription,
  | "gameStartEnabled"
  | "touchdownEnabled"
  | "quarterEndEnabled"
  | "halftimeEnabled"
  | "closeGameEnabled"
  | "finalScoreEnabled"
>;

export type GameNotificationSettings = Pick<
  GameNotificationSubscription,
  | "gameStartEnabled"
  | "touchdownEnabled"
  | "quarterEndEnabled"
  | "halftimeEnabled"
  | "closeGameEnabled"
  | "finalScoreEnabled"
>;
