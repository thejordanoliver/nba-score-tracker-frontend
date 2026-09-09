import assert from "node:assert/strict";
import test from "node:test";

import type { AppNotification, NotificationType } from "../types/notifications";
import {
  getNotificationActorProfileImage,
  getNotificationCenterHref,
  getNotificationLeagueLabel,
  shouldShowNotificationActorProfileImage,
} from "../utils/notificationCenter";
import {
  isNotificationForSession,
  mergeNotifications,
  reconcileHydratedUnreadCount,
} from "../utils/notificationState";
import {
  hasEnabledNotificationSetting,
  mergeNotificationSettings,
} from "../utils/notification-settings";

const notification = (
  type: NotificationType,
  overrides: Partial<AppNotification> = {},
): AppNotification => ({
  id: "1",
  recipientUserId: 7,
  actorUserId: 9,
  type,
  entityType: "post",
  entityId: "entity-1",
  title: "Title",
  body: "Body",
  data: {},
  createdAt: "2026-09-05T12:00:00.000Z",
  updatedAt: "2026-09-05T12:00:00.000Z",
  readAt: null,
  archivedAt: null,
  ...overrides,
});

test("realtime merging deduplicates database IDs and accepts server read state", () => {
  const unread = notification("post_like");
  const read = { ...unread, readAt: "2026-09-05T12:01:00.000Z" };
  assert.deepEqual(mergeNotifications([unread], [read]), [read]);
});

test("an older payload cannot resurrect read or archived state", () => {
  const current = notification("post_like", {
    updatedAt: "2026-09-05T12:02:00.000Z",
    readAt: "2026-09-05T12:01:00.000Z",
    archivedAt: "2026-09-05T12:02:00.000Z",
  });
  const stale = notification("post_like", {
    updatedAt: "2026-09-05T12:00:00.000Z",
  });

  assert.deepEqual(mergeNotifications([current], [stale]), [current]);
});

test("same-timestamp notifications sort by numeric BIGINT ID", () => {
  const lower = notification("post_like", { id: "9" });
  const higher = notification("post_like", { id: "10" });
  assert.deepEqual(
    mergeNotifications([lower], [higher]).map((item) => item.id),
    ["10", "9"],
  );
});

test("REST hydration only adds realtime unread events absent from its snapshot", () => {
  const inSnapshot = notification("post_like", { id: "10" });
  const afterSnapshot = notification("post_comment", { id: "11" });
  assert.equal(
    reconcileHydratedUnreadCount({
      authoritativeCount: 4,
      requestStartIds: new Set(["1"]),
      hydratedPage: [inSnapshot],
      currentNotifications: [inSnapshot, afterSnapshot],
    }),
    5,
  );
  assert.equal(
    reconcileHydratedUnreadCount({
      authoritativeCount: 5,
      requestStartIds: new Set(["1"]),
      hydratedPage: [inSnapshot, afterSnapshot],
      currentNotifications: [inSnapshot, afterSnapshot],
    }),
    5,
  );
});

test("session filtering prevents cross-account notification leakage", () => {
  const incoming = notification("message");
  assert.equal(isNotificationForSession(incoming, 7), true);
  assert.equal(isNotificationForSession(incoming, 8), false);
  assert.equal(isNotificationForSession(incoming, null), false);
});

test("the central navigation mapper covers all notification types", () => {
  for (const type of ["post_like", "post_comment", "comment_reply"] as const) {
    assert.equal(
      getNotificationCenterHref(notification(type, { data: { postId: "post/a" } })),
      "/post/post%2Fa",
    );
  }

  assert.equal(
    getNotificationCenterHref(notification("message", { data: { conversationId: "dm/1" } })),
    "/messages/dm%2F1",
  );
  assert.equal(
    getNotificationCenterHref(notification("new_follower", { actorUserId: 42 })),
    "/user/42",
  );
  assert.equal(getNotificationCenterHref(notification("badge")), "/(tabs)/profile");

  for (const type of [
    "game_starting",
    "game_touchdown",
    "game_quarter_end",
    "game_halftime",
    "game_close",
    "game_final",
  ] as const) {
    assert.equal(
      getNotificationCenterHref(
        notification(type, {
          entityId: "game/1",
          data: { sport: "basketball", league: "nba", gameId: "game/1" },
        }),
      ),
      "/game/basketball/game%2F1?league=nba",
    );
  }
});

test("game notifications preserve supported league labels in their routes", () => {
  for (const [sport, league] of [
    ["football", "cfb"],
    ["football", "nfl"],
    ["basketball", "nba"],
    ["basketball", "wcbb"],
    ["basketball", "cbb"],
  ] as const) {
    const gameNotification = notification("game_final", {
      entityId: "401234567",
      data: { sport, league, gameId: "401234567" },
    });

    assert.equal(
      getNotificationCenterHref(gameNotification),
      `/game/${sport}/401234567?league=${league}`,
    );
    assert.equal(getNotificationLeagueLabel(gameNotification), league.toUpperCase());
  }
});

test("game notification routing stays backward-compatible without a league", () => {
  assert.equal(
    getNotificationCenterHref(
      notification("game_final", {
        entityId: "401234567",
        data: { sport: "football", gameId: "401234567" },
      }),
    ),
    "/game/football/401234567",
  );
});

test("the navigation mapper safely handles missing metadata", () => {
  assert.equal(getNotificationCenterHref(notification("post_like")), null);
  assert.equal(getNotificationCenterHref(notification("game_final", { entityId: null })), null);
  assert.equal(getNotificationCenterHref(notification("message")), "/messages");
  assert.equal(
    getNotificationCenterHref(notification("new_follower", { actorUserId: null })),
    "/(tabs)/profile",
  );
});

test("social notifications expose the actor profile image", () => {
  for (const type of [
    "new_follower",
    "post_like",
    "post_comment",
    "comment_reply",
    "message",
  ] as const) {
    const socialNotification = notification(type, {
      data: { profileImage: "https://images.example.com/actor.jpg" },
    });

    assert.equal(
      shouldShowNotificationActorProfileImage(socialNotification),
      true,
    );
    assert.equal(
      getNotificationActorProfileImage(socialNotification),
      "https://images.example.com/actor.jpg",
    );
  }

  assert.equal(
    getNotificationActorProfileImage(
      notification("new_follower", {
        data: { profile_image: "https://images.example.com/legacy.jpg" },
      }),
    ),
    "https://images.example.com/legacy.jpg",
  );
  assert.equal(
    shouldShowNotificationActorProfileImage(notification("message")),
    true,
  );
  assert.equal(getNotificationActorProfileImage(notification("message")), null);
  assert.equal(
    shouldShowNotificationActorProfileImage(notification("badge")),
    false,
  );
  assert.equal(getNotificationActorProfileImage(notification("badge")), null);
});

test("team notification settings merge across both teams for a game", () => {
  const merged = mergeNotificationSettings([
    {
      gameStartEnabled: true,
      touchdownEnabled: false,
      quarterEndEnabled: false,
      halftimeEnabled: false,
      closeGameEnabled: false,
      finalScoreEnabled: false,
    },
    {
      gameStartEnabled: false,
      touchdownEnabled: false,
      quarterEndEnabled: false,
      halftimeEnabled: false,
      closeGameEnabled: false,
      finalScoreEnabled: true,
    },
  ]);

  assert.equal(merged?.gameStartEnabled, true);
  assert.equal(merged?.finalScoreEnabled, true);
});

test("an all-off game override remains distinguishable from no settings", () => {
  const allOff = mergeNotificationSettings([
    {
      gameStartEnabled: false,
      touchdownEnabled: false,
      quarterEndEnabled: false,
      halftimeEnabled: false,
      closeGameEnabled: false,
      finalScoreEnabled: false,
    },
  ]);

  assert.notEqual(allOff, null);
  assert.equal(hasEnabledNotificationSetting(allOff), false);
  assert.equal(mergeNotificationSettings([]), null);
});
