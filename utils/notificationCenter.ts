import type { AppNotification } from "@/types/notifications";

const dataString = (notification: AppNotification, key: string) => {
  const value = notification.data?.[key];
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : null;
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
      return gameId && sport
        ? `/game/${encodeURIComponent(sport)}/${encodeURIComponent(gameId)}`
        : null;
    }

    default:
      return null;
  }
};
