/* global __dirname */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const rootDir = path.resolve(__dirname, "..");

function transpileModule(relativePath) {
  const source = fs.readFileSync(path.join(rootDir, relativePath), "utf8");

  return ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
}

function createStore(initializer) {
  let state;

  const set = (partial) => {
    const next = typeof partial === "function" ? partial(state) : partial;

    if (!next) return;

    state = {
      ...state,
      ...next,
    };
  };

  const get = () => state;

  state = initializer(set, get, undefined);

  const store = (selector) =>
    typeof selector === "function" ? selector(state) : state;

  store.getState = () => state;
  store.setState = set;

  return store;
}

function loadTranspiledModule(relativePath, mocks = {}, extraSandbox = {}) {
  const sandbox = {
    __DEV__: false,
    console,
    Date,
    exports: {},
    module: { exports: {} },
    process: {
      env: {},
    },
    require(moduleName) {
      if (Object.prototype.hasOwnProperty.call(mocks, moduleName)) {
        return mocks[moduleName];
      }

      throw new Error(
        `Unexpected require while loading ${relativePath}: ${moduleName}`,
      );
    },
    ...extraSandbox,
  };

  sandbox.exports = sandbox.module.exports;

  vm.runInNewContext(transpileModule(relativePath), sandbox, {
    filename: relativePath,
  });

  return sandbox.module.exports;
}

function createBadgeNotification(notificationId, badgeId = notificationId) {
  return {
    notificationId,
    userId: 1,
    badge: {
      badgeId,
      name: `Badge ${badgeId}`,
      description: "A badge notification",
      category: "community",
      metric: "totalEngagement",
      tier: "bronze",
      threshold: 1,
      symbol: "*",
      earnedAt: "2026-07-14T00:00:00.000Z",
    },
    createdAt: "2026-07-14T00:00:00.000Z",
  };
}

function assertArrayEqual(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

function loadBadgeStore() {
  return loadTranspiledModule("store/badgeNotificationStore.ts", {
    zustand: { create: createStore },
  }).useBadgeNotificationStore;
}

function testBadgeNotificationStore() {
  const useBadgeNotificationStore = loadBadgeStore();
  const resetStore = () =>
    useBadgeNotificationStore.getState().clearBadgeNotifications();

  resetStore();
  useBadgeNotificationStore.getState().enqueueNotifications(undefined);
  useBadgeNotificationStore.getState().enqueueNotifications(null);
  useBadgeNotificationStore.getState().enqueueNotifications([]);
  useBadgeNotificationStore.getState().enqueueNotifications([
    { notificationId: "malformed" },
  ]);
  assert.equal(useBadgeNotificationStore.getState().currentNotification, null);
  assertArrayEqual(
    useBadgeNotificationStore.getState().queuedNotifications,
    [],
  );

  resetStore();
  useBadgeNotificationStore
    .getState()
    .enqueueNotifications([createBadgeNotification("first")]);
  assert.equal(
    useBadgeNotificationStore.getState().currentNotification.notificationId,
    "first",
  );
  assertArrayEqual(
    useBadgeNotificationStore.getState().queuedNotifications,
    [],
  );
  assertArrayEqual(useBadgeNotificationStore.getState().knownNotificationIds, [
    "first",
  ]);
  assertArrayEqual(useBadgeNotificationStore.getState().knownBadgeIds, [
    "first",
  ]);

  resetStore();
  useBadgeNotificationStore.getState().enqueueNotifications([
    {
      notificationId: 42,
      user_id: "1",
      badge: {
        badge_id: "minimum-badge",
        name: "Minimum Badge",
        metric: "posts_created",
        tier: "gold",
      },
    },
  ]);
  assert.equal(
    useBadgeNotificationStore.getState().currentNotification.notificationId,
    "42",
  );
  assert.equal(
    useBadgeNotificationStore.getState().currentNotification.badge.badgeId,
    "minimum-badge",
  );
  assert.equal(
    useBadgeNotificationStore.getState().currentNotification.badge.metric,
    "postsCreated",
  );
  assert.equal(
    useBadgeNotificationStore.getState().currentNotification.badge.description,
    "You unlocked a new badge.",
  );
  assert.equal(
    useBadgeNotificationStore.getState().currentNotification.badge.symbol,
    "🏆",
  );

  resetStore();
  useBadgeNotificationStore.getState().enqueueNotifications([
    createBadgeNotification("first"),
    createBadgeNotification("second"),
    createBadgeNotification("third"),
  ]);
  assert.equal(
    useBadgeNotificationStore.getState().currentNotification.notificationId,
    "first",
  );
  assertArrayEqual(
    useBadgeNotificationStore
      .getState()
      .queuedNotifications.map((notification) => notification.notificationId),
    ["second", "third"],
  );

  useBadgeNotificationStore.getState().dismissCurrentNotification();
  assert.equal(
    useBadgeNotificationStore.getState().currentNotification.notificationId,
    "second",
  );
  assertArrayEqual(
    useBadgeNotificationStore
      .getState()
      .queuedNotifications.map((notification) => notification.notificationId),
    ["third"],
  );

  useBadgeNotificationStore.getState().dismissCurrentNotification();
  assert.equal(
    useBadgeNotificationStore.getState().currentNotification.notificationId,
    "third",
  );
  assertArrayEqual(
    useBadgeNotificationStore.getState().queuedNotifications,
    [],
  );

  useBadgeNotificationStore.getState().dismissCurrentNotification();
  assert.equal(useBadgeNotificationStore.getState().currentNotification, null);

  resetStore();
  useBadgeNotificationStore.getState().enqueueNotifications([
    createBadgeNotification("dupe"),
    createBadgeNotification("dupe"),
  ]);
  assert.equal(
    useBadgeNotificationStore.getState().currentNotification.notificationId,
    "dupe",
  );
  assertArrayEqual(
    useBadgeNotificationStore.getState().queuedNotifications,
    [],
  );

  resetStore();
  useBadgeNotificationStore.getState().enqueueNotifications([
    createBadgeNotification("socket", "same-badge"),
    createBadgeNotification("pending", "same-badge"),
  ]);
  assert.equal(
    useBadgeNotificationStore.getState().currentNotification.notificationId,
    "socket",
  );
  assertArrayEqual(
    useBadgeNotificationStore.getState().queuedNotifications,
    [],
  );

  useBadgeNotificationStore.getState().dismissCurrentNotification();
  useBadgeNotificationStore.getState().enqueueNotifications([
    createBadgeNotification("socket", "same-badge"),
    createBadgeNotification("pending", "same-badge"),
  ]);
  assert.equal(useBadgeNotificationStore.getState().currentNotification, null);
  assertArrayEqual(useBadgeNotificationStore.getState().knownNotificationIds, [
    "socket",
  ]);
  assertArrayEqual(useBadgeNotificationStore.getState().knownBadgeIds, [
    "same-badge",
  ]);

  resetStore();
  useBadgeNotificationStore
    .getState()
    .queueNotificationReadRetry(["read-1", "read-1", "read-2"]);
  assertArrayEqual(
    useBadgeNotificationStore.getState().readRetryNotificationIds,
    ["read-1", "read-2"],
  );
  assertArrayEqual(
    useBadgeNotificationStore.getState().consumeReadRetryNotificationIds(),
    ["read-1", "read-2"],
  );
  assertArrayEqual(
    useBadgeNotificationStore.getState().readRetryNotificationIds,
    [],
  );

  resetStore();
  useBadgeNotificationStore.getState().enqueueNotifications([
    createBadgeNotification("clear-current"),
    createBadgeNotification("clear-queued"),
  ]);
  useBadgeNotificationStore
    .getState()
    .queueNotificationReadRetry("clear-read");
  useBadgeNotificationStore.getState().clearBadgeNotifications();
  assert.equal(useBadgeNotificationStore.getState().currentNotification, null);
  assertArrayEqual(
    useBadgeNotificationStore.getState().queuedNotifications,
    [],
  );
  assertArrayEqual(useBadgeNotificationStore.getState().knownNotificationIds, []);
  assertArrayEqual(useBadgeNotificationStore.getState().knownBadgeIds, []);
  assertArrayEqual(
    useBadgeNotificationStore.getState().readRetryNotificationIds,
    [],
  );
}

async function testBadgeApi() {
  const apiCalls = [];
  const badgeApi = loadTranspiledModule("services/badgeApi.ts", {
    axios: {
      isAxiosError: () => false,
    },
    "@/utils/apiClient": {
      apiClient: {
        get: async (url) => {
          apiCalls.push(["get", url]);
          return {
            data: {
              notifications: [
                createBadgeNotification("pending-1"),
                {
                  notification_id: 987,
                  user_id: "1",
                  badge_id: "pending-snake",
                  name: "Pending Snake",
                  metric: "likes_received",
                  tier: "silver",
                  created_at: "2026-07-14T00:00:00.000Z",
                },
                { notificationId: "invalid" },
              ],
            },
          };
        },
        post: async (url, body) => {
          apiCalls.push(["post", url, body]);
          return {
            data: {
              notificationIds: ["pending-1", 2, ""],
            },
          };
        },
      },
    },
  });

  const pending = await badgeApi.getPendingBadgeNotifications();

  assert.equal(pending.length, 2);
  assert.equal(pending[0].notificationId, "pending-1");
  assert.equal(pending[1].notificationId, "987");
  assert.equal(pending[1].badge.metric, "likesReceived");
  assert.equal(pending[1].badge.description, "You unlocked a new badge.");
  assert.equal(pending[1].badge.symbol, "🏆");
  assertArrayEqual(apiCalls[0], ["get", "/api/badges/notifications/pending"]);

  const readIds = await badgeApi.markBadgeNotificationsRead([
    " pending-1 ",
    "",
  ]);

  assertArrayEqual(readIds, ["pending-1", "2"]);
  assertArrayEqual(apiCalls[1], [
    "post",
    "/api/badges/notifications/read",
    { notificationIds: ["pending-1"] },
  ]);
}

function testNotificationSocketSingleton() {
  const sockets = [];
  const notificationSocket = loadTranspiledModule(
    "services/notificationSocket.ts",
    {
      "socket.io-client": {
        io: (url, options) => {
          const socket = {
            url,
            options,
            connected: false,
            connectCalls: 0,
            disconnectCalls: 0,
            io: {
              on() {},
              off() {},
            },
            connect() {
              this.connected = true;
              this.connectCalls += 1;
            },
            disconnect() {
              this.connected = false;
              this.disconnectCalls += 1;
            },
            on() {},
            off() {},
          };

          sockets.push(socket);
          return socket;
        },
      },
      "@/utils/apiConfig": {
        getSocketNamespaceUrl: (namespace) =>
          `http://api.local${namespace}`,
        logSocketConfig() {},
      },
    },
  );

  assert.equal(notificationSocket.getNotificationSocket(null), null);
  assert.equal(sockets.length, 0);

  const firstSocket = notificationSocket.getNotificationSocket("token-a");

  assert.equal(firstSocket.url, "http://api.local/notifications");
  assert.equal(firstSocket.options.auth.token, "token-a");
  assert.equal(firstSocket.options.autoConnect, false);
  assert.equal(firstSocket.options.reconnection, true);
  assert.equal(firstSocket.options.tryAllTransports, true);
  assertArrayEqual(firstSocket.options.transports, ["polling", "websocket"]);
  assert.equal(sockets.length, 1);

  firstSocket.connected = false;

  const reusedSocket = notificationSocket.getNotificationSocket("token-a");

  assert.equal(reusedSocket, firstSocket);
  assert.equal(firstSocket.connectCalls, 0);
  assert.equal(sockets.length, 1);

  const secondSocket = notificationSocket.getNotificationSocket("token-b");

  assert.notEqual(secondSocket, firstSocket);
  assert.equal(firstSocket.disconnectCalls, 1);
  assert.equal(secondSocket.options.auth.token, "token-b");
  assert.equal(sockets.length, 2);

  notificationSocket.disconnectNotificationSocket();
  assert.equal(secondSocket.disconnectCalls, 1);

  const thirdSocket = notificationSocket.getNotificationSocket("token-b");

  assert.notEqual(thirdSocket, secondSocket);
  assert.equal(sockets.length, 3);

  notificationSocket.disconnectNotificationSocket("stale-token");
  assert.equal(thirdSocket.disconnectCalls, 0);

  notificationSocket.disconnectNotificationSocket("token-b");
  assert.equal(thirdSocket.disconnectCalls, 1);
}

async function testRealtimeHelpers() {
  const store = loadBadgeStore();
  const realtime = loadTranspiledModule(
    "hooks/ForumHooks/useBadgeRealtimeNotifications.ts",
    {
      react: {
        useEffect() {},
        useRef: (initialValue) => ({ current: initialValue }),
      },
      "react-native": {
        AppState: {
          currentState: "active",
          addEventListener: () => ({ remove() {} }),
        },
      },
      "@/services/badgeApi": {
        getPendingBadgeNotifications: async () => [
          createBadgeNotification("pending-1"),
        ],
        markBadgeNotificationsRead: async (ids) => ids,
      },
      "@/services/notificationSocket": {
        disconnectNotificationSocket() {},
        getNotificationSocket: () => null,
      },
      "@/contexts/NotificationContext": {
        useNotifications: () => ({
          addCenterNotification() {},
        }),
      },
      "@/store/badgeNotificationStore": {
        useBadgeNotificationStore: store,
      },
      "@/utils/apiClient": {
        getAccessToken: async () => null,
      },
    },
  );

  const enqueued = [];
  const accepted = realtime.handleBadgeEarnedSocketPayload(
    {
      recipientUserId: 1,
      notifications: [createBadgeNotification("socket-1")],
      emittedAt: "2026-07-14T00:00:00.000Z",
    },
    1,
    (notifications) => enqueued.push(...notifications),
  );

  assert.equal(accepted, true);
  assertArrayEqual(
    enqueued.map((notification) => notification.notificationId),
    ["socket-1"],
  );

  const acceptedStringUserId = realtime.handleBadgeEarnedSocketPayload(
    {
      recipientUserId: "1",
      notifications: [createBadgeNotification("socket-string-user")],
      emittedAt: "2026-07-14T00:00:00.000Z",
    },
    1,
    (notifications) => enqueued.push(...notifications),
  );

  assert.equal(acceptedStringUserId, true);
  assertArrayEqual(
    enqueued.map((notification) => notification.notificationId),
    ["socket-1", "socket-string-user"],
  );

  const ignored = realtime.handleBadgeEarnedSocketPayload(
    {
      recipientUserId: 2,
      notifications: [createBadgeNotification("socket-2")],
      emittedAt: "2026-07-14T00:00:00.000Z",
    },
    1,
    (notifications) => enqueued.push(...notifications),
  );

  assert.equal(ignored, false);
  assertArrayEqual(
    enqueued.map((notification) => notification.notificationId),
    ["socket-1", "socket-string-user"],
  );

  const pendingLoads = [];
  await realtime.loadPendingBadgeNotifications(
    (notifications) => pendingLoads.push(...notifications),
    async () => [createBadgeNotification("connect-pending")],
  );
  await realtime.loadPendingBadgeNotifications(
    (notifications) => pendingLoads.push(...notifications),
    async () => [createBadgeNotification("reconnect-pending")],
  );
  assertArrayEqual(
    pendingLoads.map((notification) => notification.notificationId),
    ["connect-pending", "reconnect-pending"],
  );

  const retryQueue = [];
  const acknowledgedIds = await realtime.retryBadgeNotificationReadAcks({
    consumeReadRetryNotificationIds: () => ["read-1", "read-2"],
    queueNotificationReadRetry: (ids) => retryQueue.push(ids),
    markRead: async () => ["read-1"],
  });

  assertArrayEqual(acknowledgedIds, ["read-1"]);
  assertArrayEqual(retryQueue, [["read-2"]]);

  const failedRetryQueue = [];
  const failedAcknowledgedIds = await realtime.retryBadgeNotificationReadAcks({
    consumeReadRetryNotificationIds: () => ["read-3"],
    queueNotificationReadRetry: (ids) => failedRetryQueue.push(ids),
    markRead: async () => {
      throw new Error("network");
    },
  });

  assertArrayEqual(failedAcknowledgedIds, []);
  assertArrayEqual(failedRetryQueue, [["read-3"]]);

  const preparationOrder = [];
  const currentToken = await realtime.prepareNotificationSocketAccess({
    token: "fresh-token",
    recoverPendingNotifications: async () => {
      preparationOrder.push("recover");
    },
    getStoredAccessToken: async () => {
      preparationOrder.push("token");
      return "fresh-token";
    },
  });

  assert.equal(currentToken, "fresh-token");
  assertArrayEqual(preparationOrder, ["recover", "token"]);

  const replacedToken = await realtime.prepareNotificationSocketAccess({
    token: "expired-token",
    recoverPendingNotifications: async () => {},
    getStoredAccessToken: async () => "refreshed-token",
  });

  assert.equal(replacedToken, null);

  const centerNotifications = [];
  const acceptedLike = realtime.handleLikeNotificationSocketPayload(
    {
      id: "like-event-1",
      recipientUserId: 1,
      postId: "post-1",
      actorUserId: 2,
      actorUsername: "jordan",
      createdAt: "2026-07-14T00:00:00.000Z",
    },
    1,
    (notification) => centerNotifications.push(notification),
  );

  assert.equal(acceptedLike, true);
  assert.equal(centerNotifications.length, 1);
  assert.equal(centerNotifications[0].id, "like:like-event-1");
  assert.equal(centerNotifications[0].postId, "post-1");
  assert.equal(centerNotifications[0].actorUsername, "jordan");

  const mismatchedLike = realtime.handleLikeNotificationSocketPayload(
    {
      id: "like-event-2",
      recipientUserId: 2,
      postId: "post-1",
      actorUserId: 3,
      actorUsername: "alex",
      createdAt: "2026-07-14T00:01:00.000Z",
    },
    1,
    (notification) => centerNotifications.push(notification),
  );
  const selfLike = realtime.handleLikeNotificationSocketPayload(
    {
      id: "like-event-3",
      recipientUserId: 1,
      postId: "post-1",
      actorUserId: 1,
      actorUsername: "owner",
      createdAt: "2026-07-14T00:02:00.000Z",
    },
    1,
    (notification) => centerNotifications.push(notification),
  );

  assert.equal(mismatchedLike, false);
  assert.equal(selfLike, false);
  assert.equal(centerNotifications.length, 1);
}

function createCenterLike(
  id,
  postId,
  actorUsername,
  createdAt,
  actorUserId,
) {
  return {
    id,
    type: "likes",
    title: "New Like",
    text: "",
    postId,
    actorUsername,
    actorUsernames: [actorUsername],
    ...(actorUserId
      ? { userId: String(actorUserId), actorUserIds: [String(actorUserId)] }
      : {}),
    likeCount: 1,
    readAt: null,
    createdAt,
  };
}

function testNotificationCenterGrouping() {
  const center = loadTranspiledModule("utils/notificationCenter.ts");
  let notifications = [];

  notifications = center.addCenterNotificationToState(
    notifications,
    createCenterLike(
      "like:1",
      "post-1",
      "jordan",
      "2026-07-14T00:00:00.000Z",
      2,
    ),
  );
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].title, "New Like");
  assert.equal(notifications[0].text, "@jordan liked your post");
  assert.equal(notifications[0].likeCount, 1);

  notifications = center.addCenterNotificationToState(
    notifications,
    createCenterLike(
      "like:1",
      "post-1",
      "jordan",
      "2026-07-14T00:00:00.000Z",
      2,
    ),
  );
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].text, "@jordan liked your post");
  assert.equal(notifications[0].likeCount, 1);

  notifications = center.addCenterNotificationToState(
    notifications,
    createCenterLike(
      "like:2",
      "post-1",
      "alex",
      "2026-07-14T00:01:00.000Z",
    ),
  );
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].title, "2 new likes");
  assert.equal(notifications[0].text, "@jordan and @alex liked your post");

  notifications = center.addCenterNotificationToState(
    notifications,
    createCenterLike(
      "like:3",
      "post-1",
      "sam",
      "2026-07-14T00:02:00.000Z",
    ),
  );
  assert.equal(notifications[0].title, "3 new likes");
  assert.equal(
    notifications[0].text,
    "@jordan, @alex and 1 other liked your post",
  );

  notifications = center.addCenterNotificationToState(
    notifications,
    createCenterLike(
      "like:4",
      "post-1",
      "lee",
      "2026-07-14T00:03:00.000Z",
    ),
  );
  notifications = center.addCenterNotificationToState(
    notifications,
    createCenterLike(
      "like:5",
      "post-1",
      "morgan",
      "2026-07-14T00:04:00.000Z",
    ),
  );
  assert.equal(notifications[0].title, "5 new likes");
  assert.equal(
    notifications[0].text,
    "@jordan, @alex and 3 others liked your post",
  );

  notifications = center.addCenterNotificationToState(
    notifications,
    createCenterLike(
      "like:duplicate-actor",
      "post-1",
      "@Jordan",
      "2026-07-14T00:05:00.000Z",
      2,
    ),
  );
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].likeCount, 5);

  notifications = center.addCenterNotificationToState(
    notifications,
    createCenterLike(
      "like:other-post",
      "post-2",
      "casey",
      "2026-07-14T00:06:00.000Z",
    ),
  );
  assert.equal(notifications.length, 2);
  assert.equal(notifications[0].postId, "post-2");

  const readGroup = {
    ...notifications.find((notification) => notification.postId === "post-1"),
    readAt: "2026-07-14T00:07:00.000Z",
  };
  notifications = [
    readGroup,
    ...notifications.filter((notification) => notification.postId !== "post-1"),
  ];
  notifications = center.addCenterNotificationToState(
    notifications,
    createCenterLike(
      "like:after-read",
      "post-1",
      "newuser",
      "2026-07-14T00:08:00.000Z",
    ),
  );

  const postOneGroups = notifications.filter(
    (notification) => notification.postId === "post-1",
  );
  assert.equal(postOneGroups.length, 2);
  assert.equal(postOneGroups[0].title, "New Like");
  assert.equal(postOneGroups[0].text, "@newuser liked your post");
  assert.equal(postOneGroups[1].likeCount, 5);
  assert.ok(postOneGroups[1].readAt);

  let messageNotifications = [];
  const createMessage = (id, createdAt) => ({
    id,
    type: "messages",
    title: "New Message",
    text: "hello",
    conversationId: "conversation-1",
    senderUsername: "sender",
    messageCount: 1,
    readAt: null,
    createdAt,
  });
  messageNotifications = center.addCenterNotificationToState(
    messageNotifications,
    createMessage("message:1", "2026-07-14T01:00:00.000Z"),
  );
  messageNotifications = center.addCenterNotificationToState(
    messageNotifications,
    createMessage("message:2", "2026-07-14T01:01:00.000Z"),
  );
  assert.equal(messageNotifications.length, 1);
  assert.equal(messageNotifications[0].title, "2 new messages");
  assert.equal(messageNotifications[0].messageCount, 2);

  assert.equal(
    center.getUnreadCenterNotificationCount([
      {
        ...messageNotifications[0],
        messageCount: 3,
      },
      createCenterLike(
        "like:weighted",
        "post-3",
        "first",
        "2026-07-14T02:00:00.000Z",
      ),
      {
        id: "comment:1",
        type: "comments",
        title: "New Comment",
        text: "Commented on your post",
        readAt: null,
        createdAt: "2026-07-14T02:01:00.000Z",
      },
    ].map((notification) =>
      notification.id === "like:weighted"
        ? { ...notification, likeCount: 4 }
        : notification,
    )),
    8,
  );

  assert.equal(
    center.getNotificationCenterHref(createCenterLike(
      "like:route",
      "post-route",
      "jordan",
      "2026-07-14T03:00:00.000Z",
    )),
    "/post/post-route",
  );

  const hydratedWithLiveNotification = center.mergeCenterNotificationStates(
    [
      createCenterLike(
        "like:persisted",
        "post-hydration",
        "persisted-user",
        "2026-07-14T04:00:00.000Z",
        10,
      ),
    ],
    [
      createCenterLike(
        "like:live",
        "post-hydration",
        "live-user",
        "2026-07-14T04:01:00.000Z",
        11,
      ),
    ],
  );

  assert.equal(hydratedWithLiveNotification.length, 1);
  assert.equal(hydratedWithLiveNotification[0].title, "2 new likes");
  assert.equal(
    hydratedWithLiveNotification[0].text,
    "@persisted-user and @live-user liked your post",
  );
  assert.equal(
    center.getUnreadCenterNotificationCount(hydratedWithLiveNotification),
    2,
  );
}

function testBadgeAwardResponsesOnlyRefresh() {
  let refreshCount = 0;
  const badgeNotifications = loadTranspiledModule(
    "hooks/ForumHooks/useBadgeNotifications.ts",
    {
      react: {
        useCallback: (callback) => callback,
      },
      "@/store/badgeNotificationStore": {
        useBadgeNotificationStore: (selector) =>
          selector({
            requestBadgeRefresh: () => {
              refreshCount += 1;
            },
          }),
      },
    },
  );

  const { handleBadgeAwards, requestBadgeDataRefresh } =
    badgeNotifications.useBadgeNotifications();

  handleBadgeAwards([
    {
      badgeId: "legacy-http-award",
      name: "Legacy HTTP Award",
      tier: "bronze",
      earnedAt: "2026-07-14T00:00:00.000Z",
    },
  ]);
  handleBadgeAwards([]);
  requestBadgeDataRefresh();

  assert.equal(refreshCount, 2);
}

(async () => {
  testBadgeNotificationStore();
  await testBadgeApi();
  testNotificationSocketSingleton();
  await testRealtimeHelpers();
  testNotificationCenterGrouping();
  testBadgeAwardResponsesOnlyRefresh();

  console.log("Badge and Notification Center tests passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
