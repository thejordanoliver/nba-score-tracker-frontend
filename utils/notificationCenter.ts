import type { AppNotification } from "@/types/notifications";

const dataString = (notification: AppNotification, key: string) => {
  const value = notification.data?.[key];
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : null;
};

const SAFE_LEAGUE_CODE = /^[a-z0-9][a-z0-9._-]*$/;

export const getNotificationLeague = (
  notification: AppNotification,
): string | null => {
  const league = dataString(notification, "league")?.trim().toLowerCase();

  return league && SAFE_LEAGUE_CODE.test(league) ? league : null;
};

export const getNotificationLeagueLabel = (
  notification: AppNotification,
): string | null => getNotificationLeague(notification)?.toUpperCase() ?? null;

export const shouldShowNotificationActorProfileImage = (
  notification: AppNotification,
): boolean =>
  notification.type === "new_follower" ||
  notification.type === "post_like" ||
  notification.type === "post_comment" ||
  notification.type === "comment_reply" ||
  notification.type === "message";

export const getNotificationActorProfileImage = (
  notification: AppNotification,
): string | null => {
  if (!shouldShowNotificationActorProfileImage(notification)) return null;

  const profileImage =
    dataString(notification, "profileImage") ??
    dataString(notification, "profile_image");

  return profileImage?.trim() || null;
};

/** The single navigation policy used by both inbox rows and foreground banners. */
export const getNotificationCenterHref = (
  notification: AppNotification,
): string | null => {
  switch (notification.type) {
    case "post_like":
    case "post_comment":
    case "comment_reply": {
      const postId = dataString(notification, "postId");
      return postId ? `/post/${encodeURIComponent(postId)}` : null;
    }

    case "message": {
      const conversationId = dataString(notification, "conversationId");
      return conversationId
        ? `/messages/${encodeURIComponent(conversationId)}`
        : "/messages";
    }

    case "new_follower": {
      const userId = dataString(notification, "userId") ??
        (notification.actorUserId ? String(notification.actorUserId) : null);
      return userId ? `/user/${encodeURIComponent(userId)}` : "/(tabs)/profile";
    }

    case "badge":
      return "/(tabs)/profile";

    case "game_starting":
    case "game_touchdown":
    case "game_quarter_end":
    case "game_halftime":
    case "game_close":
    case "game_final": {
      const gameId = dataString(notification, "gameId") ?? notification.entityId;
      const sport = dataString(notification, "sport");
      if (!gameId || !sport) return null;

      const gameHref = `/game/${encodeURIComponent(sport)}/${encodeURIComponent(gameId)}`;
      const league = getNotificationLeague(notification);

      return league
        ? `${gameHref}?league=${encodeURIComponent(league)}`
        : gameHref;
    }

    default:
      return null;
  }
};
