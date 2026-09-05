import assert from "node:assert/strict";
import test from "node:test";

import type { AppNotification, NotificationType } from "../types/notifications";
import { getNotificationCenterHref } from "../utils/notificationCenter";
import {
  isNotificationForSession,
  mergeNotifications,
  reconcileHydratedUnreadCount,
} from "../utils/notificationState";

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
          data: { sport: "basketball", gameId: "game/1" },
        }),
      ),
      "/game/basketball/game%2F1",
    );
  }
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
